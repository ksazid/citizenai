import React from 'react';
import { Platform, Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import Svg, { Circle } from 'react-native-svg';
import { ScreenId, TabId, TAB_TARGETS } from './model';
import { readinessTone, theme } from './theme';

type IconLibrary = 'ion' | 'mci';
type IconTone = 'blue' | 'teal' | 'neutral' | 'success' | 'warning';

type GlassSurfaceProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

const iconTone = (tone: IconTone) => {
  if (tone === 'teal' || tone === 'success') return { bg: theme.color.tealSoft, fg: theme.color.tealDark };
  if (tone === 'warning') return { bg: theme.color.warningSoft, fg: theme.color.warning };
  if (tone === 'neutral') return { bg: theme.color.surfaceMuted, fg: theme.color.textMuted };
  return { bg: theme.color.primarySoft, fg: theme.color.primary };
};

const fireSelectionHaptic = () => {
  if (Platform.OS === 'web') return;
  void Haptics.selectionAsync().catch(() => undefined);
};

const fireImpactHaptic = () => {
  if (Platform.OS === 'web') return;
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
};

function GlassSurface({ children, style }: GlassSurfaceProps) {
  if (Platform.OS === 'ios' || Platform.OS === 'web') {
    return <BlurView intensity={72} tint="light" style={[styles.glassSurface, style]}>{children}</BlurView>;
  }
  return <View style={[styles.glassSurface, styles.glassFallback, style]}>{children}</View>;
}

export function AppIcon({ library = 'ion', name, size = 24, color = theme.color.primary }: { library?: IconLibrary; name: string; size?: number; color?: string }) {
  return library === 'mci'
    ? <MaterialCommunityIcons name={name as any} size={size} color={color} />
    : <Ionicons name={name as any} size={size} color={color} />;
}

export function IconTile({ library = 'ion', name, tone = 'blue', size = 48, iconSize = 25 }: { library?: IconLibrary; name: string; tone?: IconTone; size?: number; iconSize?: number }) {
  const t = iconTone(tone);
  return <View style={[styles.iconTile, { width: size, height: size, borderRadius: Math.round(size * 0.3), backgroundColor: t.bg }]}><AppIcon library={library} name={name} size={iconSize} color={t.fg} /></View>;
}

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return <View style={styles.brandRow}><MaterialCommunityIcons name="shield-crown-outline" size={compact ? 31 : 38} color={theme.color.text} /><Text maxFontSizeMultiplier={1.35} style={[styles.brand, compact && { fontSize: 22 }]}>CitizenAI</Text></View>;
}

export function AppHeader({ onBack, days = '12 days until test' }: { onBack?: () => void; days?: string }) {
  return <GlassSurface style={styles.appHeader}>
    <View style={styles.appHeaderLeft}>
      {onBack ? <Pressable accessibilityRole="button" accessibilityLabel="Go back" hitSlop={6} onPress={() => { fireSelectionHaptic(); onBack(); }} style={({ pressed }) => [styles.headerBack, pressed && styles.pressScale]}><Ionicons name="arrow-back" size={23} color={theme.color.text} /></Pressable> : null}
      <BrandMark compact />
    </View>
    <View style={styles.dateWrap}><IconTile name="calendar-outline" tone="neutral" size={36} iconSize={18} /><Text maxFontSizeMultiplier={1.25} style={styles.dateText}>{days}</Text></View>
  </GlassSurface>;
}

export function Header({ title, eyebrow, onBack }: { title: string; eyebrow?: string; onBack?: () => void }) {
  return <View style={styles.header}>
    <View style={styles.headerRow}>
      {onBack ? <Pressable accessibilityRole="button" accessibilityLabel="Go back" hitSlop={6} onPress={() => { fireSelectionHaptic(); onBack(); }} style={({ pressed }) => [styles.headerBack, pressed && styles.pressScale]}><Ionicons name="arrow-back" size={23} color={theme.color.text} /></Pressable> : null}
      <View style={{ flex: 1 }}>
        {eyebrow ? <Text maxFontSizeMultiplier={1.4} style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text maxFontSizeMultiplier={1.45} style={styles.headerTitle}>{title}</Text>
      </View>
    </View>
  </View>;
}

export function Card({ children, tone = 'default', style }: { children: React.ReactNode; tone?: 'default' | 'soft' | 'success' | 'warning'; style?: ViewStyle | ViewStyle[] }) {
  const toneStyle = tone === 'success' ? styles.cardSuccess : tone === 'warning' ? styles.cardWarning : tone === 'soft' ? styles.cardSoft : null;
  return <View style={[styles.card, toneStyle, style]}>{children}</View>;
}

export function Button({ label, onPress, secondary = false, disabled = false, showArrow = true }: { label: string; onPress?: () => void; secondary?: boolean; disabled?: boolean; showArrow?: boolean }) {
  return <Pressable
    accessibilityRole="button"
    accessibilityLabel={label}
    accessibilityState={{ disabled }}
    disabled={disabled}
    onPress={() => { fireImpactHaptic(); onPress?.(); }}
    style={({ pressed }) => [styles.button, secondary && styles.buttonSecondary, disabled && styles.buttonDisabled, pressed && !disabled && styles.pressScale]}
  >
    <Text maxFontSizeMultiplier={1.45} style={[styles.buttonText, secondary && styles.buttonSecondaryText]}>{label}</Text>
    {showArrow ? <Ionicons name="chevron-forward" size={20} color={secondary ? theme.color.primary : theme.color.white} /> : null}
  </Pressable>;
}

export function TextAction({ label, onPress }: { label: string; onPress?: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} hitSlop={4} onPress={() => { fireSelectionHaptic(); onPress?.(); }} style={({ pressed }) => [styles.textAction, pressed && styles.pressScale]}><Text maxFontSizeMultiplier={1.4} style={styles.textActionText}>{label}</Text></Pressable>;
}

export function Pill({ label, tone = 'primary' }: { label: string; tone?: 'primary' | 'success' | 'warning' | 'neutral' }) {
  const map = { primary: [theme.color.primarySoft, theme.color.primary], success: [theme.color.successSoft, theme.color.success], warning: [theme.color.warningSoft, theme.color.warning], neutral: [theme.color.surfaceMuted, theme.color.textMuted] } as const;
  return <View style={[styles.pill, { backgroundColor: map[tone][0] }]}><Text maxFontSizeMultiplier={1.3} style={[styles.pillText, { color: map[tone][1] }]}>{label}</Text></View>;
}

export function ProgressBar({ value, max = 100, label, valueLabel, teal = false }: { value: number; max?: number; label?: string; valueLabel?: string; teal?: boolean }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return <View style={styles.progressWrap}>
    {label || valueLabel ? <View style={styles.rowBetween}><Text maxFontSizeMultiplier={1.35} style={styles.small}>{label}</Text><Text maxFontSizeMultiplier={1.35} style={styles.smallStrong}>{valueLabel ?? `${Math.round(pct)}%`}</Text></View> : null}
    <View style={styles.track}><View style={[styles.fill, teal && { backgroundColor: theme.color.teal }, { width: `${pct}%` }]} /></View>
  </View>;
}

export function ProgressRing({ score, label, size = 172, stroke = 10, color = theme.color.primary }: { score: number; label?: string; size?: number; stroke?: number; color?: string }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(100, score)) / 100;
  return <View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(score) }} accessibilityLabel={label ? `${label}: ${Math.round(score)} percent` : `${Math.round(score)} percent`} style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
      <Circle cx={size / 2} cy={size / 2} r={radius} stroke="#DCE8F2" strokeWidth={stroke} fill="transparent" />
      <Circle cx={size / 2} cy={size / 2} r={radius} stroke={color} strokeWidth={stroke} fill="transparent" strokeDasharray={`${circumference * progress} ${circumference}`} strokeLinecap="round" rotation="-90" origin={`${size / 2}, ${size / 2}`} />
    </Svg>
    <View style={styles.ringCenter}><View style={styles.ringValueRow}><Text maxFontSizeMultiplier={1.15} style={[styles.ringValue, size < 150 && { fontSize: 42, lineHeight: 47 }]}>{score}</Text><Text maxFontSizeMultiplier={1.15} style={[styles.ringPercent, size < 150 && { fontSize: 20 }]}>%</Text></View>{label ? <Text numberOfLines={2} maxFontSizeMultiplier={1.25} style={[styles.ringLabel, label.length > 10 && { fontSize: 13 }, { color }]}>{label}</Text> : null}</View>
  </View>;
}

export function ReadinessCard({ score, delta, confidence, compact = false }: { score: number; delta?: string; confidence?: string; compact?: boolean }) {
  const tone = readinessTone(score);
  return <Card style={compact ? { padding: 18 } : undefined}><View style={styles.readinessRow}><ProgressRing score={score} label={tone.label} size={compact ? 132 : 156} stroke={9} color={tone.fg} /><View style={styles.readinessCopy}><Text maxFontSizeMultiplier={1.35} style={styles.readinessTitle}>Your readiness</Text>{delta ? <Text maxFontSizeMultiplier={1.4} style={styles.readinessDelta}>{delta}</Text> : null}{confidence ? <Text maxFontSizeMultiplier={1.5} style={styles.readinessSupport}>Coverage confidence · {confidence}</Text> : null}</View></View></Card>;
}

export function FeatureRow({ library = 'ion', icon, tone = 'blue', title, subtitle }: { library?: IconLibrary; icon: string; tone?: IconTone; title: string; subtitle: string }) {
  return <View style={styles.featureRow}><IconTile library={library} name={icon} tone={tone} size={46} iconSize={24} /><View style={{ flex: 1 }}><Text maxFontSizeMultiplier={1.4} style={styles.featureTitle}>{title}</Text><Text maxFontSizeMultiplier={1.5} style={styles.featureSubtitle}>{subtitle}</Text></View></View>;
}

export function QuickAction({ library = 'ion', icon, tone = 'blue', title, onPress }: { library?: IconLibrary; icon: string; tone?: IconTone; title: string; onPress?: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={title} onPress={() => { fireSelectionHaptic(); onPress?.(); }} style={({ pressed }) => [styles.quickAction, pressed && styles.quickActionPressed]}><AppIcon library={library} name={icon} size={28} color={iconTone(tone).fg} /><Text maxFontSizeMultiplier={1.35} style={styles.quickActionText}>{title}</Text></Pressable>;
}

export function TrustCard({ title, subtitle }: { title: string; subtitle: string }) {
  return <View style={styles.trustCard}><IconTile name="sparkles" size={42} iconSize={21} /><View style={{ flex: 1 }}><Text maxFontSizeMultiplier={1.4} style={styles.trustTitle}>{title}</Text><Text maxFontSizeMultiplier={1.5} style={styles.trustSubtitle}>{subtitle}</Text></View></View>;
}

export function Metric({ label, value, note }: { label: string; value: string; note?: string }) {
  return <View style={styles.metric}><Text maxFontSizeMultiplier={1.25} style={styles.metricValue}>{value}</Text><Text maxFontSizeMultiplier={1.4} style={styles.metricLabel}>{label}</Text>{note ? <Text maxFontSizeMultiplier={1.4} style={styles.micro}>{note}</Text> : null}</View>;
}

export function SummaryMetric({ library = 'ion', icon, tone = 'blue', label, value, valueTone = 'blue' }: { library?: IconLibrary; icon: string; tone?: IconTone; label: string; value: string; valueTone?: IconTone }) {
  return <View style={styles.summaryMetric}><IconTile library={library} name={icon} tone={tone} size={52} iconSize={26} /><Text maxFontSizeMultiplier={1.35} style={styles.summaryLabel}>{label}</Text><Text maxFontSizeMultiplier={1.25} style={[styles.summaryValue, { color: iconTone(valueTone).fg }]}>{value}</Text></View>;
}

export function ListRow({ title, meta, onPress, trailing, icon, iconLibrary = 'ion', iconTone: tone = 'blue', hideDivider = false }: { title: string; meta?: string; onPress?: () => void; trailing?: string; icon?: string; iconLibrary?: IconLibrary; iconTone?: IconTone; hideDivider?: boolean }) {
  return <Pressable
    accessibilityRole={onPress ? 'button' : undefined}
    accessibilityLabel={onPress ? `${title}${meta ? `. ${meta}` : ''}${trailing ? `. ${trailing}` : ''}` : undefined}
    onPress={onPress ? () => { fireSelectionHaptic(); onPress(); } : undefined}
    style={({ pressed }) => [styles.listRow, hideDivider && { borderBottomWidth: 0 }, pressed && onPress ? styles.listRowPressed : null]}
  >
    {icon ? <IconTile library={iconLibrary} name={icon} tone={tone} size={40} iconSize={21} /> : null}
    <View style={{ flex: 1 }}><Text maxFontSizeMultiplier={1.45} style={styles.listTitle}>{title}</Text>{meta ? <Text maxFontSizeMultiplier={1.5} style={styles.listMeta}>{meta}</Text> : null}</View>
    {trailing ? <Text maxFontSizeMultiplier={1.35} style={styles.trailing}>{trailing}</Text> : null}
    {onPress ? <Ionicons name="chevron-forward" size={19} color={theme.color.textSoft} /> : null}
  </Pressable>;
}

export function BottomTabs({ active, navigate }: { active: TabId; navigate: (screen: ScreenId) => void }) {
  const tabs: { id: TabId; label: string; icon: string }[] = [
    { id: 'home', label: 'Home', icon: 'home' },
    { id: 'learn', label: 'Learn', icon: 'book-outline' },
    { id: 'progress', label: 'Progress', icon: 'stats-chart' },
    { id: 'profile', label: 'Profile', icon: 'person-outline' }
  ];
  return <GlassSurface style={styles.tabs}>{tabs.map(tab => {
    const selected = active === tab.id;
    return <Pressable accessibilityRole="tab" accessibilityLabel={tab.label} accessibilityState={{ selected }} key={tab.id} onPress={() => { fireSelectionHaptic(); navigate(TAB_TARGETS[tab.id]); }} style={({ pressed }) => [styles.tab, selected && styles.tabSelected, pressed && styles.pressScale]}><Ionicons name={tab.icon as any} size={23} color={selected ? theme.color.primaryDark : theme.color.navInactive} /><Text maxFontSizeMultiplier={1.2} style={[styles.tabText, selected && styles.tabActive]}>{tab.label}</Text></Pressable>;
  })}</GlassSurface>;
}

export const typography = StyleSheet.create({
  display: { fontSize: theme.type.display, lineHeight: 48, fontWeight: '700', color: theme.color.text, letterSpacing: -1.1 },
  h1: { fontSize: theme.type.h1, lineHeight: 39, fontWeight: '700', color: theme.color.text, letterSpacing: -0.75 },
  h2: { fontSize: theme.type.h2, lineHeight: 31, fontWeight: '700', color: theme.color.text, letterSpacing: -0.35 },
  h3: { fontSize: theme.type.h3, lineHeight: 27, fontWeight: '700', color: theme.color.text },
  body: { fontSize: theme.type.body, lineHeight: 25, color: theme.color.text },
  muted: { fontSize: theme.type.body, lineHeight: 25, color: theme.color.textMuted },
  small: { fontSize: theme.type.small, lineHeight: 20, color: theme.color.textMuted }
});

const styles = StyleSheet.create({
  glassSurface: { overflow: 'hidden', backgroundColor: theme.color.glass, borderWidth: 1, borderColor: theme.color.glassBorder },
  glassFallback: { backgroundColor: theme.color.glassStrong },
  appHeader: { minHeight: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22, borderRadius: theme.radius.lg, paddingHorizontal: 10, paddingVertical: 8, ...theme.shadow.soft },
  appHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
  dateWrap: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingLeft: 8 },
  dateText: { color: theme.color.text, fontSize: 13, lineHeight: 17, fontWeight: '600', maxWidth: 92 },
  header: { marginBottom: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  eyebrow: { color: theme.color.textMuted, fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 3 },
  headerTitle: { color: theme.color.text, fontSize: 28, lineHeight: 34, fontWeight: '700', letterSpacing: -0.55 },
  headerBack: { width: 44, height: 44, borderRadius: 15, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.58)' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
  brand: { fontSize: 29, fontWeight: '700', color: theme.color.text, letterSpacing: -0.55 },
  iconTile: { alignItems: 'center', justifyContent: 'center' },
  card: { backgroundColor: theme.color.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.color.border, borderRadius: theme.radius.lg, padding: 18, ...theme.shadow.card },
  cardSoft: { backgroundColor: theme.color.surfaceBlue, borderColor: '#DCE7F6' },
  cardSuccess: { backgroundColor: theme.color.successSoft, borderColor: '#CFECE2' },
  cardWarning: { backgroundColor: theme.color.warningSoft, borderColor: '#F3D9B4' },
  button: { minHeight: 56, borderRadius: 18, backgroundColor: theme.color.primaryDark, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 12, paddingHorizontal: 22, marginTop: 14, ...theme.shadow.soft },
  buttonSecondary: { backgroundColor: theme.color.glassStrong, borderWidth: 1, borderColor: theme.color.borderStrong },
  buttonDisabled: { opacity: 0.42 },
  buttonText: { color: theme.color.white, fontSize: 17, lineHeight: 22, fontWeight: '650' },
  buttonSecondaryText: { color: theme.color.primaryDark },
  textAction: { minHeight: 44, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10 },
  textActionText: { color: theme.color.primary, fontWeight: '600', fontSize: 16 },
  pressScale: { transform: [{ scale: theme.motion.pressScale }], opacity: 0.94 },
  pill: { alignSelf: 'flex-start', borderRadius: theme.radius.pill, paddingHorizontal: 12, paddingVertical: 7 },
  pillText: { fontSize: 12, fontWeight: '700' },
  progressWrap: { gap: 8 },
  track: { height: 8, borderRadius: 999, overflow: 'hidden', backgroundColor: '#E4EAF2' },
  fill: { height: '100%', backgroundColor: theme.color.primary, borderRadius: 999 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  small: { color: theme.color.textMuted, fontSize: 14 },
  smallStrong: { color: theme.color.textMuted, fontSize: 14, fontWeight: '600' },
  ringCenter: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  ringValueRow: { flexDirection: 'row', alignItems: 'flex-end' },
  ringValue: { color: theme.color.text, fontSize: 60, lineHeight: 64, fontWeight: '500', letterSpacing: -2 },
  ringPercent: { color: theme.color.text, fontSize: 26, lineHeight: 36, marginBottom: 5, fontWeight: '600' },
  ringLabel: { fontSize: 16, lineHeight: 19, textAlign: 'center', fontWeight: '700', marginTop: -1 },
  readinessRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 20 },
  readinessCopy: { flex: 1, minWidth: 145, gap: 8 },
  readinessTitle: { color: theme.color.text, fontSize: 24, lineHeight: 30, fontWeight: '700' },
  readinessDelta: { color: theme.color.tealDark, fontSize: 17, fontWeight: '700' },
  readinessSupport: { color: theme.color.textMuted, fontSize: 13, lineHeight: 19 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 15, paddingVertical: 12 },
  featureTitle: { color: theme.color.text, fontSize: 16, fontWeight: '700' },
  featureSubtitle: { color: theme.color.textMuted, fontSize: 14, lineHeight: 20, marginTop: 4 },
  quickAction: { flex: 1, minHeight: 82, minWidth: 82, backgroundColor: theme.color.glassStrong, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.color.border, borderRadius: theme.radius.md, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 10, ...theme.shadow.soft },
  quickActionPressed: { transform: [{ scale: theme.motion.pressScale }], backgroundColor: theme.color.primarySoft },
  quickActionText: { color: theme.color.text, fontSize: 13, lineHeight: 17, fontWeight: '600', textAlign: 'center' },
  trustCard: { minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: theme.color.primaryPale, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.color.border, borderRadius: theme.radius.md, paddingHorizontal: 16, paddingVertical: 13 },
  trustTitle: { color: theme.color.text, fontSize: 15, fontWeight: '700' },
  trustSubtitle: { color: theme.color.textMuted, fontSize: 13, lineHeight: 18, marginTop: 3 },
  metric: { flex: 1, minWidth: 82, paddingVertical: 8 },
  metricValue: { color: theme.color.text, fontSize: 23, fontWeight: '700' },
  metricLabel: { color: theme.color.textMuted, fontSize: 12, marginTop: 3 },
  micro: { color: theme.color.textMuted, fontSize: 11, marginTop: 2 },
  summaryMetric: { flex: 1, alignItems: 'center', paddingHorizontal: 8 },
  summaryLabel: { minHeight: 38, textAlign: 'center', color: theme.color.text, fontSize: 13, lineHeight: 18, marginTop: 10 },
  summaryValue: { fontSize: 29, lineHeight: 35, fontWeight: '600', marginTop: 4 },
  listRow: { minHeight: 62, flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.color.border, borderRadius: 12 },
  listRowPressed: { backgroundColor: theme.color.primaryPale },
  listTitle: { color: theme.color.text, fontSize: 16, lineHeight: 21, fontWeight: '650' },
  listMeta: { color: theme.color.textMuted, fontSize: 13, lineHeight: 18, marginTop: 4 },
  trailing: { color: theme.color.textMuted, fontSize: 14, fontWeight: '600' },
  tabs: { flexDirection: 'row', borderRadius: 30, paddingVertical: 7, paddingHorizontal: 7, marginHorizontal: 0, marginTop: 24, marginBottom: 2, ...theme.shadow.floating },
  tab: { flex: 1, minHeight: 54, alignItems: 'center', justifyContent: 'center', gap: 3, paddingHorizontal: 4, paddingVertical: 5, borderRadius: 22 },
  tabSelected: { backgroundColor: theme.color.glassStrong, ...theme.shadow.soft },
  tabText: { fontSize: 11, lineHeight: 14, fontWeight: '500', color: theme.color.navInactive },
  tabActive: { color: theme.color.primaryDark, fontWeight: '700' }
});
