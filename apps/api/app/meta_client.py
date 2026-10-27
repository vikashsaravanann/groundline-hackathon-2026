"""Single entry point for every Meta Model API call.

Cost discipline lives here. This is the most expensive code in the project, so
the rules are enforced in one place:

* Every request pins ``reasoning.effort`` explicitly (never by omission) and
  ``store`` to ``false``.
* One hard timeout and at most one retry, so a single call makes at most
  ``MAX_ATTEMPTS`` HTTP attempts.
* The typed ``output[]`` array is parsed properly (a reasoning item then a
  message item); a non-``completed`` status or a non-null ``error`` raises a
  typed error rather than returning empty text.
* ``MODEL_API_KEY`` is read from the environment. It is never logged, never put
  in an exception message, and never placed on a returned object.

docs/SECURITY.md rule 7: when no key is configured, or ``GROUNDLINE_FORCE_MOCK``
is ``1``, the adapter serves a recorded fixture and marks the result
``mode="MOCK"``. A fixture is never presented as a live model call.

The live *image* wire-format (``input_image`` data URL) mirrors the Responses
convention the endpoint already follows (``reasoning``, ``store``, typed
``output[]``). The recorded fixture was captured over the verified *text* path;
the image path's live behaviour is not yet independently verified, so the demo
runs in MOCK. See docs/NEW_WORK.md.
"""
from __future__ import annotations

import json
import os
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Optional

import httpx

MODEL_ID = "muse-spark-1.3"
BASE_URL = "https://api.meta.ai/v1"
RESPONSES_PATH = "/responses"

# Cheapest reasoning level the API accepts. Reading visible facts off a label is
# extraction, not deliberation, so it defaults to the floor. Only the planner
# (which does not exist yet) should raise this.
DEFAULT_EFFORT = "minimal"
ALLOWED_EFFORTS = ("minimal", "low", "medium", "high")

# A single call makes at most this many HTTP attempts: the first, then one retry.
MAX_ATTEMPTS = 2
# Seconds. A hard ceiling so a hung upstream cannot stall a request forever.
DEFAULT_TIMEOUT = 30.0
# Enough headroom that `minimal` reasoning still leaves room for real output
# text, but capped so one call cannot run away with the budget.
DEFAULT_MAX_OUTPUT_TOKENS = 512

FIXTURES_DIR = Path(__file__).resolve().parent.parent / "fixtures"
DEFAULT_FIXTURE = "analyze_label.json"

# muse-spark-1.3 list price, US dollars per million tokens (recorded Day 1).
PRICE_INPUT_PER_M = 1.25
PRICE_OUTPUT_PER_M = 4.25


class MetaClientError(Exception):
    """Base class for adapter failures. Messages never contain the API key."""


class MetaResponseError(MetaClientError):
    """Upstream returned a non-success envelope: ``status`` is not ``completed``,
    ``error`` is non-null, or a completed response carried no output text. Raised
    instead of returning empty text."""


class MetaTransportError(MetaClientError):
    """The request could not be completed (timeout, connection, or HTTP status)."""


@dataclass(frozen=True)
class Usage:
    input_tokens: int
    output_tokens: int
    total_tokens: int

    @property
    def estimated_cost_usd(self) -> float:
        return round(
            self.input_tokens / 1_000_000 * PRICE_INPUT_PER_M
            + self.output_tokens / 1_000_000 * PRICE_OUTPUT_PER_M,
            6,
        )


@dataclass(frozen=True)
class ModelResult:
    text: str
    model: str
    usage: Usage
    elapsed_ms: int
    mode: str  # "live" or "MOCK"
    status: str


def _coerce_usage(raw: Optional[dict]) -> Usage:
    raw = raw or {}
    input_tokens = int(raw.get("input_tokens") or raw.get("prompt_tokens") or 0)
    output_tokens = int(raw.get("output_tokens") or raw.get("completion_tokens") or 0)
    total = int(raw.get("total_tokens") or (input_tokens + output_tokens))
    return Usage(input_tokens, output_tokens, total)


def _extract_output_text(body: dict) -> str:
    """Pull assistant text out of the typed ``output[]`` array.

    The response is not chat-completions shaped: ``output`` is a list of typed
    items (a reasoning item, then a message item). Assistant text lives in the
    message item's ``content`` array under ``type == "output_text"``. The
    top-level ``output_text`` convenience field is preferred when present.
    """
    top = body.get("output_text")
    if isinstance(top, str) and top.strip():
        return top
    chunks: list[str] = []
    for item in body.get("output") or []:
        if not isinstance(item, dict) or item.get("type") != "message":
            continue  # skip reasoning (and any other) items
        for part in item.get("content") or []:
            if isinstance(part, dict) and part.get("type") == "output_text":
                text = part.get("text")
                if isinstance(text, str):
                    chunks.append(text)
    return "".join(chunks)


def parse_response(body: dict, *, elapsed_ms: int, mode: str) -> ModelResult:
    """Turn a raw response envelope into a ModelResult, or raise a typed error.

    Note we deliberately do not interpolate upstream ``error`` content into the
    message: it could echo request material. The caller gets the status, not the
    provider's prose.
    """
    status = body.get("status")
    if body.get("error") is not None:
        raise MetaResponseError(
            f"model returned an error envelope (status={status!r})"
        )
    if status != "completed":
        raise MetaResponseError(
            f"model response not completed (status={status!r}); "
            "refusing to return partial text"
        )
    text = _extract_output_text(body)
    if not text.strip():
        raise MetaResponseError(
            "model response completed but contained no output text"
        )
    return ModelResult(
        text=text,
        model=str(body.get("model") or MODEL_ID),
        usage=_coerce_usage(body.get("usage")),
        elapsed_ms=elapsed_ms,
        mode=mode,
        status=str(status),
    )


def use_mock() -> bool:
    """MOCK when forced, or when no key is configured (rule 7)."""
    if os.environ.get("GROUNDLINE_FORCE_MOCK") == "1":
        return True
    return not os.environ.get("MODEL_API_KEY")


def _load_fixture(name: str) -> dict:
    path = FIXTURES_DIR / name
    with path.open("r", encoding="utf-8") as fh:
        return json.load(fh)


def build_image_input(image_data_url: str, objective: str) -> list[dict]:
    """Assemble a Responses-style image+text input.

    Used on the live path only; MOCK ignores the input and serves the fixture.
    """
    instruction = (
        "You are reading a label or document for a software agent. "
        "Extract only the visible facts you can actually see. Do not guess. "
        f"The user's objective is: {objective}\n"
        'Respond with ONLY a JSON object of the form '
        '{"facts":[{"label":str,"value":str,"confidence":number between 0 and 1}],'
        '"overall_confidence":number between 0 and 1}. No prose.'
    )
    return [
        {
            "role": "user",
            "content": [
                {"type": "input_text", "text": instruction},
                {"type": "input_image", "image_url": image_data_url},
            ],
        }
    ]


def call_model(
    *,
    input: Any,
    effort: str = DEFAULT_EFFORT,
    max_output_tokens: int = DEFAULT_MAX_OUTPUT_TOKENS,
    timeout: float = DEFAULT_TIMEOUT,
    mock_fixture: str = DEFAULT_FIXTURE,
) -> ModelResult:
    """The one entry point for all model calls.

    In MOCK mode the recorded fixture is parsed through the exact same path as a
    live response, so MOCK and live cannot drift. In live mode the request pins
    effort and ``store=false``, applies a hard timeout, and retries at most once.
    """
    if effort not in ALLOWED_EFFORTS:
        raise ValueError(f"effort must be one of {ALLOWED_EFFORTS}, got {effort!r}")

    if use_mock():
        body = _load_fixture(mock_fixture)
        return parse_response(body, elapsed_ms=0, mode="MOCK")

    api_key = os.environ.get("MODEL_API_KEY")
    if not api_key:  # defensive: use_mock() already covers this
        body = _load_fixture(mock_fixture)
        return parse_response(body, elapsed_ms=0, mode="MOCK")

    payload = {
        "model": MODEL_ID,
        "input": input,
        "reasoning": {"effort": effort},
        "store": False,
        "max_output_tokens": max_output_tokens,
    }
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    last_exc: Optional[MetaClientError] = None
    start = time.monotonic()
    for _attempt in range(MAX_ATTEMPTS):
        try:
            with httpx.Client(base_url=BASE_URL, timeout=timeout) as client:
                resp = client.post(RESPONSES_PATH, json=payload, headers=headers)
            elapsed_ms = int((time.monotonic() - start) * 1000)
            if resp.status_code >= 500:
                # Transient upstream; retry if an attempt remains.
                last_exc = MetaTransportError(f"upstream HTTP {resp.status_code}")
                continue
            if resp.status_code >= 400:
                # Client error; do not retry and do not echo the body, which may
                # reflect request headers or inputs.
                raise MetaTransportError(
                    f"request rejected with HTTP {resp.status_code}"
                )
            return parse_response(resp.json(), elapsed_ms=elapsed_ms, mode="live")
        except (httpx.TimeoutException, httpx.TransportError) as exc:
            # Never interpolate the exception text: it can carry the full URL.
            last_exc = MetaTransportError(f"transport failure ({type(exc).__name__})")
            continue
    raise last_exc or MetaTransportError("request failed")
