# Monthly activity share card — V4

The share card follows `assets/HappyGolf_ShareCard_V4/AGENT_PROMPT_V4.md`. Its source canvas is 1122 × 1402 and Save to Photos captures only the card at 1080 × 1350 pixels. One transparent V4 decoration image supplies the flag, clouds, rays, and the two minimal bottom hills. The original in-app HappyGolf logo, all text, calendar cells, reservation totals, member name, and avatar are live components. No older card PNG is rendered.

The calendar begins on Monday. Saturday and Sunday use V4 blue and pink tiles; active days use green, or orange for a mixed status. Empty leading and trailing cells have no day label. Six-week months use shorter rows so the calendar clears the footer divider. Monthly hours come from `activity.monthly[].totalReservationHours`; an omitted month shows zero.

Android emulator review: [live preview](mockups/activity-v4-state.png), [six-week August 2026](mockups/activity-v4-six-weeks-android.png), and [saved 1080 × 1350 PNG](mockups/activity-v4-export-android.png). The export contains no status bar, controls, or preview chrome. The sample reference shows an October 2026 member with eight reservations; the emulator used live September/August 2026 data, so the numbers and highlighted dates differ as expected. The original app logo is blue, unlike the green logo shown in the V4 mockup; it was deliberately left unchanged.

Checks run:

```powershell
pnpm exec tsc --noEmit
pnpm exec eslint src
node scripts/monthly-share-card-qa.cjs --render
```

The calendar check covers 60 months, leap years, six-week fit, October 2026 weekday alignment, and the app's five supported locales. Web fixture HTML is generated under `.expo/share-card-qa/` for long-name, zero-count, and locale review; it does not verify native text shaping. Further device QA: inspect iOS, Khmer/Japanese/Chinese, a long name and large text, a real avatar, and Share/permission-denial recovery.
