# Golf Lesson System Mobile App Documentation

## 1. Overview

Golf Lesson System Mobile is an Expo + React Native mobile application for member login, ticket-based booking, reservation management, and profile management.

The app is designed for:

- Member authentication
- Viewing active tickets
- Booking bay sessions and lesson sessions
- Viewing current and historical reservations
- Cancelling eligible reservations
- Managing personal profile information
- Managing password and appearance preferences

This document is intended to serve as the official implementation reference for the current mobile application.

## 2. Product Summary

### Primary user

- Authenticated golf members

### Primary goals

- Sign in to the member account
- View active tickets
- Book a bay reservation or lesson reservation
- Review reservation details
- Cancel reservations when allowed
- View and update profile data

## 3. Technology Stack

- Expo
- Expo Router
- React Native
- TypeScript
- NativeWind
- TanStack React Query
- Better Auth Expo client
- React Hook Form
- Zod
- AsyncStorage

## 4. App Configuration

### App identity

- App name: `Golf Lesson System`
- Expo slug: `golf-lesson-system-mobile`
- Android package: `com.anonymous.golflessonsystemmobile`
- Deep link scheme: `golflessonsystemmobile`

### Runtime theme

- Supports light mode, dark mode, and system theme
- Theme preference is persisted locally

### Splash behavior

- Native splash is configured via `expo-splash-screen`
- Runtime splash is held until auth session bootstrap finishes

## 5. Environment Configuration

The app currently uses public Expo environment variables:

- `EXPO_PUBLIC_API_BASE_URL`
- `EXPO_PUBLIC_AUTH_BASE_URL`

Files:

- [.env](/d:/golf-lesson-system-mobile/.env:1)
- [.env.example](/d:/golf-lesson-system-mobile/.env.example:1)
- [src/lib/config/env.ts](/d:/golf-lesson-system-mobile/src/lib/config/env.ts:1)

Important:

- Secrets must not be stored in the mobile app
- Only public, client-safe configuration belongs in Expo public env vars

## 6. Navigation Structure

### Root routing

File: [src/app/_layout.tsx](/d:/golf-lesson-system-mobile/src/app/_layout.tsx:1)

Behavior:

- App waits for auth session bootstrap before hiding splash
- Logged-out users are routed to `login`
- Logged-in users are routed to `(app)`

### Authenticated app stack

File: [src/app/(app)/_layout.tsx](/d:/golf-lesson-system-mobile/src/app/(app)/_layout.tsx:1)

Includes:

- Tab navigator
- Reservation list
- Reservation detail
- Booking flow screens
- Profile edit screens
- Password change
- Gender selection modal
- Design system demo

### Tab routes

- Home: `src/app/(app)/(tabs)/index.tsx`
- Notice: `src/app/(app)/(tabs)/notice.tsx`
- Profile: `src/app/(app)/(tabs)/profile.tsx`

## 7. Feature Inventory

### 7.1 Authentication

Files:

- [src/app/login.tsx](/d:/golf-lesson-system-mobile/src/app/login.tsx:1)
- [src/service/auth.ts](/d:/golf-lesson-system-mobile/src/service/auth.ts:1)
- [src/lib/auth-client.ts](/d:/golf-lesson-system-mobile/src/lib/auth-client.ts:1)

Implemented:

- Username/password login
- Auth session bootstrap on app launch
- Sign out
- Password change

Behavior:

- Login uses Better Auth username flow
- Invalid credentials are surfaced on the password field
- Logout clears cached query state

### 7.2 Home Dashboard

File:

- [src/app/(app)/(tabs)/index.tsx](/d:/golf-lesson-system-mobile/src/app/(app)/(tabs)/index.tsx:1)

Implemented:

- Member dashboard screen
- HappyGolf logo header
- Ticket section
- Today's reservations section
- Pull-to-refresh
- Quick CTA to full reservation list

### 7.3 Ticket Management

Files:

- [src/components/golf/MyTicket.tsx](/d:/golf-lesson-system-mobile/src/components/golf/MyTicket.tsx:1)
- [src/components/golf/TicketCard.tsx](/d:/golf-lesson-system-mobile/src/components/golf/TicketCard.tsx:1)
- [src/service/ticket-service.ts](/d:/golf-lesson-system-mobile/src/service/ticket-service.ts:1)

Implemented:

- Fetch member tickets
- Show active/in-use tickets
- Display ticket type, validity period, usage summary
- Disable booking for expired / fully used tickets
- Disable booking for lesson program tickets

### 7.4 Bay Booking Flow

Route flow:

1. Ticket card
2. `select-date`
3. `select-time`
4. `select-bay`
5. `booking-confirm`
6. Reservation detail after success

Files:

- [src/components/golf/booking/SelectDatePicker.tsx](/d:/golf-lesson-system-mobile/src/components/golf/booking/SelectDatePicker.tsx:1)
- [src/app/(app)/select-time.tsx](/d:/golf-lesson-system-mobile/src/app/(app)/select-time.tsx:1)
- [src/app/(app)/select-bay.tsx](/d:/golf-lesson-system-mobile/src/app/(app)/select-bay.tsx:1)
- [src/app/(app)/booking-confirm.tsx](/d:/golf-lesson-system-mobile/src/app/(app)/booking-confirm.tsx:1)

Implemented:

- Calendar date selection using availability data
- Time slot selection using bay slot groups
- Bay selection with availability state
- Confirmation screen
- Reservation creation
- Validation for slot availability before submit
- Success redirect to created reservation

### 7.5 Lesson Booking Flow

Route flow:

1. Ticket card
2. `select-date`
3. `select-lesson-slot`
4. `lesson-booking-confirm`
5. Reservation detail after success

Files:

- [src/app/(app)/select-lesson-slot.tsx](/d:/golf-lesson-system-mobile/src/app/(app)/select-lesson-slot.tsx:1)
- [src/app/(app)/lesson-booking-confirm.tsx](/d:/golf-lesson-system-mobile/src/app/(app)/lesson-booking-confirm.tsx:1)

Implemented:

- Lesson slot selection by date
- Slot fullness detection
- Confirmation screen
- Lesson reservation creation
- Success redirect to created reservation

### 7.6 Reservation List

File:

- [src/app/(app)/reservation.tsx](/d:/golf-lesson-system-mobile/src/app/(app)/reservation.tsx:1)

Implemented:

- Reservation tabs by type:
  - all
  - bay
  - private
  - group
  - program
- Infinite query reservation loading
- Pull-to-refresh
- Pagination
- Empty state
- Error state
- Loading skeleton

### 7.7 Reservation Detail

File:

- [src/app/(app)/reservation/[id].tsx](/d:/golf-lesson-system-mobile/src/app/(app)/reservation/[id].tsx:1)

Implemented:

- Reservation detail fetch by id and reservation type
- Supports both bay and lesson reservations
- Status banner
- Ticket badge
- Date, time, bay/program/lesson/coach/note display
- Reservation policy section
- Pull-to-refresh
- Loading state
- Error state
- Empty state
- Cancel reservation action for eligible reservations

### 7.8 Today’s Reservations

Files:

- [src/components/golf/TodayReservation.tsx](/d:/golf-lesson-system-mobile/src/components/golf/TodayReservation.tsx:1)
- [src/components/golf/TodayReservationCard.tsx](/d:/golf-lesson-system-mobile/src/components/golf/TodayReservationCard.tsx:1)

Implemented:

- Horizontal list of today’s reservations
- Loading state
- Error state

Current limitation:

- Empty state is currently visually suppressed instead of rendered as a visible message

### 7.9 Profile

Files:

- [src/app/(app)/(tabs)/profile.tsx](/d:/golf-lesson-system-mobile/src/app/(app)/(tabs)/profile.tsx:1)
- [src/app/(app)/profile/edit.tsx](/d:/golf-lesson-system-mobile/src/app/(app)/profile/edit.tsx:1)
- [src/app/(app)/profile/change-password.tsx](/d:/golf-lesson-system-mobile/src/app/(app)/profile/change-password.tsx:1)
- [src/app/(app)/profile/gender-modal.tsx](/d:/golf-lesson-system-mobile/src/app/(app)/profile/gender-modal.tsx:1)

Implemented:

- Profile overview
- Personal info display
- Parent / guardian info display
- Theme preference control
- Edit personal information
- Gender selection via modal
- Password change
- Logout

### 7.10 Notice

File:

- [src/app/(app)/(tabs)/notice.tsx](/d:/golf-lesson-system-mobile/src/app/(app)/(tabs)/notice.tsx:1)

Current status:

- Implemented as placeholder empty state
- No notification feed yet

### 7.11 Lesson Log

File:

- [src/app/(app)/lesson-log.tsx](/d:/golf-lesson-system-mobile/src/app/(app)/lesson-log.tsx:1)

Current status:

- Implemented as placeholder empty state
- No lesson history list yet

## 8. Data Domains

The app primarily works with these domains:

- Authentication session
- Member profile
- Member tickets
- Bay slot groups
- Bay reservations
- Lesson availability slots
- Lesson reservations
- Reservation summaries and reservation detail

## 9. Networking and Data Fetching

### Query layer

Files:

- [src/lib/hook/useUser.ts](/d:/golf-lesson-system-mobile/src/lib/hook/useUser.ts:1)
- [src/lib/hook/useTicket.ts](/d:/golf-lesson-system-mobile/src/lib/hook/useTicket.ts:1)
- [src/lib/hook/useReservation.ts](/d:/golf-lesson-system-mobile/src/lib/hook/useReservation.ts:1)

Implemented:

- React Query for read and mutation operations
- Infinite query for reservation history
- Query invalidation after create/cancel mutations
- Request cancellation for read queries via `AbortSignal`

### API layer

Files:

- [src/lib/client/api-client.ts](/d:/golf-lesson-system-mobile/src/lib/client/api-client.ts:1)
- [src/lib/api-response/api-response.ts](/d:/golf-lesson-system-mobile/src/lib/api-response/api-response.ts:1)

Behavior:

- JWT token is fetched from auth client before API requests
- All authenticated API calls use Bearer token authorization
- Shared response/error handling helpers are used in mutations

## 10. UI and Design System

### Theme system

Files:

- [src/design-system/utils/theme.ts](/d:/golf-lesson-system-mobile/src/design-system/utils/theme.ts:1)
- [src/global.css](/d:/golf-lesson-system-mobile/src/global.css:1)

Implemented:

- Semantic theme tokens
- Light theme
- Dark theme
- System theme support
- Persistent theme preference

### Design system

Implemented reusable components include:

- AppText
- Button
- Input
- Card
- Badge
- Divider
- IconButton
- Layout primitives

Reference:

- [src/design-system/index.ts](/d:/golf-lesson-system-mobile/src/design-system/index.ts:1)

### Shared screen states

Files:

- [src/components/ui/StateCard.tsx](/d:/golf-lesson-system-mobile/src/components/ui/StateCard.tsx:1)
- [src/components/ui/CircleLoader.tsx](/d:/golf-lesson-system-mobile/src/components/ui/CircleLoader.tsx:1)
- [src/components/ui/Skeleton.tsx](/d:/golf-lesson-system-mobile/src/components/ui/Skeleton.tsx:1)

Implemented:

- Loading states
- Skeleton states
- Error states
- Empty states

## 11. Navigation and Interaction Safeguards

### Duplicate tap protection

File:

- [src/lib/hook/useNavigationLock.ts](/d:/golf-lesson-system-mobile/src/lib/hook/useNavigationLock.ts:1)

Implemented:

- Navigation lock for push-based transitions
- Applied at parent screen/list level for booking and reservation flows

### Booking completion behavior

Implemented:

- Booking success clears prior flow stack using `dismissAll`
- User cannot swipe back into completed booking steps

## 12. Error, Loading, and Empty State Standard

The app uses the following standard for required-data screens:

- loading
- error
- empty
- content

This standard is implemented across the booking flow and reservation flow to prevent:

- stale cached content under errors
- blank screens during failed requests
- ambiguous missing-data behavior

## 13. Performance and UX Optimizations

Implemented optimizations:

- Runtime splash gating during auth bootstrap
- Request cancellation for query reads
- FlatList usage for large reservation/ticket/reservation-summary lists
- Navigation lock to prevent duplicate stack pushes
- Parent-level navigation locking instead of per-card focus subscriptions
- Reduced card-level prefetch churn
- Mutation buttons disable while pending

## 14. Security Notes

Important constraints:

- Do not store backend secrets in the frontend app
- Only public endpoints and client-safe config belong in `.env`
- Authentication is session-based through Better Auth Expo client

## 15. Build and Release

Relevant files:

- [app.json](/d:/golf-lesson-system-mobile/app.json:1)
- [eas.json](/d:/golf-lesson-system-mobile/eas.json:1)

Current EAS profiles:

- `development`
- `preview`
- `production`

Android build behavior:

- `development` builds APK
- `preview` builds APK
- `production` uses standard production build flow

## 16. Current Limitations / Not Yet Implemented

The following areas are currently placeholders or incomplete:

- Notice feed content
- Lesson log history content
- Notification center functionality
- Full lesson detail route validation for all possible backend data shapes
- Broader release-environment backend configuration beyond local/LAN development usage

## 17. Recommended QA Coverage

Before release, validate:

- login
- logout
- session restore on app reopen
- bay booking flow
- lesson booking flow
- reservation cancellation
- profile edit
- password change
- theme switching
- Android back button behavior
- slow network and offline scenarios
- dark mode and light mode

## 18. Source Map

### Core app entry

- [src/app/_layout.tsx](/d:/golf-lesson-system-mobile/src/app/_layout.tsx:1)
- [src/app/(app)/_layout.tsx](/d:/golf-lesson-system-mobile/src/app/(app)/_layout.tsx:1)

### Key routes

- [src/app/login.tsx](/d:/golf-lesson-system-mobile/src/app/login.tsx:1)
- [src/app/(app)/(tabs)/index.tsx](/d:/golf-lesson-system-mobile/src/app/(app)/(tabs)/index.tsx:1)
- [src/app/(app)/(tabs)/profile.tsx](/d:/golf-lesson-system-mobile/src/app/(app)/(tabs)/profile.tsx:1)
- [src/app/(app)/select-date.tsx](/d:/golf-lesson-system-mobile/src/app/(app)/select-date.tsx:1)
- [src/app/(app)/select-time.tsx](/d:/golf-lesson-system-mobile/src/app/(app)/select-time.tsx:1)
- [src/app/(app)/select-bay.tsx](/d:/golf-lesson-system-mobile/src/app/(app)/select-bay.tsx:1)
- [src/app/(app)/select-lesson-slot.tsx](/d:/golf-lesson-system-mobile/src/app/(app)/select-lesson-slot.tsx:1)
- [src/app/(app)/booking-confirm.tsx](/d:/golf-lesson-system-mobile/src/app/(app)/booking-confirm.tsx:1)
- [src/app/(app)/lesson-booking-confirm.tsx](/d:/golf-lesson-system-mobile/src/app/(app)/lesson-booking-confirm.tsx:1)
- [src/app/(app)/reservation.tsx](/d:/golf-lesson-system-mobile/src/app/(app)/reservation.tsx:1)
- [src/app/(app)/reservation/[id].tsx](/d:/golf-lesson-system-mobile/src/app/(app)/reservation/[id].tsx:1)

## 19. Summary

The current mobile app is a functional member-facing booking and reservation application with:

- working authentication
- ticket-driven bay and lesson booking flows
- reservation list and reservation detail views
- reservation cancellation
- profile management
- runtime theme support
- app-level loading, error, and empty states
- improved navigation safety and query cancellation

The current codebase is suitable for continued product iteration, internal testing, and release hardening, with placeholder sections clearly identified for future expansion.
