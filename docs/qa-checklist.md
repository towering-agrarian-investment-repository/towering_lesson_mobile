# QA checklist

Code checks (`tsc`, `eslint`, `expo-doctor`, `expo export`) are not runtime verification. Device testing is manual. Record which checks actually ran.

## Layout smoke test after shared screen or tab changes

Run a short pass on an iPhone, an iPad, and an Android phone; include an Android tablet when releasing tablet-specific work. Check the affected screens and these representative flows before widening testing:

1. Home: scroll to the end; the reservations button must remain visible and tappable above the native tab bar.
2. Activity: open monthly and yearly previews; check equal visual spacing around the reservation count, then open the period picker and confirm its native controls are usable. Save and share both cards; the saved PNG should be 1080 × 1350 pixels, and Share/Save must stay at the bottom above the system inset.
3. Welcome and Profile: content stays centered in one column on tablets; buttons remain reachable. Open Edit Personal Information on an iPhone and confirm the full title fits in the navigation bar.
4. Open a booking or edit form and use the keyboard; its primary action remains reachable. Rotate a tablet once and confirm the screen still scrolls.

If this pass fails, fix the shared layout or the affected component and repeat the pass. Run the broader release checklist below before shipping.

## iPhone Duo verification

Use an iOS build made with the EAS `sdk-58` image and test in the iPhone Duo simulator from Xcode 27.1 Device Hub. Check folded and open portrait/landscape, partially open, and Split View with the app in either window. The native navigation rail can move to either edge.

- Walk each screen and its primary action in those poses. Check content, floating controls, menus, toasts, and full-screen modals against both horizontal safe-area insets.
- Fold and unfold while a screen is open. Its scroll position, selected state, and actions should remain usable.
- Recheck Home's banner and reservations button, Activity's preview and Share/Save buttons, and Profile's photo viewer.

## Per screen or major interaction

1. Loading, empty data, and API failure/retry states.
2. Repeated taps and pending submissions.
3. Back navigation, including Android's back button.
4. Slow/offline connections.
5. Logged-out behavior and auth bootstrap.
6. Keyboard access and large text.
7. Both themes and all supported languages (en, ko, ja, zh, km).
8. Phone/tablet/Duo layouts on Android and iOS.

## Before release (intended devices and backend environment)

- Onboarding, phone/password login, role rejection, logout, session restoration, password change.
- Bay/private/group booking, availability conflicts, completion navigation, eligible cancellation, bay rescheduling.
- Ticket filters, today's reservations, pagination, refresh, loading/error/empty states.
- Lesson/group/session content, media playback/links, member feedback, homework upload/review/history.
- Notification feed actions and push registration/tap navigation across app states and permission outcomes.
- Activity filters, charts, image capture, photo-library permissions, saving.
- Profile/image changes, all languages, both themes, primary-color preferences.
- On a device set to light, tap System → Light → Dark → System; repeat with the device set to dark. Check that Dark → System goes directly to the device appearance, the header icon updates on tap, and there is no visible stutter.
- Cold restart after choosing explicit Light and Dark to confirm persistence; check that System follows later device appearance changes.
- Check blue and green primary colors in both light and dark modes, including Expo UI controls and the navigation bar.
- Repeated taps, pending submissions, Android back, keyboard access, large text, offline/slow connections, resizing.
