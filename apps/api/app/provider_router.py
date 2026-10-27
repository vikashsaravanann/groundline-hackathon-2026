"""Capability-based provider routing with a global forced-MOCK override."""
from __future__ import annotations

import os
from typing import Protocol

from app.baseten_client import BasetenClient
from app.meta_client import MetaClient, _objective_instruction
from app.meta_client import ALLOWED_EFFORTS
from app.model_types import (
    Capability,
    ModelResult,
    ProviderConfigurationError,
    ProviderTransportError,
)


class Provider(Protocol):
    name: str
    capabilities: frozenset[Capability]
    key_env: str
    fixture: str

    def parse(self, body: dict, *, elapsed_ms: int, mode: str) -> ModelResult: ...
    def load_fixture(self) -> dict: ...


META = MetaClient()
BASETEN = BasetenClient()
PROVIDERS: dict[str, Provider] = {"meta": META, "baseten": BASETEN}
DEFAULT_ROUTES: dict[Capability, str | None] = {
    Capability.IMAGE_FACT_EXTRACTION: "meta",
    Capability.GENERAL_TEXT_REASONING: None,
    Capability.FUTURE_IMAGE_GROUNDING: None,
}


def _route_env(capability: Capability) -> str:
    return f"GROUNDLINE_PROVIDER_{capability.name}"


def provider_for(capability: Capability) -> Provider:
    """Resolve only a server-owned capability route; browser input cannot choose."""
    selected = os.environ.get(_route_env(capability))
    if selected is None:
        selected = DEFAULT_ROUTES.get(capability)
    if not selected:
        raise ProviderConfigurationError(
            f"No provider is enabled for capability {capability.value!r}"
        )
    provider = PROVIDERS.get(selected.strip().lower())
    if provider is None or capability not in provider.capabilities:
        raise ProviderConfigurationError(
            f"Configured provider does not support {capability.value!r}"
        )
    return provider


def use_mock(capability: Capability) -> bool:
    """The platform force flag overrides every provider and credential."""
    if os.environ.get("GROUNDLINE_FORCE_MOCK") == "1":
        return True
    provider = provider_for(capability)
    return not os.environ.get(provider.key_env)


def call_model(
    *, capability: Capability, objective: str, image_data_url: str | None = None,
    effort: str = "minimal", max_output_tokens: int = 512,
) -> ModelResult:
    """Request a model capability; provider failures never fall back silently."""
    if capability is Capability.IMAGE_FACT_EXTRACTION and effort not in ALLOWED_EFFORTS:
        raise ValueError(f"effort must be one of {ALLOWED_EFFORTS}, got {effort!r}")
    provider = provider_for(capability)
    if capability is Capability.IMAGE_FACT_EXTRACTION and not image_data_url:
        raise ProviderConfigurationError("Image fact extraction requires an image")
    if use_mock(capability):
        return provider.parse(provider.load_fixture(), elapsed_ms=0, mode="MOCK")

    if provider.name == "meta":
        assert isinstance(provider, MetaClient)
        return provider.complete_live(
            objective=objective,
            image_data_url=image_data_url or "",
            effort=effort,
            max_output_tokens=max_output_tokens,
        )
    if provider.name == "baseten":
        assert isinstance(provider, BasetenClient)
        prompt = _objective_instruction(objective)
        return provider.complete_live(prompt=prompt, image_data_url=image_data_url)
    raise ProviderTransportError("Configured provider implementation is unavailable")
