# Grounding API contract

`POST /api/ground` accepts JSON with `mime_type`, base64 `image_base64`, and one short `target_phrase`. It returns `mode`, provider/model, completion status, source width/height/SHA-256, normalized object boxes, optional validated SVG mask paths, optional provider score, correlation ID, elapsed time and estimated cost.

Boxes and mask bounds use normalized `[0,1]` coordinates relative to the server-validated, EXIF-oriented source dimensions. The mask path is decoded by the pinned Meta SAM parser; no box is substituted for a mask. An empty completed object list is a valid `no_match` result. The `mock_unavailable` status means forced MOCK had no exact synthetic fixture for that image and phrase.

The backend accepts PNG/JPEG/WebP, checks image signatures and decoded dimensions, limits decoded images to 4 MiB and 16 million pixels, and bounds body, target, stream, object count and mask output. Browser responses are bound to the selected image digest and dimensions before display.

When `GROUNDLINE_FORCE_MOCK=1`, no provider request is made. The single synthetic fixture is selected only when image hash, dimensions and phrase match. LIVE requires the feature flag, restricted access token, Meta credential and Redis-backed quotas. Provider errors do not fall back to MOCK.

The current Render Blueprint deliberately keeps forced MOCK enabled. The access token and quota Redis URL are not provisioned by this implementation, so LIVE is not enabled in public production.
