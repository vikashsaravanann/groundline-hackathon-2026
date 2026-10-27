"""Provider-neutral model capabilities, results, usage and errors."""
from __future__ import annotations

from dataclasses import dataclass
from enum import StrEnum


class Capability(StrEnum):
    IMAGE_FACT_EXTRACTION = "image_fact_extraction"
    GENERAL_TEXT_REASONING = "general_text_reasoning"
    FUTURE_IMAGE_GROUNDING = "future_image_grounding"


class ProviderError(Exception):
    """Base for safe provider errors; messages must not contain credentials."""


class ProviderResponseError(ProviderError):
    """The provider returned an incomplete or malformed response."""


class ProviderTransportError(ProviderError):
    """The provider request failed or was rejected."""


class ProviderConfigurationError(ProviderError):
    """No explicitly configured provider supports the requested capability."""


@dataclass(frozen=True)
class Usage:
    input_tokens: int
    output_tokens: int
    total_tokens: int
    estimated_cost_usd: float | None = None
    complete: bool = True


@dataclass(frozen=True)
class ModelResult:
    text: str
    model: str
    usage: Usage
    elapsed_ms: int
    mode: str  # "live" or "MOCK"
    status: str
    response_id: str | None = None
