"""Meta Responses API adapter for Groundline image fact extraction.

The image path was verified live on 27 Oct 2026. A sanitized response fixture
from a subsequent synthetic-label call is replayed offline by the shared
capability router. All live requests pin reasoning effort and ``store=False``.
"""
from __future__ import annotations

import json
import os
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

import httpx

from app.model_types import (
    Capability,
    ModelResult,
    ProviderResponseError,
    ProviderTransportError,
    Usage,
)

MODEL_ID = "muse-spark-1.3"
BASE_URL = "https://api.meta.ai/v1"
RESPONSES_PATH = "/responses"
API_KEY_ENV = "MODEL_API_KEY"
DEFAULT_EFFORT = "minimal"
ALLOWED_EFFORTS = ("minimal", "low", "medium", "high")
MAX_ATTEMPTS = 2
DEFAULT_TIMEOUT = 30.0
DEFAULT_MAX_OUTPUT_TOKENS = 512
FIXTURES_DIR = Path(__file__).resolve().parent.parent / "fixtures"
DEFAULT_FIXTURE = "analyze_label.json"  # historical text-oriented response
IMAGE_FIXTURE = "muse_spark_image_response.json"
PRICE_INPUT_PER_M = 1.25
PRICE_OUTPUT_PER_M = 4.25

MetaClientError = ProviderTransportError
MetaResponseError = ProviderResponseError
MetaTransportError = ProviderTransportError


def _load_fixture(name: str) -> dict:
    with (FIXTURES_DIR / name).open("r", encoding="utf-8") as fh:
        return json.load(fh)


def _coerce_usage(raw: Optional[dict]) -> Usage:
    raw = raw if isinstance(raw, dict) else {}
    in_raw = raw.get("input_tokens", raw.get("prompt_tokens"))
    out_raw = raw.get("output_tokens", raw.get("completion_tokens"))
    input_tokens = int(in_raw or 0)
    output_tokens = int(out_raw or 0)
    total = int(raw.get("total_tokens") or input_tokens + output_tokens)
    cost = round(
        input_tokens / 1_000_000 * PRICE_INPUT_PER_M
        + output_tokens / 1_000_000 * PRICE_OUTPUT_PER_M,
        6,
    )
    return Usage(input_tokens, output_tokens, total, estimated_cost_usd=cost,
                 complete=in_raw is not None and out_raw is not None)


def _objective_instruction(objective: str) -> str:
    return (
        "You are reading a label or document for a software agent. "
        "Extract only the visible facts you can actually see. Do not guess. "
        f"The user's objective is: {objective}\n"
        'Respond with ONLY a JSON object of the form '
        '{"facts":[{"label":str,"value":str,"confidence":number between 0 and 1}],'
        '"overall_confidence":number between 0 and 1}. No prose.'
    )


def build_image_input(
    image_data_url: str, objective: str, *, instruction_override: str | None = None
) -> list[dict]:
    """Build the verified Responses API input_image data-URL content shape."""
    return [{
        "role": "user",
        "content": [
            {"type": "input_text", "text": instruction_override or _objective_instruction(objective)},
            {"type": "input_image", "image_url": image_data_url},
        ],
    }]


def _extract_output_text(body: dict) -> str:
    top = body.get("output_text")
    if isinstance(top, str) and top.strip():
        return top
    chunks: list[str] = []
    for item in body.get("output") or []:
        if not isinstance(item, dict) or item.get("type") != "message":
            continue
        for part in item.get("content") or []:
            if isinstance(part, dict) and part.get("type") == "output_text":
                text = part.get("text")
                if isinstance(text, str):
                    chunks.append(text)
    return "".join(chunks)


def parse_response(body: dict, *, elapsed_ms: int, mode: str) -> ModelResult:
    """Parse a typed Meta Responses envelope without returning partial output."""
    if not isinstance(body, dict):
        raise ProviderResponseError("Meta response was not a JSON object")
    status = body.get("status")
    if body.get("error") is not None:
        raise ProviderResponseError(f"Meta returned an error envelope (status={status!r})")
    if status != "completed":
        raise ProviderResponseError(f"Meta response not completed (status={status!r})")
    text = _extract_output_text(body)
    if not text.strip():
        raise ProviderResponseError("Meta completed response contained no output text")
    return ModelResult(
        text=text,
        model=str(body.get("model") or MODEL_ID),
        usage=_coerce_usage(body.get("usage")),
        elapsed_ms=elapsed_ms,
        mode=mode,
        status="completed",
        response_id=body.get("id") if isinstance(body.get("id"), str) else None,
    )


def use_mock() -> bool:
    """Meta-specific mode check retained for health checks and compatibility."""
    return os.environ.get("GROUNDLINE_FORCE_MOCK") == "1" or not os.environ.get(API_KEY_ENV)


@dataclass(frozen=True)
class MetaClient:
    name: str = "meta"
    capabilities: frozenset[Capability] = frozenset({Capability.IMAGE_FACT_EXTRACTION})
    base_url: str = BASE_URL
    path: str = RESPONSES_PATH
    model_id: str = MODEL_ID
    key_env: str = API_KEY_ENV
    fixture: str = IMAGE_FIXTURE

    def load_fixture(self) -> dict:
        return _load_fixture(self.fixture)

    def build_payload(
        self, *, objective: str, image_data_url: str, effort: str = DEFAULT_EFFORT,
        max_output_tokens: int = DEFAULT_MAX_OUTPUT_TOKENS,
        instruction_override: str | None = None,
    ) -> dict:
        if effort not in ALLOWED_EFFORTS:
            raise ValueError(f"effort must be one of {ALLOWED_EFFORTS}, got {effort!r}")
        return {
            "model": self.model_id,
            "input": build_image_input(
                image_data_url, objective, instruction_override=instruction_override
            ),
            "reasoning": {"effort": effort},
            "store": False,
            "max_output_tokens": max_output_tokens,
        }

    def parse(self, body: dict, *, elapsed_ms: int, mode: str) -> ModelResult:
        return parse_response(body, elapsed_ms=elapsed_ms, mode=mode)

    def complete_live(
        self, *, objective: str, image_data_url: str, effort: str = DEFAULT_EFFORT,
        max_output_tokens: int = DEFAULT_MAX_OUTPUT_TOKENS,
        timeout: float = DEFAULT_TIMEOUT,
        max_attempts: int = MAX_ATTEMPTS,
        instruction_override: str | None = None,
    ) -> ModelResult:
        key = os.environ.get(self.key_env)
        if not key:
            raise ProviderTransportError("Meta credential is not configured")
        payload = self.build_payload(
            objective=objective, image_data_url=image_data_url, effort=effort,
            max_output_tokens=max_output_tokens,
            instruction_override=instruction_override,
        )
        headers = {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}
        last_error: ProviderTransportError | None = None
        started = time.monotonic()
        if not 1 <= max_attempts <= MAX_ATTEMPTS:
            raise ValueError(f"max_attempts must be between 1 and {MAX_ATTEMPTS}")
        for _attempt in range(max_attempts):
            try:
                with httpx.Client(base_url=self.base_url, timeout=timeout) as client:
                    response = client.post(self.path, json=payload, headers=headers)
                elapsed = int((time.monotonic() - started) * 1000)
                if response.status_code >= 500:
                    last_error = ProviderTransportError(
                        f"Meta transient HTTP failure ({response.status_code})"
                    )
                    continue
                if response.status_code >= 400:
                    raise ProviderTransportError(
                        f"Meta request rejected (HTTP {response.status_code})"
                    )
                try:
                    body = response.json()
                except ValueError as exc:
                    raise ProviderResponseError("Meta returned invalid JSON") from exc
                return self.parse(body, elapsed_ms=elapsed, mode="live")
            except (httpx.TimeoutException, httpx.TransportError) as exc:
                last_error = ProviderTransportError(
                    f"Meta transport failure ({type(exc).__name__})"
                )
        raise last_error or ProviderTransportError("Meta request failed")
