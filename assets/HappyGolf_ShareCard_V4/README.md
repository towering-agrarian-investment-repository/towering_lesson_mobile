# HappyGolf Share Card — V4: simplified bottom landscape

This asset pack supersedes V1/V2/V3. It is used by `MonthlyGolfShareCard`; the current
implementation and checks are documented in the
[app reference](../../docs/mobile-app-reference-guide.md) and
[share-card QA checklist](../../docs/qa-checklist.md#share-card-fixtures-and-visual-checks).

- Two rolling hills only: one background + one foreground.
- Two small grass tufts and one partially visible golf ball.
- Original HappyGolf logo intentionally excluded from asset PNG/SVG; use existing application logo in Expo.
- Complete transparent decorations layer: `assets/decorations_minimal_v4.png`. Use this **OR** the split PNG layers, not both.
- Top-right flag remains and calendar/weekend details are unchanged.
- Follow `AGENT_PROMPT_V4.md` in the Expo project.
- Preview [the approved visual direction](../../design/share-card-v4-reference/SIMPLIFIED_VISUAL_DIRECTION.png) for the simplified footer.
- Reusable SVG and PNG are editable and correctly isolated, with no baked-in profile, logos or calendar.
