import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { ScreenId, TabId, TAB_TARGETS } from './model';
import { readinessTone, theme } from './theme';

type IconLibrary = 'ion' | 'mci';
type IconTone = 'blue' | 'teal' | 'neutral' | 'success' | 'warning';

const iconTone = (tone: IconTone) => {
  if (tone === 'teal' || tone === 'success') return { bg: theme.color.tealSoft, fg: theme.color.tealDark };
  if (tone === 'warning') return { bg: theme.color.warningSoft, fg: theme.color.warning };
  if (tone === 'neutral') return { bg: theme.color.surfaceMuted, fg: theme.color.textMuted };
  return { bg: theme.color.primarySoft, fg: theme.color.primary };
};

export function AppIcon({ library = 'ion', name, size = 24, color = theme.color.primary }: { library?: IconLibrary; name: string; size?: number; color?: string }) {
  return library === 'mci'
    ? <MaterialCommunityIcons name={name as any} size={size} color={color} />
    : <Ionicons name={name as any} size={size} color={color} />;
}

export function IconTile({ library = 'ion', name, tone = 'blue', size = 48, iconSize = 25 }: { library?: IconLibrary; name: string; tone?: IconTone; size?: number; iconSize?: number }) {
  const t = iconTone(tone);
  return <View style={[styles.iconTile, { width: size, height: size, borderRadius: Math.round(size * 0.28), backgroundColor: t.bg }]}><AppIcon library={library} name={name} size={iconSize} color={t.fg} /></View>;
}

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return <View style={styles.brandRow}><MaterialCommunityIcons name="shield-crown-outline" size={compact ? 34 : 39} color={theme.color.text} /><Text style={[styles.brand, compact && { fontSize: 22 }]}>CitizenAI</Text></View>;
}

export function AppHeader({ onBack, days = '12 days until test' }: { onBack?: () => void; days?: string }) {
  return <View style={styles.appHeader}>
    <View style={styles.appHeaderLeft}>
      {onBack ? <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={onBack} style={styles.headerBack}><Ionicons name="arrow-back" size={24} color={theme.color.text} /></Pressable> : null}
      <BrandMark compact />
    </View>
    <View style={styles.dateWrap}><IconTile name="calendar-outline" tone="neutral" size={38} iconSize={19} /><Text style={styles.dateText}>{days}</Text></View>
  </View>;
}

export function Header({ title, eyebrow, onBack }: { title: string; eyebrow?: string; onBack?: () => void }) {
  return <View style={styles.header}>
    <View style={styles.headerRow}>
      {onBack ? <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={onBack} style={styles.headerBack}><Ionicons name="arrow-back" size={23} color={theme.color.text} /></Pressable> : null}
      <View style={{ flex: 1 }}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text style={styles.headerTitle}>{title}</Text>
      </View>
    </View>
  </View>;
}

export function Card({ children, tone = 'default', style }: { children: React.ReactNode; tone?: 'default' | 'soft' | 'success' | 'warning'; style?: ViewStyle | ViewStyle[] }) {
  const toneStyle = tone === 'success' ? styles.cardSuccess : tone === 'warning' ? styles.cardWarning : tone === 'soft' ? styles.cardSoft : null;
  return <View style={[styles.card, toneStyle, style]}>{children}</View>;
}

export function Button({ label, onPress, secondary = false, disabled = false, showArrow = true }: { label: string; onPress?: () => void; secondary?: boolean; disabled?: boolean; showArrow?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.button, secondary && styles.buttonSecondary, disabled && styles.buttonDisabled, pressed && !disabled && { opacity: 0.9 }]}>
    <Text style={[styles.buttonText, secondary && styles.buttonSecondaryText]}>{label}</Text>
    {showArrow ? <Ionicons name="chevron-forward" size={21} color={secondary ? theme.color.primary : theme.color.white} /> : null}
  </Pressable>;
}

export function TextAction({ label, onPress }: { label: string; onPress?: () => void }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={styles.textAction}><Text style={styles.textActionText}>{label}</Text></Pressable>;
}

export function Pill({ label, tone = 'primary' }: { label: string; tone?: 'primary' | 'success' | 'warning' | 'neutral' }) {
  const map = { primary: [theme.color.primarySoft, theme.color.primary], success: [theme.color.successSoft, theme.color.success], warning: [theme.color.warningSoft, theme.color.warning], neutral: [theme.color.surfaceMuted, theme.color.textMuted] } as const;
  return <View style={[styles.pill, { backgroundColor: map[tone][0] }]}><Text style={[styles.pillText, { color: map[tone][1] }]}>{label}</Text></View>;
}

export function ProgressBar({ value, max = 100, label, valueLabel, teal = false }: { value: number; max?: number; label?: string; valueLabel?: string; teal?: boolean }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return <View style={styles.progressWrap}>
    {label || valueLabel ? <View style={styles.rowBetween}><Text style={styles.small}>{label}</Text><Text style={styles.smallStrong}>{valueLabel ?? `${Math.round(pct)}%`}</Text></View> : null}
    <View style={styles.track}><View style={[styles.fill, teal && { backgroundColor: theme.color.teal }, { width: `${pct}%` }]} /></View>
  </View>;
}

export function ProgressRing({ score, label, size = 172, stroke = 10, color = theme.color.primary }: { score: number; label?: string; size?: number; stroke?: number; color?: string }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(100, score)) / 100;
  return <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
      <Circle cx={size / 2} cy={size / 2} r={radius} stroke="#DCE8FB" strokeWidth={stroke} fill="transparent" />
      <Circle cx={size / 2} cy={size / 2} r={radius} stroke={color} strokeWidth={stroke} fill="transparent" strokeDasharray={`${circumference * progress} ${circumference}`} strokeLinecap="round" rotation="-90" origin={`${size / 2}, ${size / 2}`} />
    </Svg>
    <View style={styles.ringCenter}><View style={styles.ringValueRow}><Text style={[styles.ringValue, size < 150 && { fontSize: 42, lineHeight: 47 }]}>{score}</Text><Text style={[styles.ringPercent, size < 150 && { fontSize: 20 }]}>%</Text></View>{label ? <Text style={[styles.ringLabel, { color }]}>{label}</Text> : null}</View>
  </View>;
}

export function ReadinessCard({ score, delta, confidence, compact = false }: { score: number; delta?: string; confidence?: string; compact?: boolean }) {
  const tone = readinessTone(score);
  return <Card style={compact ? { padding: 18 } : undefined}><View style={styles.readinessRow}><ProgressRing score={score} label={tone.label} size={compact ? 132 : 156} stroke={9} color={tone.fg} /><View style={styles.readinessCopy}><Text style={styles.readinessTitle}>Your readiness</Text>{delta ? <Text style={styles.readinessDelta}>{delta}</Text> : null}{confidence ? <Text style={styles.readinessSupport}>Coverage confidence · {confidence}</Text> : null}</View></View></Card>;
}

export function FeatureRow({ library = 'ion', icon, tone = 'blue', title, subtitle }: { library?: IconLibrary; icon: string; tone?: IconTone; title: string; subtitle: string }) {
  return <View style={styles.featureRow}><IconTile library={library} name={icon} tone={tone} size={46} iconSize={24} /><View style={{ flex: 1 }}><Text style={styles.featureTitle}>{title}</Text><Text style={styles.featureSubtitle}>{subtitle}</Text></View></View>;
}

export function QuickAction({ library = 'ion', icon, tone = 'blue', title, onPress }: { library?: IconLibrary; icon: string; tone?: IconTone; title: string; onPress?: () => void }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={styles.quickAction}><AppIcon library={library} name={icon} size={29} color={iconTone(tone).fg} /><Text style={styles.quickActionText}>{title}</Text></Pressable>;
}

export function TrustCard({ title, subtitle }: { title: string; subtitle: string }) {
  return <View style={styles.trustCard}><IconTile name="sparkles" size={42} iconSize={21} /><View style={{ flex: 1 }}><Text style={styles.trustTitle}>{title}</Text><Text style={styles.trustSubtitle}>{subtitle}</Text></View></View>;
}

export function Metric({ label, value, note }: { label: string; value: string; note?: string }) {
  return <View style={styles.metric}><Text style={styles.metricValue}>{value}</Text><Text style={styles.metricLabel}>{label}</Text>{note ? <Text style={styles.micro}>{note}</Text> : null}</View>;
}

export function SummaryMetric({ library = 'ion', icon, tone = 'blue', label, value, valueTone = 'blue' }: { library?: IconLibrary; icon: string; tone?: IconTone; label: string; value: string; valueTone?: IconTone }) {
  return <View style={styles.summaryMetric}><IconTile library={library} name={icon} tone={tone} size={52} iconSize={26} /><Text style={styles.summaryLabel}>{label}</Text><Text style={[styles.summaryValue, { color: iconTone(valueTone).fg }]}>{value}</Text></View>;
}

export function ListRow({ title, meta, onPress, trailing, icon, iconLibrary = 'ion', iconTone: tone = 'blue', hideDivider = false }: { title: string; meta?: string; onPress?: () => void; trailing?: string; icon?: string; iconLibrary?: IconLibrary; iconTone?: IconTone; hideDivider?: boolean }) {
  return <Pressable accessibilityRole={onPress ? 'button' : undefined} onPress={onPress} style={[styles.listRow, hideDivider && { borderBottomWidth: 0 }]}>
    {icon ? <IconTile library={iconLibrary} name={icon} tone={tone} size={44} iconSize={23} /> : null}
    <View style={{ flex: 1 }}><Text style={styles.listTitle}>{title}</Text>{meta ? <Text style={styles.listMeta}>{meta}</Text> : null}</View>
    {trailing ? <Text style={styles.trailing}>{trailing}</Text> : null}
    {onPress ? <Ionicons name="chevron-forward" size={20} color={theme.color.textSoft} /> : null}
  </Pressable>;
}

export function BottomTabs({ active, navigate }: { active: TabId; navigate: (screen: ScreenId) => void }) {
  const tabs: { id: TabId; label: string; icon: string }[] = [
    { id: 'home', label: 'Home', icon: 'home' },
    { id: 'learn', label: 'Learn', icon: 'book-outline' },
    { id: 'progress', label: 'Progress', icon: 'stats-chart' },
    { id: 'profile', label: 'Profile', icon: 'person-outline' }
  ];
  return <View style={styles.tabs}>{tabs.map(tab => {
    const selected = active === tab.id;
    return <Pressable accessibilityRole="tab" accessibilityState={{ selected }} key={tab.id} onPress={() => navigate(TAB_TARGETS[tab.id])} style={styles.tab}><Ionicons name={tab.icon as any} size={24} color={selected ? theme.color.primary : theme.color.navInactive} /><Text style={[styles.tabText, selected && styles.tabActive]}>{tab.label}</Text></Pressable>;
  })}</View>;
}

export const typography = StyleSheet.create({
  display: { fontSize: theme.type.display, lineHeight: 48, fontWeight: '700', color: theme.color.text, letterSpacing: -1.1 },
  h1: { fontSize: theme.type.h1, lineHeight: 38, fontWeight: '700', color: theme.color.text, letterSpacing: -0.7 },
  h2: { fontSize: theme.type.h2, lineHeight: 31, fontWeight: '700', color: theme.color.text, letterSpacing: -0.35 },
  h3: { fontSize: theme.type.h3, lineHeight: 26, fontWeight: '700', color: theme.color.text },
  body: { fontSize: theme.type.body, lineHeight: 24, color: theme.color.text },
  muted: { fontSize: theme.type.body, lineHeight: 24, color: theme.color.textMuted },
  small: { fontSize: theme.type.small, lineHeight: 19, color: theme.color.textMuted }
});

const styles = StyleSheet.create({
  appHeader: { minHeight: 62, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  appHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dateWrap: { flexDirection: 'row', alignItems: 'center', gap: 9 }, dateText: { color: theme.color.text, fontSize: 14, fontWeight: '500' },
  header: { marginBottom: 20 }, headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 }, eyebrow: { color: theme.color.textMuted, fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 3 }, headerTitle: { color: theme.color.text, fontSize: 27, lineHeight: 33, fontWeight: '700', letterSpacing: -0.5 }, headerBack: { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 9 }, brand: { fontSize: 29, fontWeight: '700', color: theme.color.text, letterSpacing: -0.55 },
  iconTile: { alignItems: 'center', justifyContent: 'center' },
  card: { backgroundColor: theme.color.surface, borderWidth: 1, borderColor: theme.color.border, borderRadius: theme.radius.lg, padding: 18, ...theme.shadow.card }, cardSoft: { backgroundColor: theme.color.surfaceBlue, borderColor: '#DDE8F8' }, cardSuccess: { backgroundColor: theme.color.successSoft, borderColor: '#CFECE6' }, cardWarning: { backgroundColor: theme.color.warningSoft, borderColor: '#F3D9B4' },
  button: { minHeight: 58, borderRadius: 16, backgroundColor: theme.color.primary, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 12, paddingHorizontal: 22, marginTop: 14, ...theme.shadow.soft }, buttonSecondary: { backgroundColor: theme.color.surface, borderWidth: 1, borderColor: theme.color.border }, buttonDisabled: { opacity: 0.45 }, buttonText: { color: theme.color.white, fontSize: 17, fontWeight: '600' }, buttonSecondaryText: { color: theme.color.primary }, textAction: { alignItems: 'center', paddingVertical: 15 }, textActionText: { color: theme.color.primary, fontWeight: '600', fontSize: 16 },
  pill: { alignSelf: 'flex-start', borderRadius: theme.radius.pill, paddingHorizontal: 12, paddingVertical: 6 }, pillText: { fontSize: 12, fontWeight: '700' },
  progressWrap: { gap: 8 }, track: { height: 8, borderRadius: 999, overflow: 'hidden', backgroundColor: '#E8EDF5' }, fill: { height: '100%', backgroundColor: theme.color.primary, borderRadius: 999 }, rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 }, small: { color: theme.color.textMuted, fontSize: 14 }, smallStrong: { color: theme.color.textMuted, fontSize: 14, fontWeight: '500' },
  ringCenter: { alignItems: 'center', justifyContent: 'center' }, ringValueRow: { flexDirection: 'row', alignItems: 'flex-end' }, ringValue: { color: theme.color.text, fontSize: 62, lineHeight: 66, fontWeight: '400', letterSpacing: -2 }, ringPercent: { color: theme.color.text, fontSize: 27, lineHeight: 38, marginBottom: 5, fontWeight: '500' }, ringLabel: { fontSize: 17, fontWeight: '600', marginTop: -2 },
  readinessRow: { flexDirection: 'row', alignItems: 'center', gap: 20 }, readinessCopy: { flex: 1, gap: 8 }, readinessTitle: { color: theme.color.text, fontSize: 24, lineHeight: 30, fontWeight: '700' }, readinessDelta: { color: theme.color.tealDark, fontSize: 17, fontWeight: '600' }, readinessSupport: { color: theme.color.textMuted, fontSize: 13, lineHeight: 19 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 15, paddingVertical: 11 }, featureTitle: { color: theme.color.text, fontSize: 16, fontWeight: '700' }, featureSubtitle: { color: theme.color.textMuted, fontSize: 14, lineHeight: 20, marginTop: 4 },
  quickAction: { flex: 1, minHeight: 86, backgroundColor: theme.color.surface, borderWidth: 1, borderColor: theme.color.border, borderRadius: theme.radius.md, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 10, ...theme.shadow.soft }, quickActionText: { color: theme.color.text, fontSize: 13, lineHeight: 17, fontWeight: '600', textAlign: 'center' },
  trustCard: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: theme.color.primaryPale, borderWidth: 1, borderColor: theme.color.border, borderRadius: theme.radius.md, paddingHorizontal: 16, paddingVertical: 12 }, trustTitle: { color: theme.color.text, fontSize: 15, fontWeight: '700' }, trustSubtitle: { color: theme.color.textMuted, fontSize: 13, lineHeight: 18, marginTop: 3 },
  metric: { flex: 1, minWidth: 82, paddingVertical: 8 }, metricValue: { color: theme.color.text, fontSize: 23, fontWeight: '700' }, metricLabel: { color: theme.color.textMuted, fontSize: 12, marginTop: 3 }, micro: { color: theme.color.textMuted, fontSize: 11, marginTop: 2 },
  summaryMetric: { flex: 1, alignItems: 'center', paddingHorizontal: 8 }, summaryLabel: { minHeight: 38, textAlign: 'center', color: theme.color.text, fontSize: 13, lineHeight: 18, marginTop: 10 }, summaryValue: { fontSize: 29, lineHeight: 35, fontWeight: '600', marginTop: 4 },
  listRow: { minHeight: 66, flexDirection: 'row', alignItems: 'center', paddingVertical: 11, gap: 13, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.color.border }, listTitle: { color: theme.color.text, fontSize: 16, fontWeight: '600' }, listMeta: { color: theme.color.textMuted, fontSize: 13, marginTop: 4 }, trailing: { color: theme.color.textMuted, fontSize: 14, fontWeight: '500' },
  tabs: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: theme.color.border, backgroundColor: theme.color.surface, paddingBottom: 9, paddingTop: 10, paddingHorizontal: 8, marginHorizontal: -20, marginBottom: -20, marginTop: 20 }, tab: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 3 }, tabText: { fontSize: 11, fontWeight: '500', color: theme.color.navInactive }, tabActive: { color: theme.color.primary, fontWeight: '600' }
});
