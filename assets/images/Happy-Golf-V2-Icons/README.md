# Happy Golf V2 - launcher and store icon pack

This pack uses the most recently approved balanced logo (green V2 badge) with
#5FB1FF solid blue background. The whole artwork, including V2, was centered
in the supplied source. All images are true PNG files in the stated pixel sizes.

## Integration in this project

- Only launcher icons use this pack. `app.json` references the `expo/` files directly.
- The default icon uses `expo/icon.png`; iOS uses `ios.icon.light` with `expo/ios-icon.png`.
- Android uses `expo/android-icon.png`, the adaptive foreground on `#5FB1FF`, and the monochrome artwork for themed launcher icons.
- In-app logos, splash, notification icons, and the web favicon retain their existing artwork and settings.
- Superseded launcher/store icon files were removed; the supplied pack and its store exports remain available.
- Launcher icon updates require a new build and installation.

The instructions below describe using the pack in another Expo/native project.

## For an Expo / React Native app

1. Copy the PNGs inside `expo/` to `your-project/assets/icons/`.
2. Merge `expo/app-json-snippet.json` into your existing app.json or app.config.
   IMPORTANT: merge, do not replace your existing app name, bundle IDs, etc.
3. Rebuild with EAS Build / native build. Changing the icon does not update an
   already installed binary without a new build/install.

- expo/icon.png: universal fallback 1024x1024, opaque blue background.
- expo/ios-icon.png: 1024x1024 RGB, no alpha or pre-rounded corners.
- expo/android-icon.png: 1024x1024 RGBA with full-bleed blue.
- expo/android-adaptive-foreground.png: 1024x1024 transparent artwork only;
  reduced slightly to stay within Android's adaptive safe circle.
- expo/android-adaptive-monochrome.png: 1024x1024 white shape on transparency,
  used for Android themed launcher icons (Android 13+).
- expo/android-adaptive-background.png: optional 1024x1024 background layer.
  The sample Expo config instead uses the exact color #5FB1FF.

## App Store Connect (Apple)

app-store/app-store-icon-1024.png: 1024x1024 opaque RGB PNG.
Apple typically gets this app icon from your signed iOS app build's asset
catalog rather than through a separate store-listing image upload.
The iOS native AppIcon.appiconset in ios-native/ is provided for Xcode users.
Do not round corners manually; iOS adds the shape mask.

## Google Play Console

google-play/google-play-icon-512.png: 512x512 32-bit RGBA PNG, fully opaque,
under 1 MiB. Use the Play Console high-resolution app icon upload.
The store listing icon is separate from the icon packaged in your Android app.
Do not pre-round corners or add system shadows.

## Android native resources (non-Expo builds)

android-native/res/mipmap-mdpi: 48x48 launcher / 108x108 adaptive foreground
android-native/res/mipmap-hdpi: 72x72 / 162x162
android-native/res/mipmap-xhdpi: 96x96 / 216x216
android-native/res/mipmap-xxhdpi: 144x144 / 324x324
android-native/res/mipmap-xxxhdpi: 192x192 / 432x432

android-native/res/mipmap-anydpi-v26 has adaptive XML definitions.
android-native/res/values/colors.xml supplies the blue background.
These assets are optional when Expo generates native icons from app config.

## Compatibility / design

- Blue background is solid #5FB1FF.
- Adaptive foreground and themed monochrome artwork have a transparent canvas.
- The main wordmark is relatively detailed, so test at tiny launcher sizes.
- This pack covers ICONS only, not screenshots, feature graphics, splash
  screens, or promotional banners for the store listings.
