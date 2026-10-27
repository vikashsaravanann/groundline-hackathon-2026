# Workflow and navigation verification

Date: 2026-10-27

## Change

The hero action now links to the dedicated `/workflow` route. The header's
How it works link and the footer's How it works link use `/workflow` from any
page. Features and Safety links use `/#features` and `/#safety`, respectively,
so they work from the homepage or another route. The creator links use `/about`.
The mobile menu closes when a route or Studio action is selected.

## Evidence

- Production build emitted static routes `/`, `/workflow`, and `/about`.
- Local Chrome loaded `/workflow` and `/about` directly.
- Clicking **Explore the Workflow** on `/` navigated to `/workflow`.
- Clicking the primary navigation **Features** link navigated to `/#features`.
- Workflow page exposes all five stage headings and status labels in the
  accessibility tree.
- Vitest Hero navigation test checks the hero links' exact destinations.

This is local verification of the current source. Production verification is
pending the Vercel deployment for the commit containing this change.
