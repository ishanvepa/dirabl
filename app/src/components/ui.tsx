import { Children, type PropsWithChildren, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from './theme';
import arrowIcon from '../../assets/icons/arrow.png';
import microphoneIcon from '../../assets/icons/microphone.png';
import lockIcon from '../../assets/icons/lock.png';
import uploadIcon from '../../assets/icons/upload.png';
import remindersIcon from '../../assets/icons/reminders-off.png';
import synthesisIcon from '../../assets/icons/synthesis-off.png';
export { colors, fonts } from './theme';

export function Screen({
  children,
  header,
  footer,
  contentStyle,
  footerBorder = false,
}: PropsWithChildren<{
  header?: ReactNode;
  footer?: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  footerBorder?: boolean;
}>) {
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView
      style={[styles.root, { paddingTop: Math.max(insets.top, 32) }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.frame}>
        {header}
        <ScrollView
          style={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.screen, contentStyle]}
        >
          {children}
        </ScrollView>
        {footer && (
          <View
            style={[
              styles.footer,
              footerBorder && styles.footerBorder,
              { paddingBottom: Math.max(insets.bottom, 12) },
            ]}
          >
            {footer}
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
export function Header({
  title,
  brand = false,
  onBack,
  onMore,
  right,
}: {
  title?: string;
  brand?: boolean;
  onBack?: () => void;
  onMore?: () => void;
  right?: ReactNode;
}) {
  return (
    <View style={styles.header}>
      {onBack && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={onBack}
          hitSlop={8}
          style={styles.back}
        >
          <Text style={styles.backText}>←</Text>
        </Pressable>
      )}
      <Text style={[brand ? styles.brand : styles.headerTitle, { flex: 1 }]}>
        {brand ? 'dirabl' : title}
      </Text>
      {right ??
        (onMore && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Privacy and settings"
            hitSlop={8}
            onPress={onMore}
            style={styles.more}
          >
            <Text style={styles.moreText}>•••</Text>
          </Pressable>
        ))}
    </View>
  );
}
export function Heading({
  children,
  style,
  numberOfLines,
}: PropsWithChildren<{ style?: StyleProp<TextStyle>; numberOfLines?: number }>) {
  return (
    <Text accessibilityRole="header" numberOfLines={numberOfLines} style={[styles.heading, style]}>
      {children}
    </Text>
  );
}
export function Body({ children, style, ...props }: TextProps) {
  return (
    <Text {...props} style={[styles.body, style]}>
      {children}
    </Text>
  );
}
export function ReadingText({
  children,
  style,
}: PropsWithChildren<{ style?: StyleProp<TextStyle> }>) {
  return <Text style={[styles.reading, style]}>{children}</Text>;
}
export function Label({ children, style }: PropsWithChildren<{ style?: StyleProp<TextStyle> }>) {
  return <Text style={[styles.label, style]}>{children}</Text>;
}
export function Caption({ children, style }: PropsWithChildren<{ style?: StyleProp<TextStyle> }>) {
  return <Text style={[styles.caption, style]}>{children}</Text>;
}
export function Rule({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.rule, style]} />;
}
export function Pill({ children }: PropsWithChildren) {
  return (
    <View style={styles.pill}>
      <Label style={styles.pillText}>{children}</Label>
    </View>
  );
}
export function Notice({
  children,
  title,
  warning = false,
  style,
}: PropsWithChildren<{ title?: string; warning?: boolean; style?: StyleProp<ViewStyle> }>) {
  return (
    <View
      accessibilityLiveRegion="polite"
      style={[styles.notice, warning && { backgroundColor: colors.quiet }, style]}
    >
      {title && <Label style={{ color: warning ? colors.orange : colors.forest }}>{title}</Label>}
      {Children.map(children, (child) =>
        typeof child === 'string' || typeof child === 'number' ? (
          <Body style={styles.noticeBody}>{child}</Body>
        ) : (
          child
        ),
      )}
    </View>
  );
}
export function Busy() {
  return <ActivityIndicator accessibilityLabel="Loading" color={colors.forest} />;
}
export function Button({
  title,
  onPress,
  disabled = false,
  variant = 'accent',
  loading = false,
  style,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'accent' | 'primary' | 'quiet';
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === 'primary' && styles.primaryButton,
        variant === 'quiet' && styles.quietButton,
        disabled && styles.quietButton,
        pressed && styles.pressed,
        style,
      ]}
    >
      {loading && (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? colors.surface : colors.ink}
        />
      )}
      <Text
        style={[
          styles.buttonText,
          variant === 'primary' && { color: colors.surface },
          disabled && { color: colors.muted },
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}
export function TextButton({
  title,
  onPress,
  disabled = false,
  style,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  style?: StyleProp<TextStyle>;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.textButton, pressed && styles.pressed]}
    >
      <Text style={[styles.textButtonText, disabled && { opacity: 0.5 }, style]}>{title}</Text>
    </Pressable>
  );
}
const icons = {
  arrow: { source: arrowIcon, width: 20, height: 20 },
  microphone: { source: microphoneIcon, width: 34, height: 34 },
  lock: { source: lockIcon, width: 21, height: 21 },
  upload: { source: uploadIcon, width: 27, height: 27 },
  reminders: { source: remindersIcon, width: 55, height: 30 },
  synthesis: { source: synthesisIcon, width: 58, height: 32 },
};
export function DesignIcon({ name }: { name: keyof typeof icons }) {
  const icon = icons[name];
  return (
    <Image
      source={icon.source}
      style={{ width: icon.width, height: icon.height }}
      resizeMode="contain"
      accessible={false}
    />
  );
}
export function Toggle({
  value,
  onChange,
  disabled = false,
  label,
}: {
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value, disabled }}
      disabled={disabled}
      onPress={() => onChange(!value)}
      style={styles.toggleTarget}
    >
      {value ? (
        <View style={styles.toggleOn}>
          <View style={styles.toggleThumb} />
        </View>
      ) : (
        <DesignIcon name="synthesis" />
      )}
    </Pressable>
  );
}
export function ReadingChoice({
  selected,
  title,
  description,
  onPress,
}: {
  selected: boolean;
  title: string;
  description: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={title}
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={[styles.choice, selected && styles.choiceSelected]}
    >
      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected && <Text style={styles.check}>✓</Text>}
      </View>
      <View style={{ flex: 1, gap: 5 }}>
        <Text style={styles.choiceTitle}>{title}</Text>
        <Body style={styles.choiceDescription}>{description}</Body>
      </View>
    </Pressable>
  );
}
export const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.paper },
  frame: { flex: 1, width: '100%', maxWidth: 650, alignSelf: 'center' },
  scroll: { flex: 1 },
  screen: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 24, paddingBottom: 24 },
  header: { height: 68, paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center' },
  brand: {
    fontFamily: fonts.semibold,
    color: colors.ink,
    fontSize: 25,
    lineHeight: 30,
    includeFontPadding: false,
  },
  headerTitle: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    lineHeight: 17,
    color: colors.muted,
    includeFontPadding: false,
  },
  back: { width: 50, minHeight: 44, justifyContent: 'center' },
  backText: {
    color: colors.ink,
    fontFamily: fonts.regular,
    fontSize: 25,
    lineHeight: 30,
    includeFontPadding: false,
  },
  more: { width: 44, minHeight: 44, alignItems: 'flex-end', justifyContent: 'center' },
  moreText: {
    color: colors.ink,
    fontFamily: fonts.medium,
    fontSize: 20,
    letterSpacing: 2,
    lineHeight: 25,
  },
  heading: {
    fontFamily: fonts.editorial,
    fontSize: 49,
    lineHeight: 53,
    color: colors.ink,
    includeFontPadding: false,
  },
  body: {
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 23,
    color: colors.muted,
    includeFontPadding: false,
  },
  reading: {
    fontFamily: fonts.reading,
    fontSize: 20,
    lineHeight: 29,
    color: colors.ink,
    includeFontPadding: false,
  },
  label: {
    fontFamily: fonts.semibold,
    fontSize: 10,
    lineHeight: 15,
    color: colors.forest,
    includeFontPadding: false,
  },
  caption: {
    fontFamily: fonts.medium,
    fontSize: 9,
    lineHeight: 13,
    textAlign: 'center',
    color: colors.muted,
    includeFontPadding: false,
  },
  muted: { fontFamily: fonts.regular, color: colors.muted, fontSize: 12, lineHeight: 18 },
  rule: { height: 1, backgroundColor: colors.border },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pill: {
    backgroundColor: colors.soft,
    borderRadius: 15,
    height: 30,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  pillText: { fontFamily: fonts.medium, fontSize: 10, lineHeight: 14 },
  notice: { padding: 16, backgroundColor: colors.soft, borderRadius: 18, gap: 9 },
  noticeBody: { color: colors.ink, fontSize: 14, lineHeight: 21 },
  footer: { backgroundColor: colors.paper, paddingHorizontal: 24, paddingTop: 16, gap: 10 },
  footerBorder: { borderTopWidth: 1, borderTopColor: colors.border },
  button: {
    backgroundColor: colors.accent,
    borderRadius: 18,
    minHeight: 56,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: { backgroundColor: colors.ink },
  quietButton: { backgroundColor: colors.quiet },
  buttonText: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    lineHeight: 21,
    color: colors.ink,
    includeFontPadding: false,
    textAlign: 'center',
  },
  pressed: { opacity: 0.7 },
  textButton: { minHeight: 38, alignItems: 'center', justifyContent: 'center' },
  textButtonText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 18,
    color: colors.muted,
    includeFontPadding: false,
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
    fontFamily: fonts.reading,
    fontSize: 19,
    lineHeight: 29,
    color: colors.ink,
    minHeight: 330,
    textAlignVertical: 'top',
    includeFontPadding: false,
  },
  card: {
    padding: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
  },
  toggleTarget: { width: 58, height: 44, alignItems: 'center', justifyContent: 'center' },
  toggleOn: {
    width: 58,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.forest,
    padding: 3,
    alignItems: 'flex-end',
  },
  toggleThumb: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.surface },
  choice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    minHeight: 75,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 16,
  },
  choiceSelected: { backgroundColor: colors.soft, borderColor: colors.forest },
  radio: {
    width: 29,
    height: 29,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: { backgroundColor: colors.forest, borderColor: colors.forest },
  check: { fontFamily: fonts.semibold, color: colors.surface, fontSize: 15, lineHeight: 20 },
  choiceTitle: { fontFamily: fonts.semibold, color: colors.ink, fontSize: 15, lineHeight: 20 },
  choiceDescription: { fontSize: 11, lineHeight: 17 },
});
