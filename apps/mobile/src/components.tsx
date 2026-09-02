import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ScreenId, TabId, TAB_TARGETS } from './model';
import { readinessTone, theme } from './theme';

export function Header({ title, eyebrow, onBack }: { title: string; eyebrow?: string; onBack?: () => void }) {
  return (
    <View style={styles.header}>
      <View style={styles.headerRow}>
        {onBack ? <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={onBack} style={styles.back}><Text style={styles.backText}>‹</Text></Pressable> : null}
        <View style={{ flex: 1 }}>
          {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
          <Text style={styles.headerTitle}>{title}</Text>
        </View>
      </View>
    </View>
  );
}

export function BrandMark() {
  return <View style={styles.brandRow}><View style={styles.logo}><Text style={styles.logoText}>C</Text></View><Text style={styles.brand}>CitizenAI</Text></View>;
}

export function Card({ children, tone = 'default', style }: { children: React.ReactNode; tone?: 'default' | 'soft' | 'success' | 'warning'; style?: object }) {
  const toneStyle = tone === 'success' ? styles.cardSuccess : tone === 'warning' ? styles.cardWarning : tone === 'soft' ? styles.cardSoft : null;
  return <View style={[styles.card, toneStyle, style]}>{children}</View>;
}

export function Button({ label, onPress, secondary = false, disabled = false }: { label: string; onPress?: () => void; secondary?: boolean; disabled?: boolean }) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.button, secondary && styles.buttonSecondary, disabled && styles.buttonDisabled, pressed && !disabled && { opacity: 0.86 }]}>
      <Text style={[styles.buttonText, secondary && styles.buttonSecondaryText]}>{label}</Text>
    </Pressable>
  );
}

export function TextAction({ label, onPress }: { label: string; onPress?: () => void }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={styles.textAction}><Text style={styles.textActionText}>{label}</Text></Pressable>;
}

export function Pill({ label, tone = 'primary' }: { label: string; tone?: 'primary' | 'success' | 'warning' | 'neutral' }) {
  const map = { primary: [theme.color.primarySoft, theme.color.primary], success: [theme.color.successSoft, theme.color.success], warning: [theme.color.warningSoft, theme.color.warning], neutral: [theme.color.surfaceMuted, theme.color.textMuted] } as const;
  return <View style={[styles.pill, { backgroundColor: map[tone][0] }]}><Text style={[styles.pillText, { color: map[tone][1] }]}>{label}</Text></View>;
}

export function ProgressBar({ value, max = 100, label, valueLabel }: { value: number; max?: number; label?: string; valueLabel?: string }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return <View style={styles.progressWrap}>{label || valueLabel ? <View style={styles.rowBetween}><Text style={styles.small}>{label}</Text><Text style={styles.smallStrong}>{valueLabel ?? `${Math.round(pct)}%`}</Text></View> : null}<View style={styles.track}><View style={[styles.fill, { width: `${pct}%` }]} /></View></View>;
}

export function ReadinessCard({ score, delta, confidence, compact = false }: { score: number; delta?: string; confidence?: string; compact?: boolean }) {
  const tone = readinessTone(score);
  return <Card style={compact ? { padding: 18 } : undefined}><View style={styles.rowBetween}><View><Text style={[styles.score, compact && { fontSize: 38 }]}>{score}%</Text><Text style={[styles.status, { color: tone.fg }]}>{tone.label}</Text></View><View style={[styles.ring, { borderColor: tone.fg }]}><Text style={[styles.ringText, { color: tone.fg }]}>{score}</Text></View></View>{delta ? <Text style={styles.support}>{delta}</Text> : null}{confidence ? <View style={{ marginTop: 14 }}><ProgressBar value={confidence === 'High' ? 88 : 64} label="Coverage confidence" valueLabel={confidence} /></View> : null}</Card>;
}

export function Metric({ label, value, note }: { label: string; value: string; note?: string }) {
  return <View style={styles.metric}><Text style={styles.metricValue}>{value}</Text><Text style={styles.metricLabel}>{label}</Text>{note ? <Text style={styles.micro}>{note}</Text> : null}</View>;
}

export function ListRow({ title, meta, onPress, trailing }: { title: string; meta?: string; onPress?: () => void; trailing?: string }) {
  return <Pressable accessibilityRole={onPress ? 'button' : undefined} onPress={onPress} style={styles.listRow}><View style={{ flex: 1 }}><Text style={styles.listTitle}>{title}</Text>{meta ? <Text style={styles.listMeta}>{meta}</Text> : null}</View>{trailing ? <Text style={styles.trailing}>{trailing}</Text> : onPress ? <Text style={styles.chevron}>›</Text> : null}</Pressable>;
}

export function BottomTabs({ active, navigate }: { active: TabId; navigate: (screen: ScreenId) => void }) {
  const tabs: { id: TabId; label: string; glyph: string }[] = [
    { id: 'home', label: 'Home', glyph: '⌂' },
    { id: 'learn', label: 'Learn', glyph: '◇' },
    { id: 'progress', label: 'Progress', glyph: '↗' },
    { id: 'profile', label: 'Profile', glyph: '○' }
  ];
  return <View style={styles.tabs}>{tabs.map(tab => <Pressable accessibilityRole="tab" accessibilityState={{ selected: active === tab.id }} key={tab.id} onPress={() => navigate(TAB_TARGETS[tab.id])} style={styles.tab}><Text style={[styles.tabGlyph, active === tab.id && styles.tabActive]}>{tab.glyph}</Text><Text style={[styles.tabText, active === tab.id && styles.tabActive]}>{tab.label}</Text></Pressable>)}</View>;
}

export const typography = StyleSheet.create({
  display: { fontSize: theme.type.display, lineHeight: 42, fontWeight: '700', color: theme.color.text, letterSpacing: -0.8 },
  h1: { fontSize: theme.type.h1, lineHeight: 36, fontWeight: '700', color: theme.color.text, letterSpacing: -0.5 },
  h2: { fontSize: theme.type.h2, lineHeight: 28, fontWeight: '700', color: theme.color.text },
  h3: { fontSize: theme.type.h3, lineHeight: 24, fontWeight: '700', color: theme.color.text },
  body: { fontSize: theme.type.body, lineHeight: 24, color: theme.color.text },
  muted: { fontSize: theme.type.body, lineHeight: 23, color: theme.color.textMuted },
  small: { fontSize: theme.type.small, lineHeight: 18, color: theme.color.textMuted }
});

const styles = StyleSheet.create({
  header: { marginBottom: 20 }, headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 }, eyebrow: { color: theme.color.textMuted, fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 3 }, headerTitle: { color: theme.color.text, fontSize: 25, lineHeight: 31, fontWeight: '700', letterSpacing: -0.4 }, back: { width: 38, height: 38, borderRadius: 19, backgroundColor: theme.color.surface, borderWidth: 1, borderColor: theme.color.border, justifyContent: 'center', alignItems: 'center' }, backText: { fontSize: 30, lineHeight: 32, color: theme.color.text, marginTop: -4 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 }, logo: { width: 34, height: 34, borderRadius: 11, backgroundColor: theme.color.primary, justifyContent: 'center', alignItems: 'center' }, logoText: { color: theme.color.white, fontWeight: '800', fontSize: 17 }, brand: { fontSize: 19, fontWeight: '800', color: theme.color.text, letterSpacing: -0.4 },
  card: { backgroundColor: theme.color.surface, borderWidth: 1, borderColor: theme.color.border, borderRadius: theme.radius.lg, padding: 20, shadowColor: theme.color.shadow, shadowOpacity: 0.035, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 1 }, cardSoft: { backgroundColor: theme.color.primarySoft, borderColor: theme.color.primarySoft }, cardSuccess: { backgroundColor: theme.color.successSoft, borderColor: '#CBEADB' }, cardWarning: { backgroundColor: theme.color.warningSoft, borderColor: '#F7DCB0' },
  button: { minHeight: 54, borderRadius: 17, backgroundColor: theme.color.primary, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 18, marginTop: 12 }, buttonSecondary: { backgroundColor: theme.color.surface, borderWidth: 1, borderColor: theme.color.border }, buttonDisabled: { opacity: 0.45 }, buttonText: { color: theme.color.white, fontSize: 16, fontWeight: '700' }, buttonSecondaryText: { color: theme.color.text }, textAction: { alignItems: 'center', paddingVertical: 13 }, textActionText: { color: theme.color.primary, fontWeight: '700', fontSize: 15 },
  pill: { alignSelf: 'flex-start', borderRadius: theme.radius.pill, paddingHorizontal: 11, paddingVertical: 6 }, pillText: { fontSize: 12, fontWeight: '700' },
  progressWrap: { gap: 8 }, track: { height: 8, borderRadius: 999, overflow: 'hidden', backgroundColor: theme.color.surfaceMuted }, fill: { height: '100%', backgroundColor: theme.color.primary, borderRadius: 999 }, rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 }, small: { color: theme.color.textMuted, fontSize: 13 }, smallStrong: { color: theme.color.text, fontSize: 13, fontWeight: '700' },
  score: { color: theme.color.text, fontSize: 52, lineHeight: 58, fontWeight: '700', letterSpacing: -1.2 }, status: { fontSize: 17, fontWeight: '700', marginTop: 2 }, support: { color: theme.color.textMuted, fontSize: 13, marginTop: 9 }, ring: { width: 78, height: 78, borderRadius: 39, borderWidth: 8, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.color.surface }, ringText: { fontWeight: '800', fontSize: 18 },
  metric: { flex: 1, minWidth: 92, paddingVertical: 8 }, metricValue: { color: theme.color.text, fontSize: 22, fontWeight: '700' }, metricLabel: { color: theme.color.textMuted, fontSize: 12, marginTop: 3 }, micro: { color: theme.color.textMuted, fontSize: 11, marginTop: 2 },
  listRow: { minHeight: 62, flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.color.border }, listTitle: { color: theme.color.text, fontSize: 15, fontWeight: '600' }, listMeta: { color: theme.color.textMuted, fontSize: 12, marginTop: 4 }, trailing: { color: theme.color.text, fontSize: 14, fontWeight: '700' }, chevron: { color: theme.color.textMuted, fontSize: 25 },
  tabs: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: theme.color.border, backgroundColor: theme.color.surface, paddingBottom: 9, paddingTop: 8, paddingHorizontal: 8 }, tab: { flex: 1, alignItems: 'center', gap: 2, paddingVertical: 3 }, tabGlyph: { fontSize: 20, color: theme.color.textMuted }, tabText: { fontSize: 11, fontWeight: '600', color: theme.color.textMuted }, tabActive: { color: theme.color.primary }
});
