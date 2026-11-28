# QA checklist

Code checks (`tsc`, `eslint`, `expo-doctor`, `expo export`) are not runtime verification. Device testing is manual. Record which checks actually ran.

## Layout smoke test after shared screen or tab changes

Run a short pass on an iPhone, an iPad, and an Android phone; include an Android tablet when releasing tablet-specific work. Check the affected screens and these representative flows before widening testing:

1. Home: scroll to the end; the reservations button must remain visible and tappable above the native tab bar.
2. Activity: open monthly and yearly previews; check equal visual spacing around the reservation count, then open the period picker and confirm its native controls are usable. Save and share both cards; the saved PNG should be 1080 × 1350 pixels, and Share/Save must stay at the bottom above the system inset.
3. Welcome and Profile: content stays centered in one column on tablets; buttons remain reachable. Open Edit Personal Information on an iPhone and confirm the full title fits in the navigation bar.
4. Open a booking or edit form and use the keyboard; its primary action remains reachable. Rotate a tablet once and confirm the screen still scrolls.
5. Check the fixed bottom actions on both booking confirmations, booking success, reservation detail, lesson log detail and comment, homework, profile edit and password change, and Welcome. Each action should stay above the system bottom area, use the same footer spacing, and have side padding in portrait and landscape.
6. Open and back out of a detail screen, switch reservation and ticket filters, open and close Activity preview and Profile photo, and show and dismiss a toast. Repeat with system Reduce Motion enabled: stack navigation should fade, filters should switch without sliding, the banner should stop auto-rotating, and brief overlays should avoid movement.
7. Press and release reservation, ticket, lesson-log, and profile rows plus icon buttons. On Android, the highlight should fill the tappable surface and follow its corners. On iOS, scale feedback should be brief and respect Reduce Motion. Disabled controls should give no press feedback.

If this pass fails, fix the shared layout or the affected component and repeat the pass. Run the broader release checklist below before shipping.

## iPhone Duo verification

Use an iOS build made with the EAS `sdk-58` image and test in the iPhone Duo simulator from Xcode 27.1 Device Hub. Check folded and open portrait/landscape, partially open, and Split View with the app in either window. The native navigation rail can move to either edge.

- Walk each screen and its primary action in those poses. Check content, floating controls, menus, toasts, and full-screen modals against both horizontal safe-area insets.
- Fold and unfold while a screen is open. Its scroll position, selected state, and actions should remain usable.
- Recheck Home's banner and reservations button, Activity's preview and Share/Save buttons, and Profile's photo viewer.

## Per screen or major interaction

1. Loading, empty data, and API failure/retry states.
2. Repeated taps and pending submissions.
   For custom native buttons on iOS, tap both edges and the center of the visible button, including form submissions, confirmation/cancel sheets, and Profile Edit. Each area must trigger the same action once; disabled/pending buttons must stay blocked. Check Android for regressions.
3. Back navigation, including Android's back button.
4. Slow/offline connections.
5. Logged-out behavior and auth bootstrap.
6. Keyboard access and large text.
7. Both themes and all supported languages (en, ko, ja, zh, km).
8. Phone/tablet/Duo layouts on Android and iOS.

## Before release (intended devices and backend environment)

- Onboarding, phone/password login, role rejection, logout, session restoration, password change.
- Login on iPhone: with the keyboard open and closed, tap the left edge, label, and right edge of the gradient button. Every area must submit once or show required-field errors. Check incorrect credentials, valid credentials, and repeated taps while submitting; repeat on Android. Include the client's affected iPhone when verifying a reported tap failure.
- Bay/private/group booking, availability conflicts, completion navigation, eligible cancellation, bay rescheduling.
- Member bay booking: date -> time -> confirmation, with no bay picker. Check remaining free-slot counts against the backend schedule. Book with no request, whitespace only, and a 2000-character Bay Request; prevent longer input. Confirm the create request sends only `baySlotGroupId`, `ticketId`, and `memberNotes`, and the success screen shows the server-assigned bay even when the request names another bay. Check the disclaimer and Bay Request label in member details and verify the saved request in existing admin details.
- Sold-out bay time: trigger `409 RESERVATION_SLOT_UNAVAILABLE` between selecting and confirming, return to refreshed time choices, and preserve the request when choosing another time. A network failure must retain the draft for retry; repeated confirmation taps must create only one booking. Rescheduling must skip bay selection, send only `baySlotGroupId`, preserve the existing request, and show the new server-assigned bay. Check blank requests and lesson notes remain correct in reservation details.
- Bay ticket availability: verify month/day prefetch, date/time selection, confirmation refresh, and sold-out recovery all send the selected owned `ticketId` with `startDate` and `endDate`. Switch packages with different eligible bays and confirm availability refetches, counts match the backend, and the previous package's schedule never appears under the newly selected package. Check switching back to a cached package refetches; a missing, zero, or invalid ticket ID must offer ticket selection without requesting an unfiltered schedule.
- Ticket filters, today's reservations, pagination, refresh, loading/error/empty states. Compare a one-hour reservation on Android and iOS: both must show an hour label, never `3,600s`.
- Reservation list: All dates includes every date; Today and future includes today but no earlier dates; Past dates excludes today. Switch all five type tabs in each view, load another page, refresh, and check empty/error states. Reopen the app after the business date changes and confirm both date bounds update.
- Open a reservation from a list while its full detail is still loading; the preview screen shows skeleton placeholders for the remaining detail rows and then resolves to the full detail.
- Lesson/group/session content, media playback/links (confirm tapping Play on a deferred lesson/session video mounts and starts playback on the first tap), member feedback, homework upload/review/history.
- Notification feed actions and push registration/tap navigation across app states and permission outcomes: verify 1:1 swipe-left to reveal Delete and swipe-right to close smoothly, auto-close on vertical scroll, no inherited open swipe state on recycled rows during fast scrolling, and no overlapping mark-read/delete rollback races.
- Activity filters, charts (confirm heatmap cells are disabled while a newly selected year/month filter is loading placeholder data so stale dates cannot be selected under the new period), image capture, photo-library permissions, saving.
- Profile/image changes (confirm Edit Personal Information renders avatar, full name, and nickname fields cleanly with keyboard scrolling and photo source bottom sheet), all languages, both themes, primary-color preferences.
- On a device set to light, tap System → Light → Dark → System; repeat with the device set to dark. Check that Dark → System goes directly to the device appearance, the header icon updates on tap, and there is no visible stutter.
- Cold restart after choosing explicit Light and Dark to confirm persistence; check that System follows later device appearance changes.
- Check blue and green primary colors in both light and dark modes, including Expo UI controls and the navigation bar.
- Repeated taps, pending submissions, Android back, keyboard access, large text, offline/slow connections, resizing.

## API contract regression checks

- Ticket History: verify Past has results when All begins with several pages of
  active tickets; include fully used, refunded, unlimited, and type-filtered tickets.
  Check equal creation timestamps across cursor boundaries. Home and ticket tabs
  must request `history=active` and use the returned `effectiveStatus`.
- Booking: check `canStartBooking`, server lesson-slot flags, pause boundaries in
  the business timezone, and a slot taken between selection and confirmation.
  After success, Back must not revisit completed booking steps.
- Bay moves: verify `canReschedule`, the cutoff, and a valid move on a fully used
  ticket without consuming another use. Availability requests must carry the original
  reservation ID and must not reuse another move's cache or offer the current slot.
- Homework: test no current revision, a reviewed current revision, and an unreviewed
  current revision with older feedback. Earlier feedback stays in history; lesson
  and group badges agree. `canSubmit=false` blocks attachment picking and submission.
- Saved values: profile image updates use the returned image URL; bay notes use
  the saved response, including `memberNotes: null` after clearing. Check that an
  older in-flight detail request cannot overwrite the saved value.

## Share-card fixtures and visual checks

Monthly cards use the [V4 layout](../assets/HappyGolf_ShareCard_V4/spec/layout_v4.json)
and one transparent decoration layer on a 1122 × 1402 source canvas. Text, calendar,
member details, and the original app logo remain live components. The month begins
on Monday; six-week months must clear the footer. Monthly hours come from
`activity.monthly[].totalReservationHours`, with zero for an omitted month.

Run the targeted calendar and locale helper from the project root:

```sh
node scripts/monthly-share-card-qa.cjs
node scripts/monthly-share-card-qa.cjs --render
```

The helper covers 60 months, leap years, six-week fit, October 2026 weekday alignment,
and five supported locales. `--render` generates web fixtures under
`.expo/share-card-qa/` for long names, zero counts, and locale review. Web output does
not verify native text shaping.

Check monthly and yearly cards on Android and iOS in both themes, with Khmer,
Japanese, Chinese, long names, large text, and a real avatar. Delay or fail artwork
and avatar loading, retry, change theme, and confirm Share/Save waits for the active
card's assets and authoritative data. Test permission denial and export recovery.
The captured PNG must be 1080 × 1350 physical pixels and contain only the card.

Historical Android examples: [preview](mockups/activity-v4-state.png),
[six-week month](mockups/activity-v4-six-weeks-android.png), and
[saved PNG](mockups/activity-v4-export-android.png). These images record earlier QA;
they do not certify the current build. The original app logo remains blue.
