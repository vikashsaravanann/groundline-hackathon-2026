"""Capability-based provider routing with a global forced-MOCK override."""
from __future__ import annotations

import os
from typing import Protocol

from app.baseten_client import BasetenClient
from app.meta_client import MetaClient, _objective_instruction
from app.meta_client import ALLOWED_EFFORTS
from app import sam_client
from app import field_localizer
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
    Capability.IMAGE_GROUNDING: "meta-sam",
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
    if capability is Capability.IMAGE_GROUNDING:
        if selected.strip().lower() != "meta-sam":
            raise ProviderConfigurationError(
                "Only the hosted Meta SAM provider supports image grounding"
            )
        return SAM_ROUTER_PROVIDER  # type: ignore[return-value]
    provider = PROVIDERS.get(selected.strip().lower())
    if provider is None or capability not in provider.capabilities:
        raise ProviderConfigurationError(
            f"Configured provider does not support {capability.value!r}"
        )
    return provider


class _SamRouterProvider:
    """Capability marker; segmentation uses its typed stream interface."""
    name = "meta-sam"
    capabilities = frozenset({Capability.IMAGE_GROUNDING})
    key_env = sam_client.API_KEY_ENV
    fixture = "sam31_synthetic_response.json"

    def parse(self, body: dict, *, elapsed_ms: int, mode: str):
        raise ProviderConfigurationError("Use ground_image for the segmentation capability")

    def load_fixture(self) -> dict:
        raise ProviderConfigurationError("Use ground_image to load the segmentation fixture")


SAM_ROUTER_PROVIDER = _SamRouterProvider()


def use_mock(capability: Capability) -> bool:
    """The platform force flag overrides every provider and credential."""
    if os.environ.get("GROUNDLINE_FORCE_MOCK") == "1":
        return True
    if capability is Capability.IMAGE_GROUNDING:
        # Missing credentials is an error for this feature, not an implicit fixture.
        return False
    provider = provider_for(capability)
    return not os.environ.get(provider.key_env)


async def ground_image(*, image: sam_client.ValidatedImage, target_phrase: str):
    """Route SAM grounding by capability; no fallback after a LIVE error."""
    provider_for(Capability.IMAGE_GROUNDING)
    if os.environ.get("GROUNDLINE_FORCE_MOCK") == "1":
        fixture = sam_client.mock_fixture_for(image, target_phrase)
        if fixture is None:
            return None
        return await sam_client.parse_mock_fixture(
            fixture, image=image, target_phrase=target_phrase
        )
    if not os.environ.get(sam_client.API_KEY_ENV):
        raise sam_client.GroundingConfigurationError(
            "Meta SAM credential is not configured"
        )
    return await sam_client.complete_live(image=image, target_phrase=target_phrase)


def localize_model_number(*, crop: field_localizer.CroppedLabel) -> ModelResult | None:
    """Use the image-fact capability for the second, crop-only Spark stage.

    A forced-MOCK request is available only for the exact crop fixture. LIVE
    uses one Spark request; no fallback provider or second attempt is allowed.
    """
    provider = provider_for(Capability.IMAGE_FACT_EXTRACTION)
    if not isinstance(provider, MetaClient):
        raise ProviderConfigurationError("Model-number localization requires Meta image extraction")
    if use_mock(Capability.IMAGE_FACT_EXTRACTION):
        fixture = field_localizer.mock_fixture_for(crop)
        if fixture is None:
            return None
        return provider.parse(fixture["response"], elapsed_ms=0, mode="MOCK")
    return provider.complete_live(
        objective="Locate the model-number field inside the supplied product-label crop.",
        image_data_url=field_localizer.crop_data_url(crop),
        effort="low",
        # The live crop attempt used all 256 tokens on reasoning and returned
        # no answer. Keep a bounded cap but leave enough room for its JSON box.
        max_output_tokens=512,
        max_attempts=1,
        instruction_override=field_localizer.FIELD_PROMPT,
    )


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
