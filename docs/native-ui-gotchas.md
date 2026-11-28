# Native UI gotchas (Expo UI + Host)

Layout and alignment pitfalls found while working with `@expo/ui`. Read before touching native text, buttons, badges, calendars, or empty/error states. Rules in `AGENTS.md` still apply.

## Text

- Default to `AppText` (`src/design-system/components/AppText.tsx`) for standalone labels, chrome, tab bars, list rows, badges, and chart labels.
- Inside an existing native `@expo/ui` `Host` (`Button`, `Column`, `Row`, `Picker`, `List`, `BottomSheet`), use Expo UI `Text` directly so hosts are not nested.
- Native text inside a `Host` that should wrap needs a constrained Host width: `matchContents={{ vertical: true }}` plus an explicit width or flex. Do not measure both axes at intrinsic size.
- Use native frame/fill modifiers for alignment inside the host.
- Center native text with `textStyle.textAlign` on both platforms, plus the SwiftUI frame alignment where needed.
- In a horizontal row, `items-center` controls vertical alignment only. It does not center text.

## Widths

- Percentage Host widths need an already sized RN parent.
- Inside a centered, intrinsically sized wrapper, use the cell's explicit width or an intrinsic measurement. A percentage child cannot establish its parent's width.
- The booking calendar scales its minimum height from `CALENDAR_BASE_MIN_HEIGHT` and the current font scale in `SelectDatePicker.tsx`. Preserve measured page widths and verify large text without assuming a fixed 520-point container.

## Buttons and press feedback

- Prefer the shared `ActionButton` (`src/design-system/components/ActionButton.tsx`) for standard filled, outlined, or text native buttons.
- On iOS, native button content must fill the full button area before the background is applied.
- Preserve the minimum content frame as well as the outer button frame. An outer frame alone leaves the fill sized to the label.
- On iOS, a plain button (`variant="text"`) needs `contentShape(shapes.rectangle())` after the frame on its label `Text` or content `Row`. This makes empty space inside the label tappable, including space around loading indicators. Put it inside the Button, not just on the outer button frame; keep the Android modifiers unchanged.
- A Host seed color generates an Android palette. It does not preserve an exact brand fill, so use `native-button-styles.ts`.
- Universal `Row.alignment` controls vertical alignment.
- Center button labels and loading indicators horizontally in full-width rows with balanced flexible `Spacer`s on both sides of the content group, alongside centered text alignment.
- `AnimatedPressable` has platform implementations: Android uses core RN `Pressable` with a clipped, theme-tinted highlight; iOS uses a single `ReanimatedPressable` animating only `transform: [{ scale }]`. Keep the visible radius on the pressable. On iOS, never animate outer opacity (which overrides caller dimming classes) or add an inner `Animated.View` (which alters child flex layout).

## Keyboard-aware screens and bottom sheets

- `Screen` defaults `keyboardScrollMode = "layout"` on `KeyboardAwareScrollView` with explicit `style: { flex: 1 }` (and custom `FlatList` scroll components like homework detail pass `mode="layout"`). Using `mode="insets"` (`ClippingScrollViewDecoratorView`) or wrapping footers in `KeyboardStickyView` / `KeyboardToolbar` can collapse form content height inside native stack containers.
- Always render `<PendingBottomSheet>` and `<Modal>` overlays as siblings outside `<Screen>` (`<> <PendingBottomSheet ... /> <Screen ...>...</Screen> </>`) rather than inside `<Screen>`'s scroll content.

## Empty and error states

- They grow into the parent's remaining height and center a width-constrained content block.
- Scroll content keeps its intrinsic height with flex growth.
- Empty-list containers avoid asymmetric vertical padding, which shifts the state off-center.

## Scrolling, swipeable rows, and refresh

- Pull indicators track user requests, not query `isFetching`/`isRefetching` flags. Use `usePullToRefresh` for ordinary screens and return the full request promise (or `Promise.all` for multiple queries). Keep background activity indicators separate.
- Infinite lists also coordinate refresh with pagination so neither cancels the other's request. Notification and reservation lists handle that explicitly.
- When `FlashList` rows use `ReanimatedSwipeable` (`notice/index.tsx`), pass `renderScrollComponent={GestureHandlerScrollView}` to `FlashList` so horizontal swipe gestures and vertical scrolling coordinate cleanly.
- Use 1:1 interactive swipe physics on `ReanimatedSwipeable`: `friction={1}`, `overshootLeft={false}`, `overshootFriction={8}`, `dragOffsetFromLeft={10}`, `dragOffsetFromRight={-10}`, and `rightThreshold={32}`. Never set `dragOffsetFromLeft` to a large number (e.g. `10000`), because `ReanimatedSwipeable` uses `dragOffsetFromLeft` to activate rightward swipe-back-to-close drags when a right action panel is open.
- Because `FlashList` recycles row views, call `swipeableRef.current?.reset()` inside `useLayoutEffect` whenever `item.id` changes, clear the screen's open-row ref if it belonged to the recycled row, and close any open row on `onScrollBeginDrag`.
- Do not put entrance/exit animations on virtualized rows: mounting during scrolling replays them.
- Keep continuous scroll tracking on the UI thread. Updating React state every frame rerenders unrelated detail content; the session selector uses a shared value for its overflow cue.
