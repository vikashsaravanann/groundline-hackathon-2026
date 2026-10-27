"""Offline-tested Baseten OpenAI-compatible chat-completions adapter.

No production capability routes here by default. The participant-supplied
hackathon model identifier is intentionally preserved and is not live-verified.
"""
from __future__ import annotations

import json
import os
import time
from dataclasses import dataclass
from pathlib import Path

import httpx

from app.model_types import (
    Capability,
    ModelResult,
    ProviderResponseError,
    ProviderTransportError,
    Usage,
)

BASE_URL = "https://inference.baseten.co/v1"
MODEL_ID = "meta-models/muse-spark-open-1026"
API_KEY_ENV = "BASETEN_API_KEY"
CHAT_COMPLETIONS_PATH = "/chat/completions"
DEFAULT_MAX_TOKENS = 4096
DEFAULT_TIMEOUT = 60.0
FIXTURES_DIR = Path(__file__).resolve().parent.parent / "fixtures"
SYNTHETIC_FIXTURE = "baseten_chat_completion_synthetic.json"


def _usage(raw: object) -> Usage:
    if raw is None:
        return Usage(0, 0, 0, estimated_cost_usd=None, complete=False)
    if not isinstance(raw, dict):
        raise ProviderResponseError("Baseten usage field has an unexpected shape")
    input_raw = raw.get("prompt_tokens")
    output_raw = raw.get("completion_tokens")
    total_raw = raw.get("total_tokens")
    try:
        input_tokens = int(input_raw) if input_raw is not None else 0
        output_tokens = int(output_raw) if output_raw is not None else 0
        total_tokens = int(total_raw) if total_raw is not None else input_tokens + output_tokens
    except (TypeError, ValueError) as exc:
        raise ProviderResponseError("Baseten usage counters are invalid") from exc
    if min(input_tokens, output_tokens, total_tokens) < 0:
        raise ProviderResponseError("Baseten usage counters must be non-negative")
    return Usage(
        input_tokens,
        output_tokens,
        total_tokens,
        estimated_cost_usd=None,
        complete=input_raw is not None and output_raw is not None,
    )


def parse_response(body: dict, *, elapsed_ms: int, mode: str) -> ModelResult:
    """Validate and normalize a standard chat-completions response."""
    if not isinstance(body, dict):
        raise ProviderResponseError("Baseten response was not a JSON object")
    choices = body.get("choices")
    if not isinstance(choices, list) or not choices:
        raise ProviderResponseError("Baseten response is missing choices")
    choice = choices[0]
    if not isinstance(choice, dict):
        raise ProviderResponseError("Baseten choice has an unexpected shape")
    finish = choice.get("finish_reason")
    if finish == "length":
        raise ProviderResponseError("Baseten response was truncated at the token limit")
    if finish != "stop":
        raise ProviderResponseError("Baseten response did not finish normally")
    message = choice.get("message")
    if not isinstance(message, dict):
        raise ProviderResponseError("Baseten choice is missing its message")
    content = message.get("content")
    if isinstance(content, list):
        content = "".join(
            part.get("text", "") for part in content
            if isinstance(part, dict) and part.get("type") in ("text", "output_text")
            and isinstance(part.get("text"), str)
        )
    if not isinstance(content, str) or not content.strip():
        raise ProviderResponseError("Baseten message content is empty")
    try:
        structured = json.loads(content)
    except json.JSONDecodeError as exc:
        raise ProviderResponseError("Baseten message content is not valid JSON") from exc
    if not isinstance(structured, dict):
        raise ProviderResponseError("Baseten message JSON must be an object")
    return ModelResult(
        text=content,
        model=str(body.get("model") or MODEL_ID),
        usage=_usage(body.get("usage")),
        elapsed_ms=elapsed_ms,
        mode=mode,
        status="completed",
        response_id=body.get("id") if isinstance(body.get("id"), str) else None,
    )


@dataclass(frozen=True)
class BasetenClient:
    name: str = "baseten"
    capabilities: frozenset[Capability] = frozenset({Capability.GENERAL_TEXT_REASONING})
    base_url: str = BASE_URL
    path: str = CHAT_COMPLETIONS_PATH
    model_id: str = MODEL_ID
    key_env: str = API_KEY_ENV
    fixture: str = SYNTHETIC_FIXTURE

    def build_payload(
        self, *, prompt: str, image_data_url: str | None = None,
        max_tokens: int = DEFAULT_MAX_TOKENS,
    ) -> dict:
        content: list[dict] = [{"type": "text", "text": prompt}]
        if image_data_url is not None:
            content.append({"type": "image_url", "image_url": {"url": image_data_url}})
        return {
            "model": self.model_id,
            "messages": [{"role": "user", "content": content}],
            "max_tokens": max_tokens,
        }

    def parse(self, body: dict, *, elapsed_ms: int, mode: str) -> ModelResult:
        return parse_response(body, elapsed_ms=elapsed_ms, mode=mode)

    def load_fixture(self) -> dict:
        with (FIXTURES_DIR / self.fixture).open("r", encoding="utf-8") as fh:
            return json.load(fh)

    def complete_live(
        self, *, prompt: str, image_data_url: str | None = None,
        max_tokens: int = DEFAULT_MAX_TOKENS, timeout: float = DEFAULT_TIMEOUT,
    ) -> ModelResult:
        key = os.environ.get(self.key_env)
        if not key:
            raise ProviderTransportError("Baseten credential is not configured")
        payload = self.build_payload(
            prompt=prompt, image_data_url=image_data_url, max_tokens=max_tokens,
        )
        headers = {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}
        started = time.monotonic()
        try:
            with httpx.Client(base_url=self.base_url, timeout=timeout) as client:
                response = client.post(self.path, json=payload, headers=headers)
        except httpx.TimeoutException as exc:
            raise ProviderTransportError("Baseten request timed out") from exc
        except httpx.TransportError as exc:
            raise ProviderTransportError(
                f"Baseten network failure ({type(exc).__name__})"
            ) from exc
        if response.status_code >= 400:
            if response.status_code in {401, 403}:
                raise ProviderTransportError(
                    f"Baseten authentication rejected (HTTP {response.status_code})"
                )
            raise ProviderTransportError(
                f"Baseten request rejected (HTTP {response.status_code})"
            )
        try:
            body = response.json()
        except ValueError as exc:
            raise ProviderResponseError("Baseten returned invalid JSON") from exc
        elapsed_ms = int((time.monotonic() - started) * 1000)
        return self.parse(body, elapsed_ms=elapsed_ms, mode="live")
