import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import {
  AppHeader,
  AppIcon,
  BottomTabs,
  BrandMark,
  Button,
  Card,
  FeatureRow,
  Header,
  IconTile,
  ListRow,
  Metric,
  Pill,
  ProgressBar,
  ProgressRing,
  QuickAction,
  ReadinessCard,
  SummaryMetric,
  TextAction,
  TrustCard,
  typography
} from './components';
import { domains, Navigator, ScreenId, studyItems } from './model';
import { theme } from './theme';

type Props = { navigate: Navigator; goBack: () => void };

const Section = ({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) => (
  <View style={s.section}>
    <View style={s.sectionHead}><Text style={typography.h3}>{title}</Text>{action}</View>
    {children}
  </View>
);

const Bullet = ({ children }: { children: React.ReactNode }) => (
  <View style={s.bulletRow}><View style={s.dot} /><Text style={[typography.body, { flex: 1 }]}>{children}</Text></View>
);

const Option = ({ label, selected, onPress }: { label: string; selected?: boolean; onPress?: () => void }) => (
  <Pressable onPress={onPress} accessibilityRole="radio" accessibilityState={{ checked: !!selected }} style={[s.option, selected && s.optionSelected]}>
    <View style={[s.radio, selected && s.radioSelected]}>{selected ? <View style={s.radioCore} /> : null}</View>
    <Text style={s.optionText}>{label}</Text>
  </Pressable>
);

const Shell = ({ children, tab, navigate }: { children: React.ReactNode; tab?: 'home' | 'learn' | 'progress' | 'profile'; navigate: Navigator }) => (
  <View style={s.shell}>{children}{tab ? <BottomTabs active={tab} navigate={navigate} /> : null}</View>
);

const DomainRow = ({ name, score, icon, teal = false }: { name: string; score: number; icon: string; teal?: boolean }) => (
  <View style={s.domainRow}>
    <IconTile name={icon} tone={teal ? 'teal' : 'blue'} size={42} iconSize={23} />
    <View style={{ flex: 1 }}><Text style={s.domainName}>{name}</Text><ProgressBar value={score} teal={teal} /></View>
    <Text style={s.domainScore}>{score}%</Text><AppIcon name="chevron-forward" size={19} color={theme.color.textSoft} />
  </View>
);

const CompareCell = ({ icon, title, tone = 'blue' }: { icon: string; title: string; tone?: 'blue' | 'teal' }) => (
  <View style={s.compareCell}><IconTile name={icon} tone={tone} size={43} iconSize={23} /><Text style={s.compareCellText}>{title}</Text></View>
);

function Welcome({ navigate }: Props) {
  return <Shell navigate={navigate}>
    <View style={s.welcomeBrand}><BrandMark /></View>
    <Text style={s.welcomeTitle}>Get ready to pass</Text>
    <Text style={s.welcomeSubtitle}>Personalized prep for the{`\n`}UK Life in the UK Test.</Text>
    <Card tone="soft" style={s.welcomeJourney}>
      <View style={s.journeyRing}><ProgressRing score={68} label="Building" size={138} stroke={8} /></View>
      <View style={s.journeyTrack}>
        <View style={s.journeyLine} />
        <View style={s.journeyStop}><IconTile name="book-outline" size={40} iconSize={21} /></View>
        <View style={[s.journeyStop, { left: '49%', top: 62 }]}><IconTile name="sparkles-outline" tone="teal" size={40} iconSize={21} /></View>
        <View style={[s.journeyStop, { right: 0, left: undefined, top: 5 }]}><IconTile name="shield-checkmark-outline" size={44} iconSize={23} /></View>
        <Text style={s.passReadyJourney}>Pass Ready</Text>
      </View>
    </Card>
    <View style={s.featureStack}>
      <FeatureRow icon="bar-chart" title="Check your readiness" subtitle="See how close you are to Pass Ready." />
      <FeatureRow icon="school-outline" tone="teal" title="Study only what you need" subtitle="Smart practice that focuses on you." />
      <FeatureRow icon="shield-outline" title="Build confidence before test day" subtitle="Practice with purpose. Feel prepared." />
    </View>
    <Button label="Get started" onPress={() => navigate('test-setup')} />
    <TextAction label="I already have an account" onPress={() => navigate('home')} />
    <View style={s.welcomeTrust}><AppIcon name="shield-checkmark-outline" size={20} color={theme.color.tealDark} /><Text style={s.welcomeTrustText}>Official-source grounded  •  Personalized  •  Clear explanations</Text></View>
  </Shell>;
}

function TestSetup({ navigate, goBack }: Props) {
  const [prep, setPrep] = useState('Some');
  return <Shell navigate={navigate}>
    <AppHeader onBack={goBack} />
    <Text style={typography.h1}>Tell us about your test</Text>
    <Text style={[typography.muted, s.intro]}>Three details are enough to build your first readiness check.</Text>
    <Section title="Test date"><Card><Text style={s.fieldLabel}>Exam date</Text><TextInput accessibilityLabel="Exam date" value="14 September 2026" style={s.input} /><Text style={s.fieldHint}>12 days from today</Text></Card></Section>
    <Section title="Explanations"><Card><ListRow title="English" meta="Explanation language" trailing="Selected" icon="language-outline" /></Card></Section>
    <Section title="Previous preparation"><Card>{['None', 'Some', 'A lot'].map(x => <Option key={x} label={x} selected={prep === x} onPress={() => setPrep(x)} />)}</Card></Section>
    <Button label="Check my readiness" onPress={() => navigate('diagnostic')} />
  </Shell>;
}

function Diagnostic({ navigate, goBack }: Props) {
  const [answer, setAnswer] = useState<string>();
  return <Shell navigate={navigate}>
    <AppHeader onBack={goBack} />
    <View style={s.progressHeader}><Text style={s.progressTitle}>Diagnostic · 8 of ~24</Text><ProgressBar value={8} max={24} /></View>
    <View style={s.questionSpace}><Pill label="Government" /><Text style={typography.h1}>Which institution is responsible for making and scrutinising laws?</Text><Text style={typography.muted}>Choose the best answer. We won’t show corrections until the diagnostic is complete.</Text>{['Parliament', 'The Government', 'The Cabinet Office', 'The Civil Service'].map(x => <Option key={x} label={x} selected={answer === x} onPress={() => setAnswer(x)} />)}<TextAction label="I don’t know" onPress={() => setAnswer('I don’t know')} /></View>
    <Button label="Next question" disabled={!answer} onPress={() => navigate('diagnostic-result')} />
  </Shell>;
}

function DiagnosticResult({ navigate, goBack }: Props) {
  return <Shell navigate={navigate}>
    <AppHeader onBack={goBack} />
    <View style={s.diagnosticHero}>
      <View style={s.diagnosticCopy}><Text style={s.diagnosticTitle}>You’re Building</Text><Text style={s.diagnosticMessage}>You’re strong in UK culture,{`\n`}but need more work on{`\n`}government and early{`\n`}British history.</Text></View>
      <ProgressRing score={58} label="Readiness Score" size={150} stroke={8} />
    </View>
    <Card style={s.blockCard}>
      <Text style={s.blockTitle}>Domain breakdown</Text>
      <DomainRow name="Government" score={41} icon="business-outline" />
      <DomainRow name="History" score={48} icon="book-outline" teal />
      <DomainRow name="Rights" score={72} icon="scale-outline" />
      <DomainRow name="Culture" score={87} icon="people-outline" teal />
    </Card>
    <Card style={s.blockCard}>
      <View style={s.sectionHead}><Text style={s.blockTitle}>Today’s plan</Text><Text style={s.totalText}>14 min total</Text></View>
      <ListRow title="Government in the UK" trailing="5 min" icon="business-outline" />
      <ListRow title="Early British History" trailing="5 min" icon="book-outline" iconTone="teal" />
      <ListRow title="UK Culture & Values" trailing="4 min" icon="people-outline" iconTone="blue" hideDivider />
    </Card>
    <Button label="Start my plan" onPress={() => navigate('today-plan')} />
    <TextAction label="See full breakdown" onPress={() => navigate('progress-overview')} />
  </Shell>;
}

function Home({ navigate }: Props) {
  return <Shell tab="home" navigate={navigate}>
    <AppHeader />
    <Card tone="soft" style={s.homeHero}>
      <ProgressRing score={68} label="Building" size={148} stroke={8} />
      <View style={s.homeHeroCopy}>
        <Text style={s.homeHeroTitle}>Your readiness</Text>
        <Text style={s.homeHeroDelta}>+7% this week</Text>
        <View style={s.heroDivider} />
        <Text style={s.homeHeroSupport}>You’re 32% away from</Text>
        <Text style={s.homeHeroPass}>Pass Ready</Text>
        <ProgressBar value={68} valueLabel="68%" />
      </View>
    </Card>
    <Section title="Today’s plan" action={<Text style={s.totalText}>4 items</Text>}>
      <Card style={s.planCard}>
        <ListRow title="Parliament vs Government" trailing="4 min" icon="business-outline" onPress={() => navigate('compare-concepts')} />
        <ListRow title="Magna Carta" trailing="3 min" icon="document-text-outline" iconTone="teal" onPress={() => navigate('recall')} />
        <ListRow title="UK Elections" trailing="4 min" icon="checkbox-outline" onPress={() => navigate('learn-concept')} />
        <ListRow title="Quick recall" trailing="3 min" icon="sparkles-outline" iconTone="teal" onPress={() => navigate('recall')} hideDivider />
      </Card>
    </Section>
    <Button label="Continue learning" onPress={() => navigate('today-plan')} />
    <View style={s.quickRow}>
      <QuickAction icon="flash" tone="teal" title="Quick Practice" onPress={() => navigate('question')} />
      <QuickAction icon="clipboard-outline" title="Mock Test" onPress={() => navigate('mock-intro')} />
      <QuickAction icon="bar-chart" tone="teal" title="My Progress" onPress={() => navigate('progress-overview')} />
    </View>
    <TrustCard title="Study only what you need." subtitle="Smart practice. Focused results." />
  </Shell>;
}

function TodayPlan({ navigate, goBack }: Props) {
  return <Shell tab="learn" navigate={navigate}>
    <AppHeader onBack={goBack} />
    <Text style={typography.h1}>Today’s plan</Text><Text style={[typography.muted, s.intro]}>The smallest set of activities likely to improve your readiness today.</Text>
    <Section title="Priority"><Card>{studyItems.map((item, i) => <ListRow key={item.title} title={item.title} meta={item.meta} onPress={() => navigate(item.screen)} trailing={i === 0 ? 'Start' : undefined} icon={i === 0 ? 'business-outline' : i === 1 ? 'document-text-outline' : i === 2 ? 'checkbox-outline' : 'sparkles-outline'} iconTone={i % 2 ? 'teal' : 'blue'} />)}</Card></Section>
    <Card tone="soft" style={s.stopCard}><IconTile name="checkmark-circle-outline" tone="teal" /><View style={{ flex: 1 }}><Text style={typography.h3}>Enough for today</Text><Text style={typography.muted}>Finish these activities and CitizenAI will tell you to stop unless your evidence changes.</Text></View></Card>
    <Button label="Start plan" onPress={() => navigate('compare-concepts')} />
  </Shell>;
}

function LearnConcept({ navigate, goBack }: Props) {
  return <Shell tab="learn" navigate={navigate}>
    <AppHeader onBack={goBack} />
    <View style={s.progressHeader}><Text style={s.progressTitle}>Today’s plan · 3 of 4</Text><ProgressBar value={3} max={4} /></View>
    <Text style={typography.h1}>How general elections work</Text><Text style={[typography.muted, s.intro]}>Learn only the distinction you need for the next questions.</Text>
    <Card style={s.learningCard}><FeatureRow icon="people-outline" title="Voters elect MPs" subtitle="UK general elections choose Members of Parliament." /><FeatureRow icon="location-outline" tone="teal" title="One constituency, one MP" subtitle="Most constituencies use first past the post." /><FeatureRow icon="business-outline" title="Government follows Commons confidence" subtitle="The party able to command confidence normally forms the government." /></Card>
    <Card tone="soft" style={s.noteCard}><IconTile name="sparkles-outline" /><View style={{ flex: 1 }}><Text style={s.noteTitle}>Keep this distinction</Text><Text style={s.noteBody}>Voters elect MPs. They do not directly elect the Prime Minister.</Text></View></Card>
    <Button label="Check understanding" onPress={() => navigate('question')} />
  </Shell>;
}

function CompareConcepts({ navigate, goBack }: Props) {
  return <Shell tab="learn" navigate={navigate}>
    <AppHeader onBack={goBack} />
    <View style={s.lessonProgress}><Text style={s.lessonProgressText}>Today’s plan · 2 of 4</Text><View style={{ flex: 1 }}><ProgressBar value={2} max={4} /></View></View>
    <Text style={s.compareTitle}>Parliament vs Government</Text>
    <Text style={s.compareSubtitle}>Understand the difference clearly.</Text>
    <Card style={s.compareMatrix}>
      <View style={s.compareHeaders}>
        <View style={s.compareHeaderCell}><IconTile name="business-outline" /><Text style={[s.compareHeaderText, { color: theme.color.primary }]}>Parliament</Text></View>
        <View style={s.compareVs}><Text style={s.compareVsText}>VS</Text></View>
        <View style={s.compareHeaderCell}><IconTile name="business-outline" tone="teal" /><Text style={[s.compareHeaderText, { color: theme.color.tealDark }]}>Government</Text></View>
      </View>
      <View style={s.compareDivider} />
      <View style={s.compareColumns}>
        <View style={s.compareColumn}>
          <CompareCell icon="create-outline" title="Makes and scrutinizes laws" />
          <CompareCell icon="people-outline" title="Includes MPs and the House of Lords" />
          <CompareCell icon="scale-outline" title="Holds government accountable" />
        </View>
        <View style={s.verticalDivider} />
        <View style={s.compareColumn}>
          <CompareCell icon="settings-outline" title="Runs the country" tone="teal" />
          <CompareCell icon="person-outline" title="Led by the Prime Minister" tone="teal" />
          <CompareCell icon="checkmark-circle-outline" title="Implements policy" tone="teal" />
        </View>
      </View>
    </Card>
    <Card tone="soft" style={s.mixCard}><IconTile name="sparkles-outline" /><View style={{ flex: 1 }}><Text style={s.mixTitle}>You’re mixing these two concepts.</Text><Text style={s.mixBody}>Once you see the distinction, the question becomes much easier.</Text></View></Card>
    <Button label="Check understanding" onPress={() => navigate('recall')} />
    <Pressable style={s.secondaryWide}><AppIcon name="bookmark-outline" size={22} color={theme.color.text} /><Text style={s.secondaryWideText}>Save for later</Text></Pressable>
  </Shell>;
}

function Recall({ navigate, goBack }: Props) {
  const [revealed, setRevealed] = useState(false);
  return <Shell tab="learn" navigate={navigate}>
    <AppHeader onBack={goBack} />
    <View style={s.progressHeader}><Text style={s.progressTitle}>Quick recall · 3 min</Text><ProgressBar value={3} max={4} /></View>
    <Text style={typography.h1}>What principle is Magna Carta commonly associated with?</Text>
    <Card style={s.recallCard}>{revealed ? <><Pill label="Answer" tone="success" /><Text style={[typography.h2, { marginTop: 12 }]}>The law applies to rulers too.</Text><Text style={[typography.muted, { marginTop: 8 }]}>It is an important historical symbol of limits on arbitrary power and the rule of law.</Text></> : <View style={s.recallEmpty}><IconTile name="bulb-outline" tone="teal" size={58} iconSize={29} /><Text style={s.recallPrompt}>Try to answer in your own words before revealing.</Text></View>}</Card>
    {!revealed ? <Button label="Reveal answer" onPress={() => setRevealed(true)} /> : <View style={s.twoButtons}><View style={{ flex: 1 }}><Button label="Got it" onPress={() => navigate('question')} showArrow={false} /></View><View style={{ flex: 1 }}><Button secondary label="Didn’t know" onPress={() => navigate('learn-concept')} showArrow={false} /></View></View>}
  </Shell>;
}

function Question({ navigate, goBack }: Props) {
  const [answer, setAnswer] = useState<string>();
  return <Shell tab="learn" navigate={navigate}>
    <AppHeader onBack={goBack} />
    <View style={s.progressHeader}><Text style={s.progressTitle}>Practice · unseen wording</Text><ProgressBar value={3} max={4} /></View>
    <Pill label="Government" /><Text style={[typography.h1, s.learningTitle]}>Which statement best describes the relationship between Parliament and Government?</Text>
    {['Parliament implements policy for Government', 'Government scrutinises Parliament', 'Parliament can hold Government accountable', 'They are the same institution'].map(x => <Option key={x} label={x} selected={answer === x} onPress={() => setAnswer(x)} />)}
    <Button label="Check answer" disabled={!answer} onPress={() => navigate('answer-explanation')} />
  </Shell>;
}

function AnswerExplanation({ navigate, goBack }: Props) {
  return <Shell tab="learn" navigate={navigate}>
    <AppHeader onBack={goBack} />
    <Text style={typography.h1}>Understand the answer</Text>
    <Card tone="warning" style={s.explainCard}><IconTile name="git-compare-outline" tone="warning" /><View style={{ flex: 1 }}><Text style={s.mixTitle}>Parliament holds Government accountable.</Text><Text style={s.mixBody}>You reversed the relationship. Government runs departments and policy; Parliament debates, legislates and scrutinises.</Text></View></Card>
    <Section title="Why this matters"><Card><Text style={typography.body}>When wording changes, ask: “Who is checking whom?” That anchors the underlying concept rather than the exact sentence.</Text></Card></Section>
    <Button label="Understand the difference" onPress={() => navigate('compare-concepts')} /><Button secondary label="Try an unseen question" onPress={() => navigate('session-complete')} />
  </Shell>;
}

function SessionComplete({ navigate, goBack }: Props) {
  return <Shell tab="learn" navigate={navigate}>
    <AppHeader onBack={goBack} />
    <View style={s.completeMark}><AppIcon name="checkmark" size={38} color={theme.color.tealDark} /></View><Text style={[typography.h1, { textAlign: 'center' }]}>Good stopping point</Text><Text style={[typography.muted, { textAlign: 'center', marginTop: 8 }]}>You’ve done enough useful work for this session.</Text>
    <Card style={{ marginTop: 24 }}><View style={s.metrics}><Metric value="14 min" label="Studied" /><Metric value="4" label="Concepts" /><Metric value="+5%" label="Readiness" /></View></Card>
    <Button label="Finish" onPress={() => navigate('home')} /><TextAction label="Keep practicing" onPress={() => navigate('question')} />
  </Shell>;
}

function ProgressOverview({ navigate }: Props) {
  return <Shell tab="progress" navigate={navigate}>
    <AppHeader />
    <Text style={typography.h1}>Your progress</Text><Text style={[typography.muted, s.intro]}>Readiness combines mastery, retention, coverage and evidence confidence.</Text>
    <ReadinessCard score={68} confidence="High" compact />
    <Section title="Needs attention"><Card>{domains.filter(x => x.weak > 0).map((d, i) => <ListRow key={d.name} title={d.name} meta={`${d.weak} concepts need attention`} trailing={`${d.score}%`} onPress={() => navigate('domain-detail')} icon={i === 0 ? 'business-outline' : i === 1 ? 'book-outline' : 'scale-outline'} iconTone={i === 1 ? 'teal' : 'blue'} />)}</Card></Section>
    <Section title="Strong"><Card><ListRow title="Culture & traditions" meta="Stable retention" trailing="91%" icon="people-outline" iconTone="teal" /><ListRow title="Rights & responsibilities" meta="1 light review due" trailing="82%" icon="shield-checkmark-outline" hideDivider /></Card></Section>
  </Shell>;
}

function DomainDetail({ navigate, goBack }: Props) {
  return <Shell tab="progress" navigate={navigate}>
    <AppHeader onBack={goBack} />
    <Text style={typography.h1}>Government</Text><Text style={[typography.muted, s.intro]}>61% effective mastery</Text><ProgressBar value={61} valueLabel="61%" />
    <Section title="Priority concepts"><Card><ListRow title="Parliament vs Government" meta="Misconception detected" trailing="High" onPress={() => navigate('concept-detail')} icon="git-compare-outline" /><ListRow title="General elections" meta="Low retention" trailing="Medium" onPress={() => navigate('concept-detail')} icon="checkbox-outline" iconTone="teal" /><ListRow title="Devolved government" meta="Low confidence" trailing="Medium" onPress={() => navigate('concept-detail')} icon="map-outline" hideDivider /></Card></Section>
    <Section title="Evidence"><Card><View style={s.metrics}><Metric value="14" label="Questions" /><Metric value="8" label="Variants" /><Metric value="5d" label="Last recall" /></View></Card></Section>
  </Shell>;
}

function ConceptDetail({ navigate, goBack }: Props) {
  return <Shell tab="progress" navigate={navigate}>
    <AppHeader onBack={goBack} />
    <Text style={typography.h1}>Parliament vs Government</Text><Text style={[typography.muted, s.intro]}>Concept detail</Text>
    <Card><View style={s.metrics}><Metric value="54%" label="Mastery" /><Metric value="High" label="Confidence" /><Metric value="71%" label="Retention" /></View></Card>
    <Section title="What we see"><Card tone="warning"><Text style={typography.h3}>Common confusion</Text><Text style={[typography.muted, { marginTop: 7 }]}>You sometimes reverse which institution scrutinises the other, especially with unfamiliar wording.</Text></Card></Section>
    <Section title="Evidence history"><Card><ListRow title="Unseen variant" meta="Today" trailing="Incorrect" icon="help-circle-outline" /><ListRow title="Delayed recall" meta="3 days ago" trailing="Correct" icon="refresh-outline" iconTone="teal" /><ListRow title="Compare check" meta="5 days ago" trailing="Correct" icon="git-compare-outline" hideDivider /></Card></Section>
    <Button label="Strengthen this concept" onPress={() => navigate('compare-concepts')} />
  </Shell>;
}

function MockIntro({ navigate, goBack }: Props) {
  return <Shell navigate={navigate}>
    <AppHeader onBack={goBack} />
    <Text style={typography.h1}>Mock test</Text><Text style={[typography.muted, s.intro]}>Exam simulation</Text>
    <Card tone="soft" style={s.mockHero}><IconTile name="timer-outline" size={58} iconSize={29} /><View style={{ flex: 1 }}><Text style={typography.h2}>24 questions · 45 minutes</Text><Text style={typography.muted}>No hints, explanations or live correctness.</Text></View></Card>
    <Section title="Before you start"><Card><FeatureRow icon="checkmark-circle-outline" title="Answer every question" subtitle="Choose the best answer." /><FeatureRow icon="flag-outline" tone="teal" title="Flag and review" subtitle="Come back before submitting." /><FeatureRow icon="analytics-outline" title="Score and readiness stay separate" subtitle="One good mock does not prove retention." /></Card></Section>
    <Card tone="soft"><Text style={typography.body}>Targeted study would currently give you slightly more value, but you can take a mock whenever you choose.</Text></Card><Button label="Start mock" onPress={() => navigate('mock-question')} />
  </Shell>;
}

function MockQuestion({ navigate, goBack }: Props) {
  const [answer, setAnswer] = useState<string>();
  return <Shell navigate={navigate}>
    <AppHeader onBack={goBack} />
    <View style={s.mockTop}><Text style={s.progressTitle}>Question 7 of 24</Text><Text style={s.timer}>34:18 left</Text></View><ProgressBar value={7} max={24} />
    <Text style={[typography.h1, s.questionSpace]}>Which two Houses make up the UK Parliament?</Text>{['Commons and Senate', 'Commons and Lords', 'Lords and Cabinet', 'Cabinet and Commons'].map(x => <Option key={x} label={x} selected={answer === x} onPress={() => setAnswer(x)} />)}
    <View style={s.twoButtons}><View style={{ flex: 1 }}><Button secondary label="Flag" showArrow={false} /></View><View style={{ flex: 1 }}><Button label="Next" disabled={!answer} onPress={() => navigate('mock-review')} /></View></View>
  </Shell>;
}

function MockReview({ navigate, goBack }: Props) {
  return <Shell navigate={navigate}>
    <AppHeader onBack={goBack} />
    <Text style={typography.h1}>Review answers</Text><Text style={[typography.muted, s.intro]}>24 of 24 answered</Text>
    <Card><View style={s.metrics}><Metric value="24" label="Answered" /><Metric value="2" label="Flagged" /><Metric value="11:04" label="Time left" /></View></Card>
    <Section title="Questions"><Card>{Array.from({ length: 6 }).map((_, i) => <ListRow key={i} title={`Question ${i + 1}`} meta={i === 2 || i === 5 ? 'Flagged for review' : 'Answered'} trailing={i === 2 || i === 5 ? 'Flagged' : 'Done'} icon={i === 2 || i === 5 ? 'flag-outline' : 'checkmark-circle-outline'} iconTone={i === 2 || i === 5 ? 'warning' : 'teal'} />)}</Card></Section><Button label="Submit mock" onPress={() => navigate('mock-result')} />
  </Shell>;
}

function MockResult({ navigate, goBack }: Props) {
  return <Shell navigate={navigate}>
    <AppHeader onBack={goBack} />
    <Card tone="soft" style={s.resultHero}><ProgressRing score={83} label="Mock score" size={136} stroke={8} /><View style={{ flex: 1 }}><Pill label="Passed" tone="success" /><Text style={[typography.h2, { marginTop: 10 }]}>20 / 24 correct</Text><Text style={typography.muted}>Your readiness can still be lower than your raw score.</Text></View></Card>
    <Section title="Readiness"><ReadinessCard score={78} confidence="High" compact /></Section>
    <Card tone="soft"><Text style={typography.h3}>Why readiness is lower</Text><Text style={[typography.muted, { marginTop: 7 }]}>History still contains low-retention concepts, so one good mock is not enough evidence yet.</Text></Card>
    <Section title="Fix first"><Card><ListRow title="Early British history" meta="2 weak concepts" onPress={() => navigate('domain-detail')} icon="book-outline" iconTone="teal" /><ListRow title="Parliament vs Government" meta="Unseen wording" onPress={() => navigate('compare-concepts')} icon="git-compare-outline" hideDivider /></Card></Section><Button label="Fix weak areas" onPress={() => navigate('today-plan')} />
  </Shell>;
}

function PassReady({ navigate }: Props) {
  return <Shell tab="progress" navigate={navigate}>
    <AppHeader days="7 days until test" />
    <Card tone="soft" style={s.passHero}>
      <ProgressRing score={91} size={150} stroke={8} />
      <View style={s.passHeroCopy}><IconTile name="shield-checkmark" size={54} iconSize={29} /><Text style={s.passTitle}>Pass Ready <Text style={{ color: theme.color.tealDark }}>✓</Text></Text><Text style={s.passBody}>Based on your demonstrated knowledge, retention, and mock performance, you’re prepared.</Text></View>
    </Card>
    <Card style={s.summaryCard}><Text style={s.blockTitle}>Your readiness summary</Text><View style={s.summaryRow}><SummaryMetric icon="shield-checkmark-outline" tone="teal" label={'Coverage\nconfidence'} value="High" valueTone="teal" /><View style={s.summaryDivider} /><SummaryMetric icon="clipboard-outline" label={'Mocks\npassed'} value="4" /><View style={s.summaryDivider} /><SummaryMetric icon="locate-outline" tone="teal" label={'Critical weak\nconcepts'} value="0" valueTone="teal" /></View></Card>
    <Pressable style={s.untilCard} onPress={() => navigate('exam-countdown')}><IconTile name="calendar-outline" size={50} iconSize={26} /><View style={{ flex: 1 }}><Text style={s.untilTitle}>Until your exam</Text><Text style={s.untilBody}>We’ll keep your knowledge fresh with short reviews.</Text></View><AppIcon name="chevron-forward" size={22} color={theme.color.textSoft} /></Pressable>
    <Button label="Keep me ready" onPress={() => navigate('maintenance-review')} />
    <Pressable style={s.secondaryWide} onPress={() => navigate('progress-overview')}><Text style={[s.secondaryWideText, { color: theme.color.primary }]}>View progress</Text></Pressable>
  </Shell>;
}

function MaintenanceReview({ navigate, goBack }: Props) {
  return <Shell tab="learn" navigate={navigate}>
    <AppHeader onBack={goBack} days="7 days until test" />
    <Text style={typography.h1}>Keep me ready</Text><Text style={[typography.muted, s.intro]}>Maintenance</Text>
    <Card tone="soft" style={s.stopCard}><IconTile name="checkmark-circle-outline" tone="teal" size={54} iconSize={28} /><View style={{ flex: 1 }}><Text style={typography.h2}>No study needed today</Text><Text style={typography.muted}>Your retention is stable and no critical concept is due for review.</Text></View></Card>
    <Section title="Next check"><Card><ListRow title="Government recall" meta="Expected in 2 days" trailing="2 min" icon="business-outline" /><ListRow title="History refresh" meta="Expected in 4 days" trailing="3 min" icon="book-outline" iconTone="teal" hideDivider /></Card></Section><TrustCard title="Stay fresh, not busy." subtitle="CitizenAI only asks you to study when useful work is due." /><Button secondary label="Practice anyway" onPress={() => navigate('question')} />
  </Shell>;
}

function ExamCountdown({ navigate, goBack }: Props) {
  return <Shell tab="home" navigate={navigate}>
    <AppHeader onBack={goBack} days="3 days until test" />
    <Text style={typography.h1}>3 days to go</Text><Text style={[typography.muted, s.intro]}>Stay fresh. Avoid cramming.</Text><ReadinessCard score={92} confidence="High" compact />
    <Section title="Today"><Card><ListRow title="High-risk recall" meta="Government · History" trailing="5 min" icon="refresh-outline" iconTone="teal" /><ListRow title="Short confidence mock" meta="Optional" trailing="12 min" icon="clipboard-outline" hideDivider /></Card></Section><Card tone="soft"><Text style={typography.h3}>Your evidence is strong.</Text><Text style={[typography.muted, { marginTop: 7 }]}>Short recall is more useful now than long study sessions.</Text></Card><Button label="Start 5-minute refresh" onPress={() => navigate('recall')} /><TextAction label="Preview test day" onPress={() => navigate('exam-day')} />
  </Shell>;
}

function ExamDay({ navigate, goBack }: Props) {
  return <Shell tab="home" navigate={navigate}>
    <AppHeader onBack={goBack} days="Test day" />
    <Card tone="soft" style={s.dayHero}><IconTile name="sunny-outline" tone="teal" size={58} iconSize={29} /><View style={{ flex: 1 }}><Text style={typography.h2}>Keep it simple today.</Text><Text style={typography.muted}>No new learning. Use the optional confidence refresh only if it helps.</Text></View></Card>
    <Section title="Before you leave"><Card><FeatureRow icon="id-card-outline" title="Bring what your booking requires" subtitle="Follow the official identification instructions." /><FeatureRow icon="time-outline" tone="teal" title="Leave enough travel time" subtitle="Arrive without rushing." /><FeatureRow icon="reader-outline" title="Read each question carefully" subtitle="Do not answer from the first familiar word." /></Card></Section><Button label="Optional 5-minute refresh" onPress={() => navigate('recall')} /><TextAction label="I’ve finished my test" onPress={() => navigate('exam-result')} />
  </Shell>;
}

function ExamResult({ navigate, goBack }: Props) {
  return <Shell navigate={navigate}>
    <AppHeader onBack={goBack} days="After your test" />
    <Text style={typography.h1}>How did it go?</Text><Text style={[typography.muted, s.intro]}>Your answer helps CitizenAI recalibrate. Anonymous sharing is always optional.</Text>
    <View style={s.outcomeGrid}><Pressable style={s.outcomeCard} onPress={() => navigate('passed')}><IconTile name="checkmark-circle-outline" tone="teal" size={60} iconSize={31} /><Text style={typography.h2}>Passed</Text></Pressable><Pressable style={s.outcomeCard} onPress={() => navigate('failed')}><IconTile name="refresh-outline" size={60} iconSize={31} /><Text style={typography.h2}>Didn’t pass</Text></Pressable></View><Button secondary label="My test was rescheduled" onPress={() => navigate('profile')} />
  </Shell>;
}

function Passed({ navigate, goBack }: Props) {
  const [consent, setConsent] = useState(false);
  return <Shell navigate={navigate}>
    <AppHeader onBack={goBack} days="Outcome" />
    <View style={s.completeMark}><AppIcon name="checkmark" size={38} color={theme.color.tealDark} /></View><Text style={[typography.h1, { textAlign: 'center' }]}>You passed.</Text><Text style={[typography.muted, { textAlign: 'center', marginTop: 8 }]}>Your preparation journey is complete.</Text>
    <Card style={{ marginTop: 24 }}><Pressable onPress={() => setConsent(!consent)} style={s.checkRow}><View style={[s.checkbox, consent && s.checkboxOn]}>{consent ? <AppIcon name="checkmark" size={16} color={theme.color.white} /> : null}</View><View style={{ flex: 1 }}><Text style={s.listStrong}>Share my result anonymously</Text><Text style={s.fieldHint}>Used only to evaluate and calibrate readiness estimates.</Text></View></Pressable></Card><Button label="Finish" onPress={() => navigate('home')} />
  </Shell>;
}

function Failed({ navigate, goBack }: Props) {
  const [reason, setReason] = useState<string>();
  return <Shell navigate={navigate}>
    <AppHeader onBack={goBack} days="Outcome" />
    <Text style={typography.h1}>We’ll recalibrate</Text><Text style={[typography.muted, s.intro]}>This does not assume the previous readiness estimate was correct.</Text><Section title="What felt different? · Optional"><Card>{['Questions felt harder', 'Topics felt unfamiliar', 'Timing was difficult', 'Wording was confusing'].map(x => <Option key={x} label={x} selected={reason === x} onPress={() => setReason(x)} />)}</Card></Section><Button label="Build a new plan" onPress={() => navigate('diagnostic')} /><TextAction label="Skip for now" onPress={() => navigate('home')} />
  </Shell>;
}

function Profile({ navigate }: Props) {
  return <Shell tab="profile" navigate={navigate}>
    <AppHeader />
    <Text style={typography.h1}>Profile & settings</Text>
    <Section title="Test"><Card><ListRow title="Exam date" meta="14 September 2026" trailing="Edit" icon="calendar-outline" /><ListRow title="Country pack" meta="United Kingdom" trailing="UK" icon="flag-outline" iconTone="teal" /><ListRow title="Explanation language" meta="English" trailing="Edit" icon="language-outline" hideDivider /></Card></Section>
    <Section title="Preferences"><Card><ListRow title="Study reminders" meta="Readiness-based reminders" trailing="On" icon="notifications-outline" /><ListRow title="Outcome sharing" meta="Anonymous calibration data" trailing="Off" icon="analytics-outline" iconTone="teal" hideDivider /></Card></Section>
    <Section title="Trust"><Card><ListRow title="Sources & content version" meta="See where facts come from" onPress={() => navigate('source-info')} icon="shield-checkmark-outline" /><ListRow title="Readiness methodology" meta="Estimated readiness, never a guarantee" onPress={() => navigate('progress-overview')} icon="information-circle-outline" hideDivider /></Card></Section>
  </Shell>;
}

function SourceInfo({ navigate, goBack }: Props) {
  return <Shell tab="profile" navigate={navigate}>
    <AppHeader onBack={goBack} />
    <Text style={typography.h1}>Sources & version</Text><Text style={[typography.muted, s.intro]}>Verified intelligence</Text>
    <Card tone="soft"><Text style={typography.h2}>UK Knowledge Pack</Text><Text style={[typography.muted, { marginTop: 7 }]}>Version 2026.09 · Independently authored from approved public-authority evidence.</Text></Card>
    <Section title="Verification"><Card><View style={s.metrics}><Metric value="24" label="Sources" /><Metric value="684" label="Facts" /><Metric value="1,486" label="Questions" /></View></Card></Section>
    <Section title="Content rules"><Card><FeatureRow icon="shield-checkmark-outline" title="Facts require evidence" subtitle="Canonical facts must be approved." /><FeatureRow icon="sparkles-outline" tone="teal" title="AI cannot publish facts" subtitle="AI can propose wording only." /><FeatureRow icon="link-outline" title="Questions keep provenance" subtitle="Every production question traces to a fact and source." /></Card></Section>
    <Section title="Recent checks"><Card><ListRow title="UK Parliament" meta="Verified today" trailing="Current" icon="business-outline" /><ListRow title="GOV.UK citizenship guidance" meta="Verified today" trailing="Current" icon="shield-checkmark-outline" iconTone="teal" /><ListRow title="Public authority history sources" meta="No material change" trailing="Current" icon="book-outline" hideDivider /></Card></Section>
  </Shell>;
}

export const screenComponents: Record<ScreenId, React.ComponentType<Props>> = {
  welcome: Welcome,
  'test-setup': TestSetup,
  diagnostic: Diagnostic,
  'diagnostic-result': DiagnosticResult,
  home: Home,
  'today-plan': TodayPlan,
  'learn-concept': LearnConcept,
  'compare-concepts': CompareConcepts,
  recall: Recall,
  question: Question,
  'answer-explanation': AnswerExplanation,
  'session-complete': SessionComplete,
  'progress-overview': ProgressOverview,
  'domain-detail': DomainDetail,
  'concept-detail': ConceptDetail,
  'mock-intro': MockIntro,
  'mock-question': MockQuestion,
  'mock-review': MockReview,
  'mock-result': MockResult,
  'pass-ready': PassReady,
  'maintenance-review': MaintenanceReview,
  'exam-countdown': ExamCountdown,
  'exam-day': ExamDay,
  'exam-result': ExamResult,
  passed: Passed,
  failed: Failed,
  profile: Profile,
  'source-info': SourceInfo
};

const s = StyleSheet.create({
  shell: { flex: 1 }, section: { marginTop: 24, gap: 11 }, sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, intro: { marginTop: 8 },
  welcomeBrand: { alignItems: 'center', marginTop: 28, marginBottom: 25 }, welcomeTitle: { color: theme.color.text, fontSize: 40, lineHeight: 46, fontWeight: '700', textAlign: 'center', letterSpacing: -1.2 }, welcomeSubtitle: { color: theme.color.textMuted, fontSize: 20, lineHeight: 28, textAlign: 'center', marginTop: 12 }, welcomeJourney: { minHeight: 220, marginTop: 24, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, overflow: 'hidden' }, journeyRing: { width: 142 }, journeyTrack: { flex: 1, height: 150, marginLeft: 4, position: 'relative' }, journeyLine: { position: 'absolute', left: 12, right: 12, top: 86, height: 3, backgroundColor: theme.color.primary, transform: [{ rotate: '-22deg' }] }, journeyStop: { position: 'absolute', left: 6, top: 92 }, passReadyJourney: { position: 'absolute', right: 0, top: 52, color: theme.color.text, fontSize: 14, fontWeight: '600' }, featureStack: { marginTop: 18, marginBottom: 2, paddingHorizontal: 4 }, welcomeTrust: { minHeight: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: theme.color.primaryPale, borderWidth: 1, borderColor: theme.color.border, borderRadius: 15, paddingHorizontal: 10, marginTop: 6 }, welcomeTrustText: { color: theme.color.textMuted, fontSize: 11, textAlign: 'center' },
  fieldLabel: { color: theme.color.textMuted, fontSize: 12, fontWeight: '700', marginBottom: 7 }, fieldHint: { color: theme.color.textMuted, fontSize: 12, lineHeight: 17 }, input: { minHeight: 50, borderRadius: 14, borderWidth: 1, borderColor: theme.color.border, paddingHorizontal: 14, color: theme.color.text, fontSize: 15, backgroundColor: theme.color.background },
  bulletRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', marginVertical: 7 }, dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: theme.color.primary, marginTop: 9 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 58, borderWidth: 1, borderColor: theme.color.border, backgroundColor: theme.color.surface, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10, marginTop: 10 }, optionSelected: { borderColor: theme.color.primary, backgroundColor: theme.color.primarySoft }, radio: { width: 21, height: 21, borderRadius: 11, borderWidth: 1.5, borderColor: theme.color.borderStrong, alignItems: 'center', justifyContent: 'center' }, radioSelected: { borderColor: theme.color.primary }, radioCore: { width: 11, height: 11, borderRadius: 6, backgroundColor: theme.color.primary }, optionText: { fontSize: 16, color: theme.color.text, flex: 1 },
  progressHeader: { gap: 10, marginBottom: 24 }, progressTitle: { color: theme.color.text, fontSize: 15, fontWeight: '600' }, questionSpace: { marginTop: 26, gap: 16 },
  diagnosticHero: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 190, marginBottom: 22 }, diagnosticCopy: { flex: 1, paddingRight: 8 }, diagnosticTitle: { color: theme.color.text, fontSize: 31, lineHeight: 37, fontWeight: '700', letterSpacing: -0.7 }, diagnosticMessage: { color: theme.color.textMuted, fontSize: 16, lineHeight: 24, marginTop: 17 }, blockCard: { marginBottom: 16 }, blockTitle: { color: theme.color.text, fontSize: 19, lineHeight: 25, fontWeight: '700' }, domainRow: { minHeight: 67, flexDirection: 'row', alignItems: 'center', gap: 12 }, domainName: { color: theme.color.text, fontSize: 15, fontWeight: '600', marginBottom: 7 }, domainScore: { color: theme.color.textMuted, fontSize: 15, minWidth: 36, textAlign: 'right' }, totalText: { color: theme.color.textMuted, fontSize: 14 },
  homeHero: { minHeight: 214, flexDirection: 'row', alignItems: 'center', gap: 15, padding: 16, marginBottom: 2 }, homeHeroCopy: { flex: 1, paddingRight: 3 }, homeHeroTitle: { color: theme.color.text, fontSize: 24, lineHeight: 30, fontWeight: '700' }, homeHeroDelta: { color: theme.color.tealDark, fontSize: 17, lineHeight: 23, fontWeight: '600', marginTop: 4 }, heroDivider: { height: 1, backgroundColor: theme.color.border, marginVertical: 14 }, homeHeroSupport: { color: theme.color.textMuted, fontSize: 14, lineHeight: 20 }, homeHeroPass: { color: theme.color.text, fontSize: 16, fontWeight: '700', marginTop: 4, marginBottom: 11 }, planCard: { paddingVertical: 5, paddingHorizontal: 16 }, quickRow: { flexDirection: 'row', gap: 10, marginTop: 16, marginBottom: 16 },
  stopCard: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 20 }, learningCard: { marginTop: 20 }, noteCard: { flexDirection: 'row', gap: 14, alignItems: 'center', marginTop: 15 }, noteTitle: { color: theme.color.text, fontSize: 16, fontWeight: '700' }, noteBody: { color: theme.color.textMuted, fontSize: 14, lineHeight: 20, marginTop: 3 }, learningTitle: { marginTop: 18, marginBottom: 18 },
  lessonProgress: { flexDirection: 'row', gap: 18, alignItems: 'center', marginBottom: 24 }, lessonProgressText: { color: theme.color.text, fontSize: 15, fontWeight: '500' }, compareTitle: { color: theme.color.text, fontSize: 31, lineHeight: 37, fontWeight: '700', letterSpacing: -0.7 }, compareSubtitle: { color: theme.color.textMuted, fontSize: 18, marginTop: 7, marginBottom: 20 }, compareMatrix: { padding: 0, overflow: 'hidden' }, compareHeaders: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 14 }, compareHeaderCell: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 9 }, compareHeaderText: { fontSize: 18, fontWeight: '700' }, compareVs: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.color.border, backgroundColor: theme.color.surface }, compareVsText: { color: theme.color.textMuted, fontSize: 12, fontWeight: '700' }, compareDivider: { height: 1, backgroundColor: theme.color.border }, compareColumns: { flexDirection: 'row', paddingHorizontal: 14, paddingVertical: 7 }, compareColumn: { flex: 1 }, verticalDivider: { width: 1, backgroundColor: theme.color.border, marginHorizontal: 10 }, compareCell: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 88, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.color.border }, compareCellText: { flex: 1, color: theme.color.text, fontSize: 14, lineHeight: 20, fontWeight: '500' }, mixCard: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 18 }, mixTitle: { color: theme.color.text, fontSize: 16, lineHeight: 22, fontWeight: '700' }, mixBody: { color: theme.color.textMuted, fontSize: 14, lineHeight: 20, marginTop: 3 }, secondaryWide: { minHeight: 55, borderRadius: 15, borderWidth: 1, borderColor: theme.color.border, backgroundColor: theme.color.surface, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 13 }, secondaryWideText: { color: theme.color.text, fontSize: 16, fontWeight: '500' },
  recallCard: { minHeight: 215, marginTop: 24, justifyContent: 'center' }, recallEmpty: { alignItems: 'center', gap: 17 }, recallPrompt: { fontSize: 18, lineHeight: 27, color: theme.color.textMuted, textAlign: 'center' }, twoButtons: { flexDirection: 'row', gap: 10, alignItems: 'flex-end' }, explainCard: { flexDirection: 'row', gap: 14, alignItems: 'flex-start', marginTop: 20 }, completeMark: { width: 78, height: 78, borderRadius: 39, backgroundColor: theme.color.successSoft, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginTop: 32, marginBottom: 20 }, metrics: { flexDirection: 'row', gap: 10 },
  mockHero: { flexDirection: 'row', alignItems: 'center', gap: 15 }, mockTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }, timer: { color: theme.color.textMuted, fontSize: 14, fontWeight: '600' }, resultHero: { flexDirection: 'row', alignItems: 'center', gap: 17 },
  passHero: { minHeight: 225, flexDirection: 'row', alignItems: 'center', gap: 16, padding: 16 }, passHeroCopy: { flex: 1 }, passTitle: { color: theme.color.text, fontSize: 29, lineHeight: 36, fontWeight: '700', marginTop: 12 }, passBody: { color: theme.color.textMuted, fontSize: 15, lineHeight: 22, marginTop: 8 }, summaryCard: { marginTop: 18, paddingBottom: 20 }, summaryRow: { flexDirection: 'row', alignItems: 'stretch', marginTop: 20 }, summaryDivider: { width: 1, backgroundColor: theme.color.border }, untilCard: { minHeight: 84, flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, borderColor: theme.color.border, borderRadius: 17, padding: 15, marginTop: 18, backgroundColor: theme.color.surface, ...theme.shadow.soft }, untilTitle: { color: theme.color.text, fontSize: 16, fontWeight: '600' }, untilBody: { color: theme.color.textMuted, fontSize: 14, lineHeight: 20, marginTop: 4 }, dayHero: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  outcomeGrid: { flexDirection: 'row', gap: 12, marginTop: 28, marginBottom: 18 }, outcomeCard: { flex: 1, minHeight: 155, borderRadius: 20, borderWidth: 1, borderColor: theme.color.border, backgroundColor: theme.color.surface, alignItems: 'center', justifyContent: 'center', gap: 12, ...theme.shadow.soft }, checkRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' }, checkbox: { width: 24, height: 24, borderRadius: 7, borderWidth: 1.5, borderColor: theme.color.border, alignItems: 'center', justifyContent: 'center' }, checkboxOn: { backgroundColor: theme.color.primary, borderColor: theme.color.primary }, listStrong: { color: theme.color.text, fontSize: 14, fontWeight: '700' }
});
