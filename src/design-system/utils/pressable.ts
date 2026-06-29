export function getPressedScaleStyle(
    pressed: boolean,
    disabled = false,
    scale = 0.985,
) {
    return {
        transform: [{ scale: pressed && !disabled ? scale : 1 }],
    };
}
