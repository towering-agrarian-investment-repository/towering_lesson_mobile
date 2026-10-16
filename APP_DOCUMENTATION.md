# Golf Lesson System Mobile App Documentation

This document describes the current source and configuration of the HappyGolf member app. Use [AGENTS.md](AGENTS.md) for contributor rules and [package.json](package.json) for installed versions. Feature implementation does not by itself certify backend availability or completed device QA.

## 1. Product and stack

The app supports member authentication, ticket-based bay and lesson booking, reservation management, lesson content and homework, notifications, activity reporting, and profile preferences on Android and iOS.

| Layer | Current implementation |
| --- | --- |
| App/runtime | Expo SDK 58, React Native 0.88, React 19, TypeScript |
| Navigation | Expo Router stacks and native bottom tabs |
| Native controls | `@expo/ui` universal controls; platform-specific UI where needed |
| React Native styling | NativeWind 5 preview, Tailwind CSS 4, semantic theme variables |
| Networking/state | TanStack Query, shared API client, Better Auth Expo client |
| Forms | React Hook Form and Zod |
| Local storage | SecureStore for Better Auth storage; AsyncStorage for preferences/onboarding |
| Media/diagnostics | Expo Image, Video, ImagePicker, DocumentPicker, MediaLibrary, Notifications, and Sentry |

Tooling uses a supported Node.js LTS version meeting Expo's requirement (`>=22.13.0` for this baseline), managed locally through nvm. The repository and EAS profiles pin pnpm 10.26.0.

## 2. App configuration

Source: [app.json](app.json).

Launcher icons come from the [Happy Golf V2 icon pack](<assets/images/Happy-Golf-V2-Icons/README.md>): the default, iOS, Android, adaptive, and themed launcher icons use its supplied artwork. In-app logos, the splash screen, notification icons, and the web favicon retain their existing artwork and settings. Launcher icon updates require a new build and installation.

| Setting | Value |
| --- | --- |
| Display name | `HappyGolfCAM2` |
| Expo slug | `golf-lesson-system-mobile` |
| App version | `1.0.0` |
| Android package / iOS bundle identifier | `com.toweringinvest.happygolfmobile` |
| Deep-link scheme | `golflessonsystemmobile` |
| Interface style | `automatic` |
| Orientation | `default` |
| iPad support | Enabled through `ios.supportsTablet` |
| EAS Update runtime policy | `appVersion` |

Android min/target SDK settings live in app config. Compile SDK and build-tools versions use the installed Expo/React Native defaults. Generated `android/` and `ios/` projects are ignored; persistent native configuration belongs in app config/config plugins.

## 3. Startup and authentication

The [root layout](<src/app/_layout.tsx>) provides gesture handling, keyboard handling, safe-area context, theme preferences, onboarding state, and app-update context.

- The native splash remains visible while auth bootstrap and the initial app-version check are pending.
- Protected routing also waits for onboarding state to load.
- Users who have not completed onboarding see [welcome](<src/app/welcome.tsx>); completion is persisted locally.
- After onboarding, logged-out users see [login](<src/app/login.tsx>), and authorized members enter the authenticated stack.
- Login uses **phone number and password**, through Better Auth's phone-number client.
- Only the `MEMBER` role is allowed. Unauthorized-role sessions are signed out.
- Login failures are surfaced through the form. Password changes require the current and new passwords.
- Logout deactivates the current push installation, signs out through Better Auth, and clears query state from the Profile flow.

Sources: [auth service](<src/service/auth.ts>), [auth client](<src/lib/auth-client.ts>), [onboarding context](<src/lib/welcome/welcome-context.tsx>).

## 4. Navigation

The [authenticated stack](<src/app/(app)/_layout.tsx>) contains the main tabs, booking, reservations, lessons/groups/sessions, homework, lesson logs, and profile-edit/password screens.

The main tabs use `NativeTabs` from `expo-router/native-tabs`, with translated labels, SF Symbols on iOS, the existing Ionicons package on Android, and initial-route back behavior. The Profile tab can display an optional-app-update badge. Notifications, Activity, and Profile each have nested stack layouts for their headers.

| Tab | Screen |
| --- | --- |
| Home | [index.tsx](<src/app/(app)/(tabs)/index.tsx>) |
| Notifications | [notice/index.tsx](<src/app/(app)/(tabs)/notice/index.tsx>) |
| Activity | [activity/index.tsx](<src/app/(app)/(tabs)/activity/index.tsx>) |
| Profile | [profile/index.tsx](<src/app/(app)/(tabs)/profile/index.tsx>) |

Source: [tab layout](<src/app/(app)/(tabs)/_layout.tsx>). There is no separate gender-selection modal or design-system demo route in the current app.

## 5. Home and tickets

The Home dashboard shows a compact HappyGolf logo, published banners with a local fallback, member tickets, today's reservations, pull-to-refresh, and an action opening the reservation list.

- Banners support automatic rotation and configured internal/external links.
- Home ticket queries default to `ACTIVE` and `IN_USE` statuses.
- Ticket cards show localized ticket types, validity dates, and usage/unlimited information.
- Booking availability depends on ticket status, expiry, and remaining usage. Lesson-program tickets do not start the ticket booking flow.
- The [tickets screen](<src/app/(app)/tickets.tsx>) provides ticket-type tabs.
- Today's reservations are displayed as stacked rows, with explicit loading, error, and empty states.

Sources: [Home](<src/app/(app)/(tabs)/index.tsx>), [HomeBanner](<src/components/golf/HomeBanner.tsx>), [MyTicket](<src/components/golf/MyTicket.tsx>), [TicketCard](<src/components/golf/TicketCard.tsx>), [TodayReservation](<src/components/golf/TodayReservation.tsx>), [ticket queries](<src/lib/hook/useTicket.ts>).

## 6. Booking and reservations

### Bay booking

`ticket -> select-date -> select-time -> select-bay -> bay-booking-confirm -> booking-success`

Date selection uses availability data. The next steps select an available time group and bay, then present booking details and policies. Confirmation rechecks availability; slot conflicts can return the member to an earlier selection step.

Sources: [date route](<src/app/(app)/select-date.tsx>), [availability calendar](<src/components/golf/booking/SelectDatePicker.tsx>), [time selection](<src/app/(app)/select-time.tsx>), [bay selection](<src/app/(app)/select-bay.tsx>), [bay confirmation](<src/app/(app)/bay-booking-confirm.tsx>).

### Lesson booking

`ticket -> select-date -> select-lesson-slot -> lesson-booking-confirm -> booking-success`

Private/group lesson tickets use lesson-slot availability, slot-fullness checks, confirmation details/policies, and the lesson reservation mutation.

Sources: [lesson-slot selection](<src/app/(app)/select-lesson-slot.tsx>), [lesson confirmation](<src/app/(app)/lesson-booking-confirm.tsx>).

### Completion behavior

The shared success handler replaces the confirmation screen with [booking-success](<src/app/(app)/booking-success.tsx>), passing booking/reschedule summary information. The success screen's Home action dismisses to the main tabs; Android hardware back also returns Home. It does not immediately redirect to reservation detail.

Sources: [shared confirmation footer, loading UI, and navigation](<src/components/golf/booking/BookingConfirmationShared.tsx>), [shared reservation content and fields](<src/components/golf/reservation/ReservationSections.tsx>). Confirmation and reservation details share field spacing, separators, and responsive policy layout.

### Reservation list and detail

- The [reservation list](<src/app/(app)/reservation.tsx>) has all/bay/private/group/program tabs, cursor pagination, refresh, and loading/error/empty states.
- [Reservation detail](<src/app/(app)/reservation/[id].tsx>) supports bay and lesson records, status, ticket details, timing, coach/program/bay information, notes, and policies.
- Cancellation is offered when status is `RESERVED` and the backend marks the reservation cancellable. It uses an Expo UI bottom sheet with the existing danger styling and guards pending requests.
- Bay rescheduling is implemented for bay records marked cancellable, reusing selection/confirmation screens in reschedule mode. Lesson rescheduling is not currently exposed.
- Booking/cancellation/reschedule hooks refresh affected reservation and ticket query data.

Sources: [reservation hooks](<src/lib/hook/useReservation.ts>), [bay reservation service](<src/service/member-bay-reservation.service.ts>), [lesson reservation service](<src/service/member-lesson-reservation.service.ts>).

## 7. Lessons, groups, lesson logs, and homework

These areas are implemented screens backed by services and queries.

| Feature | Behavior and entry point |
| --- | --- |
| Member lessons/groups | [Lessons](<src/app/(app)/lessons/index.tsx>) lists member groups; [group detail](<src/app/(app)/groups/[groupId]/index.tsx>) leads into group lessons. |
| Lesson detail and sessions | [Lesson detail](<src/app/(app)/lessons/[lessonId]/index.tsx>) and [group lesson detail](<src/app/(app)/groups/[groupId]/lessons/[lessonId]/index.tsx>) expose lesson/session content. |
| Session lists | [Lesson sessions](<src/app/(app)/lessons/[lessonId]/sessions/index.tsx>) and [group lesson sessions](<src/app/(app)/groups/[groupId]/lessons/[lessonId]/sessions/index.tsx>) display session instances. |
| Lesson logs | [Log list](<src/app/(app)/lesson-log/index.tsx>) and [log detail](<src/app/(app)/lesson-log/[id]/index.tsx>) display coach lesson posts/media and member feedback state. |
| Member feedback | [Comment/rating screen](<src/app/(app)/lesson-log/[id]/comment.tsx>) submits member feedback and refreshes lesson-log query data. |
| Homework | [Homework detail](<src/app/(app)/homework/[homeworkId].tsx>) shows task details, due date, submissions/history, and coach review information when provided. |

Homework submission accepts one JPEG, PNG, WebP, or MP4 file, up to 100 MiB, plus a member memo. It obtains an upload URL, uploads the file to storage, then submits the homework record. Empty/unsupported/oversized files are rejected, and pending submissions disable the relevant actions.

Lesson resources support images, videos, and external/file links through [SessionResourceSection](<src/components/golf/SessionResourceSection.tsx>). Domain queries live in [useMemberLessonFlow](<src/lib/hook/useMemberLessonFlow.ts>) and [useLessonLog](<src/lib/hook/useLessonLog.ts>); uploads/submission requests are in the [homework service](<src/service/member-homework.service.ts>).

## 8. Notifications and push

The Notifications tab is a real feed, not a placeholder.

- Cursor-paginated feed with refresh, loading, error, and empty states.
- Read/unread state, marking one or all notifications as read, individual swipe deletion, and confirmed deletion of all notifications.
- Supported references open bay/lesson reservation detail or lesson-log detail; record queries can be prefetched before navigation.
- Push registration runs for authenticated members, requests permission, creates the Android notification channel, and registers an Expo push token against a stable installation ID with the backend.
- Push listeners handle received notifications, notification taps, token changes, and the last notification response. Supported taps open the corresponding route; other references fall back to the notification/reservation screens.
- The registration function skips non-physical devices. Delivery also depends on permissions, platform credentials, and backend token/message handling.

Sources: [notification screen](<src/app/(app)/(tabs)/notice/index.tsx>), [notification queries](<src/lib/hook/shared/useNotification.ts>), [notification service](<src/service/shared/notification-service.ts>), [push listeners](<src/lib/hook/shared/usePushNotification.ts>), [push registration](<src/lib/config/notification/registerPushNotification.ts>), [installation storage](<src/lib/config/notification/pushRegistrationStorage.ts>).

## 9. Activity

The Activity tab fetches member activity for an individual year or all time. It displays reservation totals/days/hours, a daily heatmap, weekly summaries, and status/type information. A preview card can be captured as a PNG and saved to the photo library after requesting write access.

Sources: [ActivityOverview](<src/components/golf/ActivityOverview.tsx>), [ActivityShareCard](<src/components/golf/ActivityShareCard.tsx>), [activity query](<src/lib/hook/useMemberActivity.ts>), [activity service](<src/service/member-activity.service.ts>).

## 10. Profile, preferences, and localization

The Profile tab displays member identity, phone/gender, and school/guardian information when supplied by the backend. It links to lessons, lesson logs, profile editing, and password change.

- [Profile editing](<src/app/(app)/profile/edit.tsx>) changes name/nickname and supports choosing a photo, taking a photo, uploading it, or removing the profile image.
- Photo source actions use an Expo UI bottom sheet. Image validation and limits are centralized in [media utilities](<src/utils/media.ts>).
- Gender is displayed with translated labels; the current edit form does not edit gender.
- [Password change](<src/app/(app)/profile/change-password.tsx>) uses validated native inputs and pending-state protection.
- Appearance controls select system/light/dark mode and blue/green primary-color preferences.
- Language selection supports English (`en`), Korean (`ko`), Japanese (`ja`), Chinese (`zh`), and Khmer (`km`). Preferences persist through AsyncStorage.
- Navigation titles, gender, ticket types, form labels, and other UI strings use the existing translation resources.

Sources: [Profile](<src/app/(app)/(tabs)/profile/index.tsx>), [i18n setup/resources](<src/i18n/index.ts>), [theme/preferences](<src/design-system/utils/theme.ts>).

## 11. UI architecture and responsive layout

- Native `Text`, `Button`, `TextInput`, pickers, switches, and sheets come from `@expo/ui` inside `Host` trees. `RNHostView` bridges embedded React Native content.
- [Native button styles](<src/design-system/utils/native-button-styles.ts>) apply exact theme fills, borders, label colors, and disabled opacity to the existing Expo controls. Login retains its green-to-teal gradient. Form underlines live on React Native views, with explicit native-host sizing and plain transparent input surfaces.
- The former project-owned text/button/input/card/container/sheet primitives were removed. Simple card surfaces are styled React Native `View`s; they are not a second control library.
- React Hook Form integration remains in [form components](<src/components/ui/form/index.ts>).
- Remaining generic UI includes Badge, Divider, IconButton, ListRow, loaders, skeletons, state components, charts, and layout helpers. See the [public exports](<src/design-system/index.ts>).
- [Screen](<src/design-system/components/Screen.tsx>) owns safe-area insets, scrolling, keyboard handling, consistent outer padding, maximum content width, and footers. Vertical virtualized-list screens use non-scroll mode.
- [AdaptivePanels](<src/design-system/layout/AdaptivePanels.tsx>) uses native [ArrangementView on iOS 27.1+](<src/design-system/layout/AdaptivePanels.ios.tsx>) and a [measured-width fallback](<src/design-system/layout/AdaptivePanels.shared.tsx>) on Android/older iOS.
- Home uses responsive ticket grids and paired ticket/reservation sections. Booking confirmation, Profile, and Activity also use adaptive sections; narrower forms constrain their content width.
- The runtime palette/preferences are defined in [theme.ts](<src/design-system/utils/theme.ts>), mapped to CSS variables by the root layout, and consumed as semantic classes from [global.css](<src/global.css>). Native text uses the shared [typography ramp](<src/design-system/utils/typography.ts>).
- Expo UI replacements preserve the existing screen design. Host layout uses explicit React Native styles or surrounding NativeWind views; native text has explicit line metrics, constrained wrapping, and alignment. Button fills retain the full content area on iOS. Multiline form comments retain their bordered surface instead of the single-line underline.
- Date badges explicitly center native text on both platforms. Shared empty/error states grow within the available content area below headers/filters and above footers; their content has a defined width for text wrapping. Scroll content keeps its intrinsic height, and empty reservation/ticket lists center without extra bottom-only padding.
- Profile preferences retain their original summary rows and selection cards through [ProfilePreferenceRow](<src/components/golf/profile/ProfilePreferenceRow.tsx>), with Expo UI handling sheet presentation. Logout, notification deletion, and reservation cancellation also retain branded confirmation sheets and pending guards. Native tabs use the app's existing label/icon colors, without Android's default active indicator.
- Responsive behavior is based on available width, with stable child trees to preserve local state during resizing. Phone, tablet, split-screen, and folding behavior remain part of device QA.

## 12. Networking and environment

Configuration is read through [env.ts](<src/lib/config/env.ts>):

| Variable | Purpose |
| --- | --- |
| `EXPO_PUBLIC_API_BASE_URL` | Required member API base URL |
| `EXPO_PUBLIC_AUTH_BASE_URL` | Required Better Auth base URL |
| `EXPO_PUBLIC_APP_VERSION_URL` | Optional version-check endpoint; defaults to the API base plus `/app/version` |
| `EXPO_PUBLIC_SENTRY_ENVIRONMENT` | Sentry environment label used by the root layout |
| `EXPO_PUBLIC_SKIP_APP_UPDATE_CHECK` | When `true`, skips the initial update check in development only |

Use [.env.example](.env.example) as the local configuration reference. Public Expo variables are bundled into the client and must not contain secrets. Supply reachable backend URLs for each environment; a physical device's `localhost` is the device itself, so local development may need LAN access, tunnelling, or emulator port forwarding.

The [API client](<src/lib/client/api-client.ts>) obtains a JWT from Better Auth, sends Bearer authorization and `Accept-Language`, and attaches `X-App-Client`, `X-App-Platform`, and `X-App-Version` from the [request-header helper](<src/lib/client/app-request-headers.ts>). Missing tokens and malformed/error responses are surfaced to the calling layer. HTTP 426 upgrade-required responses notify the update gate.

Services in `src/service/` define domain requests. Hooks in `src/lib/hook/` manage query caching, enabled states, cancellation signals for supported reads, pagination, and mutation-driven query updates. Shared response/error handling lives in [api-response.ts](<src/lib/api-response/api-response.ts>). Media uploads use their dedicated storage-upload path rather than JSON API bodies.

## 13. App-version checks and EAS Update

The [app-version check](<src/lib/update/app-update.ts>) reads the backend's minimum/latest supported version and store URLs. The [update hook](<src/lib/update/use-app-update.ts>) exposes checking, required-update, and optional-update state.

- Below the minimum version, the root displays a blocking update gate.
- A newer optional version can be surfaced in Profile and its tab badge.
- The initial check times out after five seconds and fails open when the endpoint is unavailable/offline.
- Backend HTTP 426 upgrade-required responses can trigger another version check.

Source: [AppUpdateGate](<src/components/update/AppUpdateGate.tsx>).

This backend version policy is separate from EAS Update delivery. `app.json` configures `expo-updates` with an EAS Update URL, an `appVersion` runtime policy, and launch checks. Native dependency/SDK changes still require a compatible new binary; an OTA update cannot add missing native modules.

## 14. Development and builds

Install dependencies with the pinned pnpm version, then start Metro:

```sh
pnpm install --frozen-lockfile
pnpm start --dev-client
```

Checks, when appropriate to a code/configuration change:

```sh
pnpm exec tsc --noEmit
pnpm exec eslint src
pnpm dlx expo-doctor
pnpm exec expo export --platform android --platform ios --output-dir dist
```

Startup compatibility for the current dependency versions:

- [The react-native-css patch](<patches/react-native-css@3.0.7.patch>) forwards new React Native exports lazily while keeping NativeWind's styled primitives. This includes `NativeComponentRegistry`, which Expo Router 58 needs during startup. pnpm applies the patch from `pnpm-workspace.yaml`; keep it with the lockfile.
- [Metro configuration](metro.config.js) treats Sentry 8.28's optional legacy `router-store` lookup as unavailable when that file is absent. This uses Sentry's existing null fallback; legacy-store navigation enrichment is unavailable, while error and replay reporting remain configured.
- Verify these fixes with `node --test scripts/startup-compat.test.cjs`. After changing the patch or Metro configuration, restart with `pnpm start --dev-client --clear`.

Build configuration is in [eas.json](eas.json):

| Profile | Purpose |
| --- | --- |
| `development` | Internal development client; Android APK; local development environment values |
| `development-simulator` | Extends development with an unsigned iOS simulator target |
| `preview` | Internal preview distribution; Android APK; preview environment/channel |
| `production` | Production environment/channel with automatic build-version increments |

Development build commands:

```sh
eas build --platform android --profile development
eas build --platform ios --profile development-simulator
```

A physical iOS development build uses the `development` profile and requires Apple signing/provisioning credentials. Preview/production backend values must be configured for their selected EAS environments. Native configuration or dependency changes require regeneration/rebuilding as appropriate; documentation-only edits do not require app builds.

## 15. Current boundaries and QA

Source-confirmed boundaries include lesson-program tickets not launching ticket booking, no gender-edit modal, and rescheduling currently exposed only for bay reservations. Notifications and lesson logs are implemented and should not be described as placeholders.

Before release, verify on the intended devices and backend environment:

- Onboarding, phone/password login, role rejection, logout, session restoration, and password changes.
- Bay/private/group booking, availability conflicts, completion navigation, eligible cancellation, and bay rescheduling.
- Ticket filters, today's reservations, pagination, refresh, and loading/error/empty states.
- Lesson/group/session content, media playback/links, member feedback, and homework upload/review/history.
- Notification feed actions and push registration/tap navigation across app states and permission outcomes.
- Activity filters, charts, image capture, photo-library permissions, and saving.
- Profile/image changes, all supported languages, both themes, and primary-color preferences.
- Repeated taps, pending submissions, Android back, keyboard access, large text, offline/slow connections, and phone/tablet/Duo resizing.

Code checks, native build results, and runtime QA are distinct. Record which checks actually ran; do not treat successful compilation as proof that every device flow has been tested. Device testing is handled manually when requested by the user.
