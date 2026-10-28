"""Fail-closed restricted-LIVE access and shared grounding quotas."""
from __future__ import annotations

import hashlib
import hmac
import os
import uuid
from dataclasses import dataclass

from redis.asyncio import Redis
from redis.exceptions import RedisError


class GroundingAccessError(Exception):
    """Access is absent or invalid; never includes either token value."""


class GroundingQuotaUnavailable(Exception):
    """Shared quota storage is missing or unreachable, so LIVE must fail closed."""


class GroundingQuotaExceeded(Exception):
    pass


def token_is_valid(candidate: str | None) -> bool:
    expected = os.environ.get("GROUNDLINE_GROUNDING_ACCESS_TOKEN", "")
    if not expected or not candidate:
        return False
    return hmac.compare_digest(candidate, expected)


_RESERVE_COUNTERS = """
local limits = {tonumber(ARGV[1]), tonumber(ARGV[2]), tonumber(ARGV[3]),
                tonumber(ARGV[4]), tonumber(ARGV[5])}
for i = 1, #KEYS - 1 do
  local current = tonumber(redis.call('GET', KEYS[i]) or '0')
  if current >= limits[i] then return 0 end
end
for i = 1, #KEYS - 1 do
  local current = redis.call('INCR', KEYS[i])
  if current == 1 then redis.call('EXPIRE', KEYS[i], tonumber(ARGV[6 + i])) end
end
local now = redis.call('TIME')
local now_ms = tonumber(now[1]) * 1000 + math.floor(tonumber(now[2]) / 1000)
redis.call('ZREMRANGEBYSCORE', KEYS[#KEYS], '-inf', now_ms)
local active = tonumber(redis.call('ZCARD', KEYS[#KEYS]) or '0')
if active >= limits[#limits] then
  for i = 1, #KEYS - 1 do redis.call('DECR', KEYS[i]) end
  return 0
end
redis.call('ZADD', KEYS[#KEYS], now_ms + tonumber(ARGV[12]), ARGV[13])
redis.call('PEXPIRE', KEYS[#KEYS], tonumber(ARGV[12]) * 2)
return 1
"""

_RELEASE_CONCURRENCY = """
return redis.call('ZREM', KEYS[1], ARGV[1])
"""


@dataclass
class GroundingReservation:
    redis: Redis
    concurrency_key: str
    lease_id: str

    async def release(self) -> None:
        try:
            await self.redis.eval(_RELEASE_CONCURRENCY, 1, self.concurrency_key, self.lease_id)
        finally:
            await self.redis.aclose()


async def reserve_live_grounding(
    *, access_token: str, client_ip: str
) -> GroundingReservation:
    """Reserve hourly/daily token/IP/global quotas and one shared concurrency slot.

    Redis is mandatory for LIVE. If it is absent or unavailable, callers must
    return 503 instead of attempting a billable model request.
    """
    redis_url = os.environ.get("GROUNDLINE_GROUNDING_QUOTA_REDIS_URL")
    if not redis_url:
        raise GroundingQuotaUnavailable("Shared grounding quota is not configured")
    token_hash = hashlib.sha256(access_token.encode("utf-8")).hexdigest()
    ip_hash = hashlib.sha256(client_ip.encode("utf-8")).hexdigest()
    prefix = "groundline:ground:v1"
    keys = [
        f"{prefix}:token:{token_hash}:hour",
        f"{prefix}:token:{token_hash}:day",
        f"{prefix}:ip:{ip_hash}:hour",
        f"{prefix}:ip:{ip_hash}:day",
        f"{prefix}:global:day",
        f"{prefix}:concurrent",
    ]
    limits = (
        int(os.environ.get("GROUNDLINE_GROUNDING_MAX_PER_TOKEN_HOUR", "5")),
        int(os.environ.get("GROUNDLINE_GROUNDING_MAX_PER_TOKEN_DAY", "10")),
        int(os.environ.get("GROUNDLINE_GROUNDING_MAX_PER_IP_HOUR", "3")),
        int(os.environ.get("GROUNDLINE_GROUNDING_MAX_PER_IP_DAY", "10")),
        int(os.environ.get("GROUNDLINE_GROUNDING_MAX_GLOBAL_DAY", "10")),
        int(os.environ.get("GROUNDLINE_GROUNDING_MAX_CONCURRENT", "2")),
    )
    if any(limit <= 0 for limit in limits):
        raise GroundingQuotaUnavailable("Grounding quota configuration is invalid")
    lease_id = uuid.uuid4().hex
    redis = Redis.from_url(redis_url, socket_connect_timeout=1, socket_timeout=1)
    try:
        reserved = await redis.eval(
            _RESERVE_COUNTERS,
            len(keys),
            *keys,
            *limits,
            3600,
            86400,
            3600,
            86400,
            86400,
            120_000,
            lease_id,
        )
        if not reserved:
            await redis.aclose()
            raise GroundingQuotaExceeded("Grounding request quota exceeded")
        return GroundingReservation(redis=redis, concurrency_key=keys[-1], lease_id=lease_id)
    except (GroundingQuotaExceeded, GroundingQuotaUnavailable):
        raise
    except RedisError as exc:
        await redis.aclose()
        raise GroundingQuotaUnavailable("Shared grounding quota is unavailable") from exc
    except Exception as exc:
        await redis.aclose()
        raise GroundingQuotaUnavailable("Shared grounding quota is unavailable") from exc
