# Groundline brand implementation

## Approved source and provenance

- Approved source: `apps/web/public/brand/groundline-approved-original.png`.
- The checked-in source copy was compared byte-for-byte with the supplied
  `/Users/vikash/Pictures/Groundline-logo.png` during implementation.
- Source dimensions: 1254 × 1254 pixels, opaque RGB PNG.
- The approved artwork has the four rounded focus corners, flowing action path,
  pastel focus dot, Poppins-like Groundline wordmark, and “Vision-to-action AI”
  descriptor on its soft white/pastel background.
- The original file is preserved unmodified. The symbol derivative uses source
  crop `(x=416, y=303, width=424, height=424)`, chosen to exclude the wordmark
  and descriptor while retaining the full focus mark. A luminance-distance alpha
  matte removes the white field; the exported circular badges use Lanczos
  resampling, a white circular surface, and a light blue-gray outline.
- The small mark uses the same geometry, with slightly strengthened edge
  contrast through the extraction matte. No replacement artwork or lettermark
  is used.

## Components and typography

- `apps/web/src/components/brand/Logo.tsx` renders the square circular badge with
  `next/image` at its native aspect ratio. `Wordmark` places the icon before
  accessible live “Groundline” text.
- `apps/web/src/components/layout/AppHeader.tsx` retains the sticky glass nav,
  links, CTA, and keyboard-accessible menu. The icon is 36 px on narrow screens
  and 40 px from the small breakpoint upward; the wordmark is 17 px and 20 px.
- `apps/web/src/components/studio/IntentComposer.tsx` places a decorative,
  click-through compact symbol left of the existing objective textarea. The
  existing textarea, analyze/cancel controls, and validation remain intact.
- Poppins is loaded by `next/font/google` in `src/app/layout.tsx` and remains the
  interface and wordmark font. JetBrains Mono remains available for data labels.
- Palette remains the existing white, cloud, pastel blue/purple/lilac/pink/gold,
  ink `#121826`, and accent `#6D4AFF` design system.

## Exported assets

| File | Dimensions | Purpose |
|---|---:|---|
| `public/brand/groundline-approved-original.png` | 1254 × 1254 | Immutable approved artwork |
| `public/brand/groundline-symbol.png` | 424 × 424 | Cropped symbol-only artwork with transparency |
| `public/brand/groundline-symbol-circle.png` | 512 × 512 | Main circular mark for header and compact placements |
| `public/brand/groundline-symbol-16.png` | 16 × 16 | High-contrast small browser icon derivative |
| `public/brand/groundline-symbol-32.png` | 32 × 32 | Standard browser icon derivative |
| `public/brand/groundline-symbol-48.png` | 48 × 48 | Search/browser icon derivative |
| `public/brand/groundline-symbol-64.png` | 64 × 64 | High-density browser icon derivative |
| `public/brand/groundline-symbol-96.png` | 96 × 96 | High-density/search icon derivative |
| `public/brand/groundline-symbol-180.png` | 180 × 180 | Apple touch icon source |
| `public/brand/groundline-symbol-192.png` | 192 × 192 | PWA icon |
| `public/brand/groundline-symbol-512.png` | 512 × 512 | Large PWA/application icon |
| `public/brand/groundline-symbol-maskable.png` | 512 × 512 | Maskable Android PWA icon with safe-zone padding |
| `public/brand/groundline-symbol-monochrome.png` | 424 × 424 | Dark-ink monochrome symbol fallback |
| `src/app/favicon.ico` | ICO with 16, 32, 48, 64 px PNG frames | Browser favicon |
| `src/app/icon.png` | 96 × 96 | Next.js icon convention and high-density browser icon |
| `src/app/apple-icon.png` | 180 × 180 | Next.js Apple touch icon convention |

The ICO is an ICO container with four embedded PNG frames, not a renamed PNG.
The original square composition is not used as a small favicon.

## Metadata, favicon, and mobile installation

- `src/app/favicon.ico`, `src/app/icon.png`, and `src/app/apple-icon.png` use
  Next.js App Router metadata file conventions for Next.js 16.4.3.
- `src/app/manifest.ts` advertises the 192 px, 512 px, and maskable icons. This
  supplies install metadata; it does not claim offline PWA support.
- Root metadata includes the Groundline title, description, and site name. When
  `NEXT_PUBLIC_SITE_URL` is configured to the real deployed HTTPS origin, the
  approved artwork is emitted as the Open Graph and large-card social preview.
  There is no canonical URL or `metadataBase` in local builds because no
  verified public hostname was available in this session.
- The icon URLs are stable root/app asset URLs and are not blocked by a
  repository robots rule. Search eligibility can be checked only after the site
  is deployed at its public HTTPS hostname. Google controls whether and when the
  icon appears; no indexing or display result is claimed.
- Next.js can emit the ICO and PNG app icon links together. They point to the
  same approved Groundline mark in supported resolutions; no Next.js default
  icon remains.

## Accessibility and visual verification

- The icon is decorative in the lockup; visible “Groundline” text remains
  selectable and readable. The home link has the accessible name “Groundline
  home”. The Studio input symbol is `aria-hidden` and does not intercept clicks.
- Lint, unit tests, TypeScript, production build, rendered HTML metadata, and
  responsive screenshot checks are recorded in the completion report.
- Chrome was used for visual and viewport verification. Safari and Firefox
  were not exercised in this session.
- Search-result appearance, crawler access, and Search Console recrawl require a
  deployed public property and are outside local verification.

## Local verification results

- `npm ci`, `npm run lint`, `npm test` (5 files / 14 tests), `npx tsc --noEmit`,
  and `npm run build` completed successfully. Vitest prints an existing
  non-blocking native-config loader notice.
- Chrome 156 viewport checks: 320, 375, 390, 430, 768, 1024, 1440, and 1920 px;
  document width matched each viewport. The mobile toggle opened and closed;
  the existing Studio objective field remained visible alongside the icon.
- The rendered homepage includes the Next.js metadata links for `/favicon.ico`
  (ICO), `/icon.png` (96 × 96), `/apple-icon.png` (180 × 180), and
  `/manifest.webmanifest`. Local HTTP responses returned 200 with
  `image/x-icon`, `image/png`, and `application/manifest+json` content types.
- Local source files were validated as PNG/ICO with the required square sizes;
  the ICO contains embedded 16, 32, 48, and 64 px frames. The approved source
  copy matched the supplied original byte-for-byte.
- A high-confidence pattern scan of changed text files found no credentials.
  No credential, backend schema, production resource, or paid model request was
  touched.
- Screenshots for the landing page, menu, Studio composer, and icon sizes are in
  `docs/brand-qa/`. The app's camera-permission flow and live AI requests were
  not exercised in this visual pass; existing automated frontend tests passed.
