# Groundline visual QA screenshots

Captured from the production build in headless Chrome 156.0.8078.4. Images show
the current local implementation; they are not production deployment evidence.

| Screenshot | View |
|---|---|
| `home-1440.png` | Desktop landing page and aligned full navigation |
| `home-390.png` | Mobile landing page and compact logo/menu alignment |
| `home-320.png` | Narrow mobile layout with no horizontal overflow |
| `mobile-menu-open-390.png` | Mobile menu expanded |
| `studio-objective-390.png` | Existing Studio goal composer with icon placed beside the textarea |
| `icon-sizes.png` | Icon exports compared at 16, 32, 48, 64, 96, 180, 192, and 512 px |
| `final-chromium-desktop-1440.png` | Final desktop landing screenshot |
| `final-chromium-studio-composer-390.png` | Final Studio goal composer; icon and chips/count do not overlap |

The browser viewport check also measured document width at 320, 375, 390, 430,
768, 1024, 1440, and 1920 px. Each matched its viewport width. At 390 px, the
mobile menu opened and closed using its existing accessible toggle.

Final rerun used Chrome for Testing 156.0.8078.4 on the production build.
Forced-MOCK typed upload and analysis succeeded; favicon, app icon, Apple icon,
and manifest endpoints returned 200 with the expected content types. There
were no browser page errors. Firefox and WebKit/Safari remain unverified due to
browser startup/protocol failures in this environment; see the dated addendum
in `docs/DAY2_COMPLETION_REPORT.md`.
