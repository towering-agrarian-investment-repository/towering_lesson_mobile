You are implementing a reusable design system for an Expo React Native mobile app using:

- Expo
- Expo Router
- TypeScript
- NativeWind
- Latest Tailwind CSS setup already available in the project
- Android and iOS support

Goal:
Create a scalable design-system layer that provides reusable UI components, semantic Tailwind tokens, dark mode support, and consistent cross-platform behavior.

Do not introduce a heavy UI component library. Build reusable project-owned components using NativeWind className styling.

==================================================
1. Expected folder structure
==================================================

Create or update this structure:

src/
  app/
    _layout.tsx

  design-system/
    components/
      AppText.tsx
      Button.tsx
      Input.tsx
      Screen.tsx
      Card.tsx
      IconButton.tsx
      Divider.tsx
      Badge.tsx

    layout/
      Row.tsx
      Stack.tsx
      Container.tsx

    utils/
      cn.ts
      platform.ts

==================================================
2. Utility: cn helper
==================================================

Create:

src/design-system/utils/cn.ts

Use clsx and tailwind-merge.

Install dependencies if missing:
npm install clsx tailwind-merge

Implementation:

import clsx, { type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

==================================================
3. Utility: platform helper
==================================================

Create:

src/design-system/utils/platform.ts

Implementation:

import { Platform } from 'react-native';

export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';

==================================================
4. Tailwind semantic tokens
==================================================

Update the Tailwind/global NativeWind theme setup so the app supports these semantic classes:

bg-background
text-foreground
bg-surface
bg-card
border-border
text-muted-foreground
bg-muted
bg-primary
text-primary-foreground
bg-secondary
text-secondary-foreground
bg-danger
text-danger
bg-success
text-success
bg-warning
text-warning

Use semantic names, not raw gray/blue colors inside app screens.

Required light theme values:

background: #FFFFFF
foreground: #111827
surface: #F9FAFB
card: #FFFFFF
border: #E5E7EB
muted: #F3F4F6
muted-foreground: #6B7280
primary: #2563EB
primary-foreground: #FFFFFF
secondary: #F3F4F6
secondary-foreground: #111827
danger: #DC2626
success: #16A34A
warning: #F59E0B

Required dark theme values:

background: #0B1120
foreground: #F9FAFB
surface: #111827
card: #111827
border: #1F2937
muted: #1F2937
muted-foreground: #9CA3AF
primary: #60A5FA
primary-foreground: #0B1120
secondary: #1F2937
secondary-foreground: #F9FAFB
danger: #F87171
success: #4ADE80
warning: #FBBF24

Also ensure app.json or app.config.ts has:

{
  "expo": {
    "userInterfaceStyle": "automatic"
  }
}

==================================================
5. Root layout
==================================================

Update:

src/app/_layout.tsx

Requirements:
- Use Expo Router Stack.
- Import global CSS if this project uses a global.css file for NativeWind.
- Set status bar behavior correctly.
- Do not create a custom ThemeProvider unless the app already has one.
- NativeWind dark mode should follow system preference.

Example shape:

import '../global.css';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <Stack screenOptions={{ headerShown: false }} />
      <StatusBar style="auto" />
    </>
  );
}

Adjust import path for global.css based on the existing project structure.

==================================================
6. Component: AppText
==================================================

Create:

src/design-system/components/AppText.tsx

Requirements:
- Wrap React Native Text.
- Support variants:
  - h1
  - h2
  - h3
  - body
  - muted
  - caption
  - label
- Accept all TextProps.
- Accept className.
- Use cn helper.
- Default variant is body.

Implementation target:

import { Text, type TextProps } from 'react-native';
import { cn } from '../utils/cn';

type AppTextVariant =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'body'
  | 'muted'
  | 'caption'
  | 'label';

type AppTextProps = TextProps & {
  variant?: AppTextVariant;
  className?: string;
};

export function AppText({
  variant = 'body',
  className,
  ...props
}: AppTextProps) {
  return (
    <Text
      className={cn(
        'text-foreground',
        variant === 'h1' && 'text-3xl font-bold leading-10',
        variant === 'h2' && 'text-2xl font-bold leading-8',
        variant === 'h3' && 'text-xl font-semibold leading-7',
        variant === 'body' && 'text-base leading-6',
        variant === 'muted' && 'text-base leading-6 text-muted-foreground',
        variant === 'caption' && 'text-xs leading-4 text-muted-foreground',
        variant === 'label' && 'text-sm font-medium text-foreground',
        className
      )}
      {...props}
    />
  );
}

==================================================
7. Component: Button
==================================================

Create:

src/design-system/components/Button.tsx

Requirements:
- Use Pressable.
- Use NativeWind classes.
- Support variants:
  - primary
  - secondary
  - ghost
  - danger
- Support sizes:
  - sm
  - md
  - lg
- Support loading, disabled, className, textClassName.
- Accept PressableProps.
- Set accessibilityRole="button".
- Minimum normal height should be 48px for md.

Implementation target:

import {
  ActivityIndicator,
  Pressable,
  Text,
  type PressableProps,
} from 'react-native';
import { cn } from '../utils/cn';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonProps = PressableProps & {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  className?: string;
  textClassName?: string;
};

export function Button({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className,
  textClassName,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      className={cn(
        'items-center justify-center rounded-xl active:opacity-80',
        isDisabled && 'opacity-50',
        size === 'sm' && 'h-10 px-3',
        size === 'md' && 'h-12 px-4',
        size === 'lg' && 'h-14 px-6',
        variant === 'primary' && 'bg-primary',
        variant === 'secondary' && 'border border-border bg-surface',
        variant === 'ghost' && 'bg-transparent',
        variant === 'danger' && 'bg-danger',
        className
      )}
      {...props}
    >
      {loading ? (
        <ActivityIndicator />
      ) : (
        <Text
          className={cn(
            'text-base font-semibold',
            variant === 'primary' && 'text-primary-foreground',
            variant === 'secondary' && 'text-foreground',
            variant === 'ghost' && 'text-foreground',
            variant === 'danger' && 'text-white',
            textClassName
          )}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

==================================================
8. Component: Screen
==================================================

Create:

src/design-system/components/Screen.tsx

Requirements:
- Use SafeAreaView from react-native-safe-area-context.
- Support scroll mode.
- Support className and contentClassName.
- Use bg-background.
- Use keyboardShouldPersistTaps="handled" for ScrollView.
- Keep consistent horizontal padding.

Implementation target:

import { type ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { cn } from '../utils/cn';

type ScreenProps = {
  children: ReactNode;
  scroll?: boolean;
  className?: string;
  contentClassName?: string;
};

export function Screen({
  children,
  scroll = false,
  className,
  contentClassName,
}: ScreenProps) {
  if (scroll) {
    return (
      <SafeAreaView className={cn('flex-1 bg-background', className)}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerClassName={cn('px-4 py-6', contentClassName)}
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className={cn('flex-1 bg-background', className)}>
      <View className={cn('flex-1 px-4 py-6', contentClassName)}>
        {children}
      </View>
    </SafeAreaView>
  );
}

==================================================
9. Component: Input
==================================================

Create:

src/design-system/components/Input.tsx

Requirements:
- Wrap TextInput.
- Support label and error.
- Accept TextInputProps.
- Use AppText.
- Use semantic colors.
- Add placeholderTextColor.
- Use h-12, rounded-xl, border-border, bg-surface.
- Error state should use border-danger and text-danger.

Implementation target:

import { TextInput, View, type TextInputProps } from 'react-native';
import { AppText } from './AppText';
import { cn } from '../utils/cn';

type InputProps = TextInputProps & {
  label?: string;
  error?: string;
  className?: string;
  containerClassName?: string;
};

export function Input({
  label,
  error,
  className,
  containerClassName,
  ...props
}: InputProps) {
  return (
    <View className={cn('gap-2', containerClassName)}>
      {label ? <AppText variant="label">{label}</AppText> : null}

      <TextInput
        placeholderTextColor="#9CA3AF"
        className={cn(
          'h-12 rounded-xl border border-border bg-surface px-4 text-base text-foreground',
          'focus:border-primary',
          error && 'border-danger',
          className
        )}
        {...props}
      />

      {error ? (
        <AppText variant="caption" className="text-danger">
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

==================================================
10. Component: Card
==================================================

Create:

src/design-system/components/Card.tsx

Requirements:
- Wrap View.
- Accept ViewProps and className.
- Use rounded-2xl, border, bg-card, p-4.
- Add platform shadow/elevation classes only if supported by the project NativeWind config.
- If elevation/shadow classes are not supported, keep it simple without shadows.

Implementation target:

import { View, type ViewProps } from 'react-native';
import { cn } from '../utils/cn';

type CardProps = ViewProps & {
  className?: string;
};

export function Card({ className, ...props }: CardProps) {
  return (
    <View
      className={cn(
        'rounded-2xl border border-border bg-card p-4',
        className
      )}
      {...props}
    />
  );
}

==================================================
11. Component: IconButton
==================================================

Create:

src/design-system/components/IconButton.tsx

Requirements:
- Use Pressable.
- Accept children as icon.
- Support variant primary, secondary, ghost.
- Support size sm, md, lg.
- Accessibility label is required.
- Use accessibilityRole="button".

Implementation target:

import {
  Pressable,
  type PressableProps,
} from 'react-native';
import { cn } from '../utils/cn';

type IconButtonVariant = 'primary' | 'secondary' | 'ghost';
type IconButtonSize = 'sm' | 'md' | 'lg';

type IconButtonProps = PressableProps & {
  children: React.ReactNode;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  className?: string;
  accessibilityLabel: string;
};

export function IconButton({
  children,
  variant = 'ghost',
  size = 'md',
  className,
  disabled,
  ...props
}: IconButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      className={cn(
        'items-center justify-center rounded-full active:opacity-80',
        disabled && 'opacity-50',
        size === 'sm' && 'h-9 w-9',
        size === 'md' && 'h-11 w-11',
        size === 'lg' && 'h-14 w-14',
        variant === 'primary' && 'bg-primary',
        variant === 'secondary' && 'bg-surface border border-border',
        variant === 'ghost' && 'bg-transparent',
        className
      )}
      {...props}
    >
      {children}
    </Pressable>
  );
}

==================================================
12. Component: Divider
==================================================

Create:

src/design-system/components/Divider.tsx

Implementation target:

import { View } from 'react-native';
import { cn } from '../utils/cn';

type DividerProps = {
  className?: string;
};

export function Divider({ className }: DividerProps) {
  return <View className={cn('h-px w-full bg-border', className)} />;
}

==================================================
13. Component: Badge
==================================================

Create:

src/design-system/components/Badge.tsx

Requirements:
- Support variants:
  - default
  - success
  - warning
  - danger
- Use AppText.

Implementation target:

import { View } from 'react-native';
import { AppText } from './AppText';
import { cn } from '../utils/cn';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger';

type BadgeProps = {
  label: string;
  variant?: BadgeVariant;
  className?: string;
  textClassName?: string;
};

export function Badge({
  label,
  variant = 'default',
  className,
  textClassName,
}: BadgeProps) {
  return (
    <View
      className={cn(
        'self-start rounded-full px-2.5 py-1',
        variant === 'default' && 'bg-muted',
        variant === 'success' && 'bg-success/10',
        variant === 'warning' && 'bg-warning/10',
        variant === 'danger' && 'bg-danger/10',
        className
      )}
    >
      <AppText
        variant="caption"
        className={cn(
          'font-medium',
          variant === 'default' && 'text-muted-foreground',
          variant === 'success' && 'text-success',
          variant === 'warning' && 'text-warning',
          variant === 'danger' && 'text-danger',
          textClassName
        )}
      >
        {label}
      </AppText>
    </View>
  );
}

==================================================
14. Layout: Row
==================================================

Create:

src/design-system/layout/Row.tsx

Implementation target:

import { View, type ViewProps } from 'react-native';
import { cn } from '../utils/cn';

type RowProps = ViewProps & {
  className?: string;
};

export function Row({ className, ...props }: RowProps) {
  return <View className={cn('flex-row items-center', className)} {...props} />;
}

==================================================
15. Layout: Stack
==================================================

Create:

src/design-system/layout/Stack.tsx

Implementation target:

import { View, type ViewProps } from 'react-native';
import { cn } from '../utils/cn';

type StackProps = ViewProps & {
  className?: string;
};

export function Stack({ className, ...props }: StackProps) {
  return <View className={cn('flex-col', className)} {...props} />;
}

==================================================
16. Layout: Container
==================================================

Create:

src/design-system/layout/Container.tsx

Implementation target:

import { View, type ViewProps } from 'react-native';
import { cn } from '../utils/cn';

type ContainerProps = ViewProps & {
  className?: string;
};

export function Container({ className, ...props }: ContainerProps) {
  return <View className={cn('w-full px-4', className)} {...props} />;
}

==================================================
17. Add exports
==================================================

Create:

src/design-system/index.ts

Export all public components and utilities:

export * from './components/AppText';
export * from './components/Button';
export * from './components/Input';
export * from './components/Screen';
export * from './components/Card';
export * from './components/IconButton';
export * from './components/Divider';
export * from './components/Badge';

export * from './layout/Row';
export * from './layout/Stack';
export * from './layout/Container';

export * from './utils/cn';
export * from './utils/platform';

==================================================
18. Example usage screen
==================================================

Create or update a demo screen only if appropriate:

src/app/index.tsx

Example:

import { View } from 'react-native';
import {
  AppText,
  Badge,
  Button,
  Card,
  Input,
  Screen,
} from '@/design-system';

export default function HomeScreen() {
  return (
    <Screen scroll contentClassName="gap-6">
      <View className="gap-2">
        <AppText variant="h1">Welcome</AppText>
        <AppText variant="muted">
          Build once, ship cleanly to Android and iOS.
        </AppText>
      </View>

      <Card className="gap-4">
        <Badge label="Design System Ready" variant="success" />

        <Input label="Email" placeholder="you@example.com" />
        <Input label="Password" placeholder="Password" secureTextEntry />

        <Button title="Sign in" />
        <Button title="Create account" variant="secondary" />
      </Card>
    </Screen>
  );
}

==================================================
19. Coding rules
==================================================

Follow these rules across implementation:

1. Do not hard-code random colors in app screens.
2. Use semantic class names:
   - bg-background
   - text-foreground
   - bg-card
   - border-border
   - text-muted-foreground
   - bg-primary
   - text-primary-foreground
3. Repeated UI must be a design-system component.
4. Screens may use layout classes like gap-4, px-4, flex-1.
5. Do not create business-specific components inside design-system.
6. Keep design-system components generic.
7. Use TypeScript types for all props.
8. Keep Android and iOS behavior shared unless platform-specific behavior is necessary.
9. Use Pressable for interactive components.
10. Add accessibilityRole and accessibilityLabel where needed.
11. Use SafeAreaView for screen-level layout.
12. Keep button/input normal height at least h-12.
13. Do not use StyleSheet unless NativeWind cannot handle a specific platform behavior.
14. Do not add unnecessary dependencies.

==================================================
20. Acceptance criteria
==================================================

The task is complete when:

- App builds successfully on Expo.
- TypeScript has no errors.
- NativeWind className styling works on Android and iOS.
- Light and dark mode use semantic tokens.
- userInterfaceStyle is set to automatic.
- The following imports work:

import {
  AppText,
  Button,
  Input,
  Screen,
  Card,
  IconButton,
  Divider,
  Badge,
  Row,
  Stack,
  Container,
} from '@/design-system';

- Components render correctly in both light and dark mode.
- Buttons support loading and disabled states.
- Inputs support label and error states.
- Screen supports scroll and non-scroll mode.
- No app screen contains duplicated raw button/input/card markup when design-system components should be used.