# Frontend design audit & CSC parity (Part 4)

## Reference handling

The CSC Circle repository and live site were treated as **read-only design
inspiration only**. They were **not fetched or cloned** in this work: the
project's standing rule is to operate strictly inside this repository and not
reference outside company code, and the design spec (palette, conventions) was
supplied in full in the task. No CSC branding, logo, photography, PII,
authentication, membership, admin, or database logic was imported. Groundline
keeps its own independent identity.

Parity was therefore assessed against the **documented** CSC conventions
(Next.js App Router, Tailwind, Poppins + optional Lora + JetBrains Mono, light
pastel surfaces, rounded cards, sticky nav, large hero type, two-column desktop
hero, ambient pastel backgrounds, controlled entrance animations, subtle hover,
reusable section/container wrappers).

## Tokens adopted (`src/app/globals.css`)

The Groundline palette already matched the CSC foundation. Confirmed/aligned:
white `#FFFFFF`, cloud `#F7F9FC`, ink `#121826`, blue `#E7F3FF`, purple
`#F1ECFF`, lilac `#EDE7F6`, pink `#FCEAF3`, gold `#FFF4D9`; supporting
text-secondary `#475569`/muted `#64748B`, border `#DFE7EF`, blue accent
`#4D9DE0`, success `#16794B`, warning `#9A620F`, danger `#B4233C`.

**Change made:** added the CSC accent `--color-accent: #6D4AFF` and switched the
global `:focus-visible` outline to it — a distinctive focus treatment used for
interaction emphasis, not as a large background fill.

## Design language (Groundline)

Predominantly white; glass materials (`.glass-panel`, `.glass-nav`, `.surface`)
with opaque fallback where `backdrop-filter` is unsupported; 24–32px panel radii;
Poppins-led type with JetBrains Mono for technical metadata (analysis id);
ambient radial pastel canvas fixed behind content; gentle shadows and a clear
canvas → surface → floating-glass elevation hierarchy; max content width ~1280px.
Studio prioritises camera/upload, typed goal, extracted evidence, and review —
it is a task-preparation app, not a community portal.

## Honesty refinements (this pass)

- Hero headline aligned to the handbook loop: "See it. Ground it. Get it ready."
- Workflow statuses made explicit: Capture **Available**, Understand
  **Available · MOCK** (LIVE once verified — now verified), Ground/Prepare/Review
  **Planned**. No completed capability is overstated.

## Responsive & visual QA

Captured in a real Chrome session:

- **Landing** at 1440px (hero, workflow, safety, footer) and **390px** (stacked,
  hamburger nav, full-width CTAs) — no horizontal overflow.
- **Studio** at 1440px (initial, captured, LIVE result) and **390px** (single
  column, camera/upload before analysis).
- Additional widths were reasoned against the fluid layout (max-w containers,
  `minmax(0,1fr)` grids, flex-wrap). Remaining spot-checks at 320/430/768/1024/
  1920 are a recommended follow-up; no fixed-width elements are used that would
  overflow.

Observed minor item: the sticky glass nav floats over section content during
mid-scroll; in-page anchors use `scroll-mt-24` so nav jumps land correctly.

## Accessibility

Semantic landmarks and headings; visible `:focus-visible` rings everywhere;
labelled controls (camera, upload, objective, field edit/confirm); `aria-live`
on the analysis panel; `role="alert"` on errors; reduced-motion disables Motion
animations (`useReducedMotion`) and CSS transitions; MOCK/LIVE conveyed by text
+ icon, not colour alone. Keyboard operability confirmed (tab order, no traps).

## Known limitations

- Cross-browser verification was done in Chrome; Safari/WebKit and Firefox are
  not yet independently verified.
- Camera requires a secure context (localhost in dev; HTTPS in production);
  permission-denied / no-camera / unsupported all fall back to image upload.
