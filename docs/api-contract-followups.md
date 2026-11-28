# API contract follow-ups

Proposed pre-production changes to the member API and its mobile callers. Use the existing routes and response
envelopes. Remove superseded request parameters and response fields in the same contract update once their runtime
callers have migrated. Keep these deletions scoped to the member-facing contracts. Finance, admin, coach, and parent
contracts need their own caller checks.

## 1. Ticket history

`GET /api/v1/member/tickets` uses the authenticated member and currently filters on stored `statuses`.

- Replace `statuses` with optional `history=active|past`. Omitting `history` returns All. Keep `types`, `limit`, and
  `cursor`. Home and the ticket-type tabs request `history=active`. Ticket History shows fully used tickets in Past
  and All.
- Return one member-facing `effectiveStatus` on list and detail. An `ACTIVE` or `IN_USE` limited ticket whose usage is
  exhausted becomes `FULLY_USED`. Unlimited tickets keep their existing lifecycle state. Past includes
  `EXPIRED`, `REFUNDED`, and `FULLY_USED`. Preserve current member-list visibility for stored statuses and ticket types.
- Apply the history filter in the backend before choosing the page. Derive it from the same usage rule as
  `effectiveStatus`. Keep `createdAt DESC, id DESC` and calculate `hasMore` and `nextCursor` from the filtered results.
- Remove `status` and `fullyUsed` from the member list/detail responses once mobile reads `effectiveStatus`.
  Remove unused `period` from these responses and `ticketId` from the nested pause objects. Keep pause IDs and dates
  for the UI. The persisted ticket status and usage calculation still drive backend rules.

Mobile will remove the stored-status request filter, the local effective-status calculation, and the loop that scans
empty filtered pages. Keep normal pagination and the translated labels and headings.

**Acceptance checks** include a Past first page when All starts with several pages of active tickets,
fully used and refunded tickets, unlimited tickets, type filters, and equal timestamps across page boundaries.

## 2. Booking and rescheduling

- Add `canStartBooking` to member ticket list/detail. Define it as eligibility to enter self-service booking with
  the ticket. Apply date- and slot-specific restrictions in `GET /api/v1/member/bay-slot-groups` and
  `GET /api/v1/member/tickets/{ticketId}/lesson-slots`, using the same rules as writes. Preserve the lesson slot
  fields `bookable` and `bookedByCurrentMember`. Keep the counts used to display available places and the ticket
  policy information shown on ticket cards and detail.
- Remove unused `lessonInstances` and `instructorId` from the member lesson-slot payload. Keep instructor matching
  inside the backend before mapping the response. Remove the member-specific lesson-instance mapping and lookup
  if they have no remaining callers. Coach and admin lesson-availability views use their own lesson-instance data.
- Return `canReschedule` from `GET /api/v1/member/bay-reservations/{id}` using the same policy as the write. Apply
  the cancellation cutoff to both, and close rescheduling when the reservation starts.
- Make bay availability aware of the original reservation during a move. An optional `rescheduleReservationId` on
  the existing route can carry that context. Verify ownership and ticket association, exclude the original booking
  from applicable limit checks, and omit its current slot from the move options.
- Once mobile uses `canReschedule` everywhere, remove nested `ticket.status` from the member reservation responses
  if no other caller uses it. Retain `isCancellable` and `canEditMemberNotes` for their own actions.

Mobile will use the returned eligibility and availability directly. Booking and reschedule writes still validate
current state and return `409 RESERVATION_SLOT_UNAVAILABLE` for slot conflicts.

**Acceptance checks** include pause boundaries in the business timezone, full or already-booked slots, slots taken
between selection and confirmation, the agreed reschedule cutoff, and a valid move on a fully used ticket that
consumes no additional use.

## 3. Homework current revision

- Add `currentSubmission` to `GET /api/v1/member/homework/{id}`. Return `null` when no current revision exists.
  A current revision with no review has `review: null`. Keep the ordered `submissions` array for revision history.
- Return `canSubmit` to gate submission in the app. Share the eligibility policy with upload preparation
  and submission.
- Remove the separate `currentHomeworkSubmissions` array from both member lesson-detail routes once the lesson
  rows read their existing homework summaries directly. Those summaries already carry the current submission and
  review statuses, and the group screen also uses them.

**Acceptance checks** cover no submission, a reviewed current revision, and an unreviewed current revision with
feedback on an earlier one. Earlier feedback stays in history. The lesson and group badges agree.

## 4. Mutation responses

- **Profile image.** Mobile should consume the existing `data.profileImage` returned by
  `PUT /api/v1/member/{id}/profile-image`.
- **Bay notes.** Replace `data: null` from
  `PATCH /api/v1/member/bay-reservations/{id}/member-notes` with the saved `{ "memberNotes": "…" }` object. A cleared
  note returns `memberNotes: null`. Mobile then uses the saved value in its cache.

## Existing feed contracts

- Reservation history already filters by `from` and `to`. Its cursor order is start time descending, with
  reservation type and ID tie-breakers. The by-date endpoint returns rows in ascending time order.
- The mobile notification feed orders by `createdAt DESC, id DESC`. Lesson logs also use creation time and ID
  descending, while the mobile section headers use the displayed `lessonDate` month.
- Keep flat cursor pages. Mobile owns localized section headings and date formatting.

## Staging and production

Update the backend contract and examples, then test a matching backend and mobile build on staging. Confirm each
removal against active callers, including any test build that still needs staging access. Ship the matching contracts
before the production launch.
