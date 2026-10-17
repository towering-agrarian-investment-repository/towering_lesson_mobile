# Native UI gotchas (Expo UI + Host)

Layout and alignment pitfalls found while moving to `@expo/ui`. Read before touching native text, buttons, badges, calendars, or empty/error states. Rules in `AGENTS.md` still apply.

## Text

- Reuse `NativeText` from `src/design-system/` for standalone labels. It applies the existing type ramp, semantic color, native alignment, and font scaling. Pass unscaled values in `textStyle`; the theme supplies the platform scaling factor.
- `NativeText` owns one `Host`. Inside an existing native Button/Column/Row tree, use Expo `Text` directly so hosts are not nested. Choose intrinsic `wrap={false}` for badges; wrapping labels need a sized parent or an explicit width/flex in `style`.
- Chart axis/date/day labels may use lightweight RN `Text` or SVG text to avoid a native `Host` per data item. Preserve localization, accessible text scaling, and an accessible label on the chart interaction. Keep this exception when refactoring charts.
- Native text that should wrap needs a constrained Host width: `matchContents={{ vertical: true }}` plus an explicit width or flex. Do not measure both axes at intrinsic size.
- Use native frame/fill modifiers for alignment inside the host.
- Badges and other intrinsic content stay sized to their contents.
- Center native text with `textStyle.textAlign` on both platforms, plus the SwiftUI frame alignment where needed.
- In a horizontal row, `items-center` controls vertical alignment only. It does not center text.

## Widths

- Percentage Host widths need an already sized RN parent.
- Inside a centered, intrinsically sized wrapper, use the cell's explicit width or an intrinsic measurement. A percentage child cannot establish its parent's width.
- Calendar day labels use the existing 40-point cell width.

## Buttons

- On iOS, native button content must fill the full button area before the background is applied.
- Preserve the minimum content frame as well as the outer button frame. An outer frame alone leaves the fill sized to the label.
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
