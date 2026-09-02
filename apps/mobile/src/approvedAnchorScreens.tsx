import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  AppHeader,
  AppIcon,
  BottomTabs,
  BrandMark,
  Button,
  Card,
  FeatureRow,
  IconTile,
  ListRow,
  ProgressBar,
  ProgressRing,
  QuickAction,
  SummaryMetric,
  TextAction,
  TrustCard
} from './components';
import { Navigator, ScreenId } from './model';
import { theme } from './theme';

type Props = { navigate: Navigator; goBack: () => void };

type AnchorMap = Partial<Record<ScreenId, React.ComponentType<Props>>>;

const DomainRow = ({ name, score, icon, teal = false }: { name: string; score: number; icon: string; teal?: boolean }) => (
  <View style={s.domainRow}>
    <IconTile name={icon} tone={teal ? 'teal' : 'blue'} size={40} iconSize={21} />
    <View style={{ flex: 1 }}><Text style={s.domainName}>{name}</Text><ProgressBar value={score} teal={teal} /></View>
    <Text style={s.domainScore}>{score}%</Text>
    <AppIcon name="chevron-forward" size={18} color={theme.color.textSoft} />
  </View>
);

const CompareCell = ({ icon, title, tone = 'blue' }: { icon: string; title: string; tone?: 'blue' | 'teal' }) => (
  <View style={s.compareCell}>
    <IconTile name={icon} tone={tone} size={40} iconSize={21} />
    <Text style={s.compareCellText}>{title}</Text>
  </View>
);

function Welcome({ navigate }: Props) {
  return <View style={s.screen}>
    <View style={s.welcomeBrand}><BrandMark /></View>
    <Text style={s.welcomeTitle}>Get ready to pass</Text>
    <Text style={s.welcomeSubtitle}>Personalized prep for the{`\n`}UK Life in the UK Test.</Text>

    <Card tone="soft" style={s.welcomeJourney}>
      <ProgressRing score={68} label="Building" size={128} stroke={7} />
      <View style={s.journeyTrack}>
        <View style={s.journeyLine} />
        <View style={[s.journeyPoint, { left: 2, top: 101 }]}><IconTile name="book-outline" size={40} iconSize={21} /></View>
        <View style={[s.journeyPoint, { left: '43%', top: 61 }]}><IconTile library="mci" name="brain" tone="teal" size={40} iconSize={21} /></View>
        <View style={[s.journeyPoint, { right: 1, top: 12 }]}><IconTile name="shield-checkmark-outline" size={44} iconSize={23} /></View>
        <Text style={s.passReadyLabel}>Pass Ready</Text>
      </View>
    </Card>

    <View style={s.featureStack}>
      <FeatureRow icon="bar-chart" title="Check your readiness" subtitle="See how close you are to Pass Ready." />
      <FeatureRow icon="school-outline" tone="teal" title="Study only what you need" subtitle="Smart practice that focuses on you." />
      <FeatureRow icon="shield-outline" title="Build confidence before test day" subtitle="Practice with purpose. Feel prepared." />
    </View>

    <View style={s.inset}><Button label="Get started" onPress={() => navigate('test-setup')} /></View>
    <TextAction label="I already have an account" onPress={() => navigate('home')} />
    <View style={s.inset}><View style={s.trustStrip}><AppIcon name="shield-checkmark-outline" size={20} color={theme.color.tealDark} /><Text style={s.trustText}>Official-source grounded  •  Personalized  •  Clear explanations</Text></View></View>
  </View>;
}

function DiagnosticResult({ navigate, goBack }: Props) {
  return <View style={s.screen}>
    <AppHeader onBack={goBack} />
    <View style={s.diagnosticHero}>
      <View style={s.diagnosticCopy}>
        <Text style={s.diagnosticTitle}>You’re Building</Text>
        <Text style={s.diagnosticMessage}>You’re strong in UK culture,{`\n`}but need more work on{`\n`}government and early{`\n`}British history.</Text>
      </View>
      <ProgressRing score={58} label="Readiness Score" size={140} stroke={7} />
    </View>

    <Card style={s.anchorCard}>
      <Text style={s.cardTitle}>Domain breakdown</Text>
      <DomainRow name="Government" score={41} icon="business-outline" />
      <DomainRow name="History" score={48} icon="book-outline" teal />
      <DomainRow name="Rights" score={72} icon="scale-outline" />
      <DomainRow name="Culture" score={87} icon="people-outline" teal />
    </Card>

    <Card style={s.anchorCard}>
      <View style={s.rowBetween}><Text style={s.cardTitle}>Today’s plan</Text><Text style={s.meta}>14 min total</Text></View>
      <View style={s.planRow}><IconTile name="business-outline" size={40} iconSize={21} /><Text style={s.planTitle}>Government in the UK</Text><Text style={s.meta}>5 min</Text></View>
      <View style={s.planRow}><IconTile name="book-outline" tone="teal" size={40} iconSize={21} /><Text style={s.planTitle}>Early British History</Text><Text style={s.meta}>5 min</Text></View>
      <View style={[s.planRow, s.noBorder]}><IconTile name="people-outline" size={40} iconSize={21} /><Text style={s.planTitle}>UK Culture & Values</Text><Text style={s.meta}>4 min</Text></View>
    </Card>

    <View style={s.inset}><Button label="Start my plan" onPress={() => navigate('today-plan')} /></View>
    <TextAction label="See full breakdown" onPress={() => navigate('progress-overview')} />
  </View>;
}

function Home({ navigate }: Props) {
  return <View style={s.screen}>
    <AppHeader />
    <Card tone="soft" style={[s.homeHero, s.inset]}>
      <ProgressRing score={68} label="Building" size={142} stroke={7} />
      <View style={s.homeHeroCopy}>
        <Text style={s.homeHeroTitle}>Your readiness</Text>
        <Text style={s.homeHeroDelta}>+7% this week</Text>
        <View style={s.heroDivider} />
        <Text style={s.homeHeroSupport}>You’re 32% away from</Text>
        <Text style={s.homeHeroPass}>Pass Ready</Text>
        <ProgressBar value={68} valueLabel="68%" />
      </View>
    </Card>

    <View style={s.sectionHeader}><Text style={s.sectionTitle}>Today’s plan</Text><Text style={s.meta}>4 items</Text></View>
    <Card style={[s.planCard, s.inset]}>
      <ListRow title="Parliament vs Government" trailing="4 min" icon="business-outline" onPress={() => navigate('compare-concepts')} />
      <ListRow title="Magna Carta" trailing="3 min" icon="document-text-outline" iconTone="teal" onPress={() => navigate('recall')} />
      <ListRow title="UK Elections" trailing="4 min" icon="checkbox-outline" onPress={() => navigate('learn-concept')} />
      <ListRow title="Quick recall" trailing="3 min" icon="sparkles-outline" iconTone="teal" onPress={() => navigate('recall')} hideDivider />
    </Card>

    <View style={s.inset}><Button label="Continue learning" onPress={() => navigate('today-plan')} /></View>
    <View style={[s.quickRow, s.inset]}>
      <QuickAction icon="flash" tone="teal" title="Quick Practice" onPress={() => navigate('question')} />
      <QuickAction icon="clipboard-outline" title="Mock Test" onPress={() => navigate('mock-intro')} />
      <QuickAction icon="bar-chart" tone="teal" title="My Progress" onPress={() => navigate('progress-overview')} />
    </View>
    <View style={s.inset}><TrustCard title="Study only what you need." subtitle="Smart practice. Focused results." /></View>
    <BottomTabs active="home" navigate={navigate} />
  </View>;
}

function CompareConcepts({ navigate, goBack }: Props) {
  return <View style={s.screen}>
    <AppHeader onBack={goBack} />
    <View style={s.lessonProgress}><Text style={s.lessonProgressText}>Today’s plan · 2 of 4</Text><View style={{ flex: 1 }}><ProgressBar value={2} max={4} /></View></View>
    <Text style={s.compareTitle}>Parliament vs Government</Text>
    <Text style={s.compareSubtitle}>Understand the difference clearly.</Text>

    <Card style={[s.compareMatrix, s.inset]}>
      <View style={s.compareHeaders}>
        <View style={s.compareHeaderCell}><IconTile name="business-outline" size={40} iconSize={21} /><Text style={[s.compareHeaderText, { color: theme.color.primary }]}>Parliament</Text></View>
        <View style={s.vs}><Text style={s.vsText}>VS</Text></View>
        <View style={s.compareHeaderCell}><IconTile name="business-outline" tone="teal" size={40} iconSize={21} /><Text style={[s.compareHeaderText, { color: theme.color.tealDark }]}>Government</Text></View>
      </View>
      <View style={s.rule} />
      <View style={s.compareColumns}>
        <View style={s.compareColumn}>
          <CompareCell icon="create-outline" title="Makes and scrutinizes laws" />
          <CompareCell icon="people-outline" title="Includes MPs and the House of Lords" />
          <CompareCell icon="scale-outline" title="Holds government accountable" />
        </View>
        <View style={s.verticalRule} />
        <View style={s.compareColumn}>
          <CompareCell icon="settings-outline" title="Runs the country" tone="teal" />
          <CompareCell icon="person-outline" title="Led by the Prime Minister" tone="teal" />
          <CompareCell icon="checkmark-circle-outline" title="Implements policy" tone="teal" />
        </View>
      </View>
    </Card>

    <Card tone="soft" style={[s.mixCard, s.inset]}><IconTile name="sparkles-outline" /><View style={{ flex: 1 }}><Text style={s.mixTitle}>You’re mixing these two concepts.</Text><Text style={s.mixBody}>Once you see the distinction, the question becomes much easier.</Text></View></Card>
    <View style={s.inset}><Button label="Check understanding" onPress={() => navigate('recall')} /></View>
    <Pressable style={[s.saveButton, s.inset]}><AppIcon name="bookmark-outline" size={21} color={theme.color.text} /><Text style={s.saveText}>Save for later</Text></Pressable>
    <BottomTabs active="learn" navigate={navigate} />
  </View>;
}

function PassReady({ navigate }: Props) {
  return <View style={s.screen}>
    <AppHeader days="7 days until test" />
    <Card tone="soft" style={[s.passHero, s.inset]}>
      <ProgressRing score={91} size={140} stroke={7} />
      <View style={s.passHeroCopy}>
        <IconTile name="shield-checkmark" size={50} iconSize={27} />
        <View style={s.passTitleRow}><Text style={s.passTitle}>Pass Ready</Text><AppIcon name="checkmark" size={24} color={theme.color.tealDark} /></View>
        <Text style={s.passBody}>Based on your demonstrated knowledge, retention, and mock performance, you’re prepared.</Text>
      </View>
    </Card>

    <Card style={[s.summaryCard, s.inset]}>
      <Text style={s.cardTitle}>Your readiness summary</Text>
      <View style={s.summaryRow}>
        <SummaryMetric icon="shield-checkmark-outline" tone="teal" label={'Coverage\nconfidence'} value="High" valueTone="teal" />
        <View style={s.summaryDivider} />
        <SummaryMetric icon="clipboard-outline" label={'Mocks\npassed'} value="4" />
        <View style={s.summaryDivider} />
        <SummaryMetric icon="locate-outline" tone="teal" label={'Critical weak\nconcepts'} value="0" valueTone="teal" />
      </View>
    </Card>

    <Pressable style={[s.untilCard, s.inset]} onPress={() => navigate('exam-countdown')}><IconTile name="calendar-outline" size={46} iconSize={24} /><View style={{ flex: 1 }}><Text style={s.untilTitle}>Until your exam</Text><Text style={s.untilBody}>We’ll keep your knowledge fresh with short reviews.</Text></View><AppIcon name="chevron-forward" size={21} color={theme.color.textSoft} /></Pressable>
    <View style={s.inset}><Button label="Keep me ready" onPress={() => navigate('maintenance-review')} /></View>
    <Pressable style={[s.viewProgress, s.inset]} onPress={() => navigate('progress-overview')}><Text style={s.viewProgressText}>View progress</Text></Pressable>
    <BottomTabs active="progress" navigate={navigate} />
  </View>;
}

export const approvedAnchorScreens: AnchorMap = {
  welcome: Welcome,
  'diagnostic-result': DiagnosticResult,
  home: Home,
  'compare-concepts': CompareConcepts,
  'pass-ready': PassReady
};

const s = StyleSheet.create({
  screen: { flex: 1 },
  inset: { marginHorizontal: 4 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  meta: { color: theme.color.textMuted, fontSize: 13 },

  welcomeBrand: { alignItems: 'center', marginTop: 26, marginBottom: 22 },
  welcomeTitle: { color: theme.color.text, fontSize: 38, lineHeight: 44, fontWeight: '700', textAlign: 'center', letterSpacing: -1.1 },
  welcomeSubtitle: { color: theme.color.textMuted, fontSize: 17, lineHeight: 24, textAlign: 'center', marginTop: 10 },
  welcomeJourney: { minHeight: 205, marginHorizontal: 4, marginTop: 22, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 17, overflow: 'hidden' },
  journeyTrack: { flex: 1, height: 148, marginLeft: 8, position: 'relative' },
  journeyLine: { position: 'absolute', left: 15, right: 16, top: 85, height: 3, backgroundColor: theme.color.primary, transform: [{ rotate: '-24deg' }] },
  journeyPoint: { position: 'absolute' },
  passReadyLabel: { position: 'absolute', right: 0, top: 56, color: theme.color.text, fontSize: 13, fontWeight: '600' },
  featureStack: { marginHorizontal: 4, marginTop: 12 },
  trustStrip: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, backgroundColor: theme.color.primaryPale, borderWidth: 1, borderColor: theme.color.border, borderRadius: 14, paddingHorizontal: 9, marginTop: 3 },
  trustText: { color: theme.color.textMuted, fontSize: 10, textAlign: 'center' },

  diagnosticHero: { flexDirection: 'row', alignItems: 'center', minHeight: 158, marginHorizontal: 4, marginBottom: 11 },
  diagnosticCopy: { flex: 1, paddingRight: 7 },
  diagnosticTitle: { color: theme.color.text, fontSize: 30, lineHeight: 35, fontWeight: '700', letterSpacing: -0.7 },
  diagnosticMessage: { color: theme.color.textMuted, fontSize: 15, lineHeight: 22, marginTop: 13 },
  anchorCard: { marginHorizontal: 4, marginBottom: 12, paddingVertical: 13, paddingHorizontal: 16 },
  cardTitle: { color: theme.color.text, fontSize: 18, lineHeight: 24, fontWeight: '700' },
  domainRow: { minHeight: 53, flexDirection: 'row', alignItems: 'center', gap: 10 },
  domainName: { color: theme.color.text, fontSize: 14, fontWeight: '600', marginBottom: 5 },
  domainScore: { color: theme.color.textMuted, fontSize: 14, minWidth: 34, textAlign: 'right' },
  planRow: { minHeight: 53, flexDirection: 'row', alignItems: 'center', gap: 11, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.color.border },
  planTitle: { flex: 1, color: theme.color.text, fontSize: 15, fontWeight: '600' },
  noBorder: { borderBottomWidth: 0 },

  homeHero: { minHeight: 202, flexDirection: 'row', alignItems: 'center', gap: 13, padding: 15 },
  homeHeroCopy: { flex: 1 },
  homeHeroTitle: { color: theme.color.text, fontSize: 23, lineHeight: 28, fontWeight: '700' },
  homeHeroDelta: { color: theme.color.tealDark, fontSize: 16, lineHeight: 22, fontWeight: '600', marginTop: 3 },
  heroDivider: { height: 1, backgroundColor: theme.color.border, marginVertical: 12 },
  homeHeroSupport: { color: theme.color.textMuted, fontSize: 13, lineHeight: 19 },
  homeHeroPass: { color: theme.color.text, fontSize: 15, fontWeight: '700', marginTop: 3, marginBottom: 9 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 4, marginTop: 21, marginBottom: 9 },
  sectionTitle: { color: theme.color.text, fontSize: 20, fontWeight: '700' },
  planCard: { paddingVertical: 4, paddingHorizontal: 14 },
  quickRow: { flexDirection: 'row', gap: 10, marginTop: 14, marginBottom: 14 },

  lessonProgress: { flexDirection: 'row', alignItems: 'center', gap: 16, marginHorizontal: 4, marginBottom: 20 },
  lessonProgressText: { color: theme.color.text, fontSize: 14, fontWeight: '500' },
  compareTitle: { color: theme.color.text, fontSize: 30, lineHeight: 35, fontWeight: '700', letterSpacing: -0.7, marginHorizontal: 4 },
  compareSubtitle: { color: theme.color.textMuted, fontSize: 17, lineHeight: 23, marginHorizontal: 4, marginTop: 5, marginBottom: 18 },
  compareMatrix: { padding: 0, overflow: 'hidden' },
  compareHeaders: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13, paddingVertical: 12 },
  compareHeaderCell: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  compareHeaderText: { fontSize: 17, fontWeight: '700' },
  vs: { width: 39, height: 39, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.color.border, backgroundColor: theme.color.surface },
  vsText: { color: theme.color.textMuted, fontSize: 11, fontWeight: '700' },
  rule: { height: 1, backgroundColor: theme.color.border },
  compareColumns: { flexDirection: 'row', paddingHorizontal: 13, paddingVertical: 5 },
  compareColumn: { flex: 1 },
  verticalRule: { width: 1, backgroundColor: theme.color.border, marginHorizontal: 9 },
  compareCell: { flexDirection: 'row', alignItems: 'center', gap: 9, minHeight: 80, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.color.border },
  compareCellText: { flex: 1, color: theme.color.text, fontSize: 13, lineHeight: 18, fontWeight: '500' },
  mixCard: { flexDirection: 'row', alignItems: 'center', gap: 13, marginTop: 16, padding: 15 },
  mixTitle: { color: theme.color.text, fontSize: 15, lineHeight: 20, fontWeight: '700' },
  mixBody: { color: theme.color.textMuted, fontSize: 13, lineHeight: 19, marginTop: 3 },
  saveButton: { minHeight: 50, borderRadius: 14, borderWidth: 1, borderColor: theme.color.border, backgroundColor: theme.color.surface, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, marginTop: 11 },
  saveText: { color: theme.color.text, fontSize: 15, fontWeight: '500' },

  passHero: { minHeight: 205, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 15 },
  passHeroCopy: { flex: 1 },
  passTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  passTitle: { color: theme.color.text, fontSize: 27, lineHeight: 32, fontWeight: '700' },
  passBody: { color: theme.color.textMuted, fontSize: 13, lineHeight: 19, marginTop: 6 },
  summaryCard: { marginTop: 16, paddingVertical: 15 },
  summaryRow: { flexDirection: 'row', alignItems: 'stretch', marginTop: 16 },
  summaryDivider: { width: 1, backgroundColor: theme.color.border },
  untilCard: { minHeight: 76, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: theme.color.border, borderRadius: 16, padding: 13, marginTop: 16, backgroundColor: theme.color.surface, ...theme.shadow.soft },
  untilTitle: { color: theme.color.text, fontSize: 15, fontWeight: '600' },
  untilBody: { color: theme.color.textMuted, fontSize: 13, lineHeight: 18, marginTop: 3 },
  viewProgress: { minHeight: 50, borderRadius: 14, borderWidth: 1, borderColor: theme.color.border, backgroundColor: theme.color.surface, alignItems: 'center', justifyContent: 'center', marginTop: 11 },
  viewProgressText: { color: theme.color.primary, fontSize: 15, fontWeight: '500' }
});
