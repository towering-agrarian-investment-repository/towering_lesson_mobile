# QA checklist

Code checks (`tsc`, `eslint`, `expo-doctor`, `expo export`) are not runtime verification. Device testing is manual. Record which checks actually ran.

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
