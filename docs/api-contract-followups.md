# API contract follow-ups

Open backend items that the mobile app intentionally does **not** work around in the UI.

## Ticket history — server-side Past filter

- `GET /member/{memberId}/tickets` accepts repeated `statuses`, but `FULLY_USED` is derived on the client from `fullyUsed`.
- The ticket-history "Past" filter therefore fetches all tickets and filters client-side. Passing only `EXPIRED`/`TRANSFERRED` would drop fully used tickets.
- **Requested contract:** accept a derived filter such as `fullyUsed=true`, or return `derivedStatus` including `FULLY_USED`, so the Past tab can be server-filtered and cursor-paginated.
- Until then, do not send a partial status list from the client.

## Reservations — ordering confirmation

- The list already groups by `reservationDate` (day header with a per-day count).
- The API accepts `from`/`to`, so period filtering is server-side.
- **Confirm:** results are ordered chronologically by `startTime` with a stable `id` tie-breaker. No new endpoint is needed.

## Notifications — ordering confirmation

- The list groups by `createdAt` into Today / Yesterday / Earlier this week / Earlier.
- **Confirm:** results are ordered by `createdAt` descending with a stable `id` tie-breaker. If order changes, headers still follow the returned order but may repeat.
- If date filtering or per-day unread counts are ever needed, add optional `from`/`to` (or `groupBy=day`).

## Lesson logs — grouping key

- Lesson logs are auto-created, so the existing `createdAt desc, id desc` order is accepted as chronological.
- Headers are grouped by the displayed `lessonDate` month, not `createdAt`, so a late-night or timezone boundary cannot show a row under the wrong month.
- No backend change required.

## Not requested

Do not add grouped/sectioned responses (`sections: [{ title, items }]`). Flat cursor pages plus client-side presentation headers preserve pagination and cache behavior.
