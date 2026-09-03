import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppIcon, BrandMark, Button, Card, FeatureRow, ProgressRing, TextAction } from './components';
import { Navigator, ScreenId } from './model';
import { theme } from './theme';

type Props = { navigate: Navigator; goBack: () => void };
type ScreenMap = Partial<Record<ScreenId, React.ComponentType<Props>>>;

function Welcome({ navigate }: Props) {
  return <View style={s.screen}>
    <View style={s.brandSurface}><BrandMark /></View>
    <View style={s.heroCopy}>
      <Text style={s.title}>Get ready to pass</Text>
      <Text style={s.subtitle}>CitizenAI measures what you know, then gives you the minimum useful study to become Pass Ready.</Text>
    </View>

    <Card style={s.readinessPreview}>
      <ProgressRing score={68} label="Building" size={128} stroke={8} />
      <View style={s.previewCopy}>
        <Text style={s.previewTitle}>Know exactly where you stand</Text>
        <Text style={s.previewText}>Readiness combines demonstrated knowledge, retention and coverage—not streaks or time spent.</Text>
      </View>
    </Card>

    <View style={s.featureStack}>
      <FeatureRow icon="bar-chart" title="Check your readiness" subtitle="See how close you are to Pass Ready." />
      <FeatureRow icon="school-outline" tone="teal" title="Study only what you need" subtitle="A focused plan built from your highest-value gaps." />
      <FeatureRow icon="shield-outline" title="Understand, don’t memorise" subtitle="Clear explanations and unseen wording build transfer." />
    </View>

    <Button label="Get started" onPress={() => navigate('test-setup')} />
    <TextAction label="I already have an account" onPress={() => navigate('home')} />
    <View style={s.trustStrip}><AppIcon name="shield-checkmark-outline" size={20} color={theme.color.tealDark} /><Text style={s.trustText}>Official-source grounded · Personalized · Clear explanations</Text></View>
  </View>;
}

export const integratedWelcomeScreen: ScreenMap = { welcome: Welcome };

const s = StyleSheet.create({
  screen: { flex: 1, gap: 14, justifyContent: 'center', paddingVertical: 8 },
  brandSurface: { alignSelf: 'flex-start', minHeight: 56, justifyContent: 'center', paddingHorizontal: 2 },
  heroCopy: { gap: 8, marginBottom: 2 },
  title: { color: theme.color.text, fontSize: 40, lineHeight: 46, fontWeight: '700', letterSpacing: -1.0 },
  subtitle: { color: theme.color.textMuted, fontSize: 17, lineHeight: 25, maxWidth: 360 },
  readinessPreview: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 18, padding: 18 },
  previewCopy: { flex: 1, minWidth: 170, gap: 7 },
  previewTitle: { color: theme.color.text, fontSize: 19, lineHeight: 25, fontWeight: '700' },
  previewText: { color: theme.color.textMuted, fontSize: 14, lineHeight: 20 },
  featureStack: { gap: 2 },
  trustStrip: { minHeight: 54, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: theme.radius.md, backgroundColor: theme.color.primaryPale, paddingHorizontal: 14, paddingVertical: 11, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.color.border },
  trustText: { flexShrink: 1, color: theme.color.textMuted, fontSize: 12, lineHeight: 17, fontWeight: '600', textAlign: 'center' }
});
