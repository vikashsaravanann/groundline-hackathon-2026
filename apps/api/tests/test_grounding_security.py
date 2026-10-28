"""Restricted grounding authorization/quota tests with an in-memory Redis double."""
from __future__ import annotations

import asyncio

import pytest

from app import grounding_security


def test_access_token_is_required_and_compared_against_server_setting(monkeypatch):
    monkeypatch.setenv("GROUNDLINE_GROUNDING_ACCESS_TOKEN", "sentinel-access-only")
    assert grounding_security.token_is_valid("sentinel-access-only")
    assert not grounding_security.token_is_valid("wrong")
    monkeypatch.delenv("GROUNDLINE_GROUNDING_ACCESS_TOKEN")
    assert not grounding_security.token_is_valid("sentinel-access-only")


def test_live_quota_fails_closed_when_shared_redis_is_not_configured(monkeypatch):
    monkeypatch.delenv("GROUNDLINE_GROUNDING_QUOTA_REDIS_URL", raising=False)
    with pytest.raises(grounding_security.GroundingQuotaUnavailable):
        asyncio.run(grounding_security.reserve_live_grounding(access_token="x", client_ip="127.0.0.1"))


def test_quota_uses_shared_redis_lease_and_releases_exact_lease(monkeypatch):
    calls = []

    class FakeRedis:
        async def eval(self, *args):
            calls.append(args)
            return 1

        async def aclose(self):
            calls.append(("aclose",))

    monkeypatch.setenv("GROUNDLINE_GROUNDING_QUOTA_REDIS_URL", "redis://quota.invalid:6379/0")
    monkeypatch.setattr(grounding_security.Redis, "from_url", lambda *args, **kwargs: FakeRedis())
    reservation = asyncio.run(grounding_security.reserve_live_grounding(access_token="demo", client_ip="127.0.0.1"))
    assert calls[0][1] == 6
    assert len(calls[0][2:8]) == 6
    assert calls[0][-1] == reservation.lease_id
    asyncio.run(reservation.release())
    assert calls[1][0] == grounding_security._RELEASE_CONCURRENCY
    assert calls[1][-1] == reservation.lease_id
    assert calls[2] == ("aclose",)


def test_quota_rejection_does_not_create_a_reservation(monkeypatch):
    calls = []

    class FakeRedis:
        async def eval(self, *args):
            calls.append(args)
            return 0

        async def aclose(self):
            calls.append(("aclose",))

    monkeypatch.setenv("GROUNDLINE_GROUNDING_QUOTA_REDIS_URL", "redis://quota.invalid:6379/0")
    monkeypatch.setattr(grounding_security.Redis, "from_url", lambda *args, **kwargs: FakeRedis())
    with pytest.raises(grounding_security.GroundingQuotaExceeded):
        asyncio.run(grounding_security.reserve_live_grounding(access_token="demo", client_ip="127.0.0.1"))
    assert calls[-1] == ("aclose",)
