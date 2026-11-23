# Native UI gotchas (Expo UI + Host)

Layout and alignment pitfalls found while working with `@expo/ui`. Read before touching native text, buttons, badges, calendars, or empty/error states. Rules in `AGENTS.md` still apply.

## Text

- Default to `AppText` (`src/design-system/components/AppText.tsx`) for standalone labels, chrome, tab bars, list rows, badges, and chart labels (`NativeText` delegates to `AppText` without mounting an `@expo/ui` `Host`).
- Inside an existing native `@expo/ui` `Host` (`Button`, `Column`, `Row`, `Picker`, `List`, `BottomSheet`), use Expo UI `Text` directly so hosts are not nested.
- Native text inside a `Host` that should wrap needs a constrained Host width: `matchContents={{ vertical: true }}` plus an explicit width or flex. Do not measure both axes at intrinsic size.
- Use native frame/fill modifiers for alignment inside the host.
- Center native text with `textStyle.textAlign` on both platforms, plus the SwiftUI frame alignment where needed.
- In a horizontal row, `items-center` controls vertical alignment only. It does not center text.

## Widths

- Percentage Host widths need an already sized RN parent.
- Inside a centered, intrinsically sized wrapper, use the cell's explicit width or an intrinsic measurement. A percentage child cannot establish its parent's width.
- Calendar day labels use `minWidth: 40` / `minHeight: 40` (`min-h-10 min-w-10`) with `minHeight: 520` on the calendar container so large Dynamic Type scales do not clip.

## Buttons

- Prefer the shared `ActionButton` (`src/design-system/components/ActionButton.tsx`) for standard filled, outlined, or text native buttons.
- On iOS, native button content must fill the full button area before the background is applied.
- Preserve the minimum content frame as well as the outer button frame. An outer frame alone leaves the fill sized to the label.
- On iOS, a plain button (`variant="text"`) needs `contentShape(shapes.rectangle())` after the frame on its label `Text` or content `Row`. This makes empty space inside the label tappable, including space around loading indicators. Put it inside the Button, not just on the outer button frame; keep the Android modifiers unchanged.
- A Host seed color generates an Android palette. It does not preserve an exact brand fill, so use `native-button-styles.ts`.
- Universal `Row.alignment` controls vertical alignment.
- Center button labels and loading indicators horizontally in full-width rows with balanced flexible `Spacer`s on both sides of the content group, alongside centered text alignment.

## Empty and error states

- They grow into the parent's remaining height and center a width-constrained content block.
- Scroll content keeps its intrinsic height with flex growth.
- Empty-list containers avoid asymmetric vertical padding, which shifts the state off-center.

## Scrolling and refresh

- Pull indicators track user requests, not query `isFetching`/`isRefetching` flags. Use `usePullToRefresh` for ordinary screens and return the full request promise (or `Promise.all` for multiple queries). Keep background activity indicators separate.
- Infinite lists also coordinate refresh with pagination so neither cancels the other's request. Notification and reservation lists handle that explicitly.
- Do not put entrance/exit animations on virtualized rows: mounting during scrolling replays them.
- Keep continuous scroll tracking on the UI thread. Updating React state every frame rerenders unrelated detail content; the session selector uses a shared value for its overflow cue.
