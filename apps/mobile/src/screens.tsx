import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { BottomTabs, BrandMark, Button, Card, Header, ListRow, Metric, Pill, ProgressBar, ReadinessCard, TextAction, typography } from './components';
import { domains, Navigator, ScreenId, studyItems } from './model';
import { theme } from './theme';

type Props = { navigate: Navigator; goBack: () => void };

const Section = ({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) => <View style={s.section}><View style={s.sectionHead}><Text style={typography.h3}>{title}</Text>{action}</View>{children}</View>;
const Bullet = ({ children }: { children: React.ReactNode }) => <View style={s.bulletRow}><View style={s.dot} /><Text style={[typography.body, { flex: 1 }]}>{children}</Text></View>;
const Option = ({ label, selected, onPress }: { label: string; selected?: boolean; onPress?: () => void }) => <Pressable onPress={onPress} accessibilityRole="radio" accessibilityState={{ checked: !!selected }} style={[s.option, selected && s.optionSelected]}><View style={[s.radio, selected && s.radioSelected]}>{selected ? <View style={s.radioCore} /> : null}</View><Text style={s.optionText}>{label}</Text></Pressable>;
const Shell = ({ children, tab, navigate }: { children: React.ReactNode; tab?: 'home' | 'learn' | 'progress' | 'profile'; navigate: Navigator }) => <View style={s.shell}>{children}{tab ? <BottomTabs active={tab} navigate={navigate} /> : null}</View>;

function Welcome({ navigate }: Props) {
  return <Shell navigate={navigate}><View style={s.heroTop}><BrandMark /><View style={s.heroMark}><Text style={s.heroMarkText}>✓</Text></View><Text style={typography.display}>Get ready to pass</Text><Text style={typography.muted}>Personalized preparation for the Life in the UK Test, based on what you actually know.</Text></View><Card tone="soft"><Bullet>Check your readiness</Bullet><Bullet>Study only what you need</Bullet><Bullet>Build confidence before test day</Bullet></Card><View style={s.bottomActions}><Button label="Get started" onPress={() => navigate('test-setup')} /><TextAction label="I already have an account" onPress={() => navigate('home')} /><Text style={s.trust}>Official-source grounded · Personalized · Clear explanations</Text></View></Shell>;
}

function TestSetup({ navigate, goBack }: Props) {
  const [prep, setPrep] = useState('Some');
  return <Shell navigate={navigate}><Header title="Tell us about your test" eyebrow="Setup · 1 min" onBack={goBack} /><Text style={typography.muted}>Three details are enough to build your first readiness check.</Text><Section title="Test date"><Card><Text style={s.fieldLabel}>Exam date</Text><TextInput accessibilityLabel="Exam date" value="14 September 2026" style={s.input} /><Text style={s.fieldHint}>12 days from today</Text></Card></Section><Section title="Explanations"><Card><ListRow title="English" meta="Explanation language" trailing="✓" /></Card></Section><Section title="Previous preparation"><Card>{['None', 'Some', 'A lot'].map(x => <Option key={x} label={x} selected={prep === x} onPress={() => setPrep(x)} />)}</Card></Section><Button label="Check my readiness" onPress={() => navigate('diagnostic')} /></Shell>;
}

function Diagnostic({ navigate, goBack }: Props) {
  const [answer, setAnswer] = useState<string>();
  return <Shell navigate={navigate}><Header title="Diagnostic" eyebrow="8 of ~24" onBack={goBack} /><ProgressBar value={8} max={24} /><View style={s.questionSpace}><Pill label="Government" /><Text style={typography.h1}>Which institution is responsible for making and scrutinising laws?</Text><Text style={typography.muted}>Choose the best answer. We won’t show corrections until the diagnostic is complete.</Text>{['Parliament', 'The Government', 'The Cabinet Office', 'The Civil Service'].map(x => <Option key={x} label={x} selected={answer === x} onPress={() => setAnswer(x)} />)}<TextAction label="I don’t know" onPress={() => setAnswer('I don’t know')} /></View><Button label="Next question" disabled={!answer} onPress={() => navigate('diagnostic-result')} /></Shell>;
}

function DiagnosticResult({ navigate, goBack }: Props) {
  return <Shell navigate={navigate}><Header title="Your readiness" eyebrow="Diagnostic complete" onBack={goBack} /><ReadinessCard score={58} confidence="Medium" /><Text style={[typography.muted, { marginTop: 14 }]}>You’re strong in UK culture, but need more work on government and early British history.</Text><Section title="By topic"><Card>{domains.map(d => <View key={d.name} style={s.domainLine}><ProgressBar value={d.name === 'Government' ? 41 : d.name === 'History' ? 48 : d.name === 'Rights' ? 72 : 87} label={d.name} /></View>)}</Card></Section><Section title="Today’s plan"><Card><View style={s.metrics}><Metric value="14 min" label="Total" /><Metric value="4" label="Activities" /><Metric value="+4–7%" label="Expected gain" /></View></Card></Section><Button label="Start my plan" onPress={() => navigate('today-plan')} /><TextAction label="See full breakdown" onPress={() => navigate('progress-overview')} /></Shell>;
}

function Home({ navigate }: Props) {
  return <Shell tab="home" navigate={navigate}><View style={s.topBrand}><BrandMark /><Text style={s.days}>12 days until test</Text></View><ReadinessCard score={68} delta="+7% this week · Keep building" confidence="High" /><Section title="Today’s plan" action={<Pill label="14 min" />}><Card>{studyItems.map(item => <ListRow key={item.title} title={item.title} meta={item.meta} onPress={() => navigate(item.screen)} />)}</Card></Section><Button label="Continue learning" onPress={() => navigate('today-plan')} /><View style={s.quickRow}><Pressable style={s.quick} onPress={() => navigate('question')}><Text style={s.quickTitle}>Quick Practice</Text><Text style={s.quickMeta}>5 questions</Text></Pressable><Pressable style={s.quick} onPress={() => navigate('mock-intro')}><Text style={s.quickTitle}>Mock Test</Text><Text style={s.quickMeta}>24 questions</Text></Pressable><Pressable style={s.quick} onPress={() => navigate('progress-overview')}><Text style={s.quickTitle}>My Progress</Text><Text style={s.quickMeta}>4 domains</Text></Pressable></View><Text style={s.centerNote}>Study only what you need.</Text></Shell>;
}

function TodayPlan({ navigate, goBack }: Props) {
  return <Shell tab="learn" navigate={navigate}><Header title="Today’s plan" eyebrow="14 minutes" onBack={goBack} /><Text style={typography.muted}>The engine picked the smallest set of activities likely to improve your readiness today.</Text><Section title="Priority"><Card>{studyItems.map((item, i) => <ListRow key={item.title} title={`${i + 1}. ${item.title}`} meta={item.meta} onPress={() => navigate(item.screen)} trailing={i === 0 ? 'Start' : undefined} />)}</Card></Section><Card tone="success"><Text style={typography.h3}>Enough for today</Text><Text style={[typography.muted, { marginTop: 6 }]}>When you finish these four activities, CitizenAI will tell you to stop unless your evidence changes.</Text></Card><Button label="Start plan" onPress={() => navigate('compare-concepts')} /></Shell>;
}

function LearnConcept({ navigate, goBack }: Props) {
  return <Shell tab="learn" navigate={navigate}><Header title="UK elections" eyebrow="Today’s plan · 3 of 4" onBack={goBack} /><Pill label="Learn · 4 min" /><Text style={[typography.h1, s.learningTitle]}>How general elections work</Text><Card><Bullet>UK general elections choose Members of Parliament (MPs).</Bullet><Bullet>Most constituencies elect one MP using first past the post.</Bullet><Bullet>The party able to command confidence in the House of Commons normally forms the government.</Bullet></Card><Card tone="soft"><Text style={typography.h3}>Keep this distinction</Text><Text style={[typography.muted, { marginTop: 7 }]}>Voters elect MPs. They do not directly elect the Prime Minister.</Text></Card><Button label="Check understanding" onPress={() => navigate('question')} /></Shell>;
}

function CompareConcepts({ navigate, goBack }: Props) {
  return <Shell tab="learn" navigate={navigate}><Header title="Parliament vs Government" eyebrow="Today’s plan · 2 of 4" onBack={goBack} /><Text style={typography.muted}>You’re mixing these two concepts. See the difference before trying another question.</Text><View style={s.compareRow}><Card style={s.compareCard}><Pill label="Parliament" /><Text style={[typography.h3, { marginTop: 12 }]}>Makes & scrutinises</Text><Text style={s.compareText}>• MPs + House of Lords{`\n`}• Debates legislation{`\n`}• Holds government accountable</Text></Card><Card style={s.compareCard}><Pill label="Government" tone="success" /><Text style={[typography.h3, { marginTop: 12 }]}>Runs the country</Text><Text style={s.compareText}>• Led by Prime Minister{`\n`}• Implements policy{`\n`}• Operates departments</Text></Card></View><Card tone="soft"><Text style={typography.body}>Parliament checks the Government. The Government is accountable to Parliament.</Text></Card><Button label="Check understanding" onPress={() => navigate('recall')} /><TextAction label="Save for later" /></Shell>;
}

function Recall({ navigate, goBack }: Props) {
  const [revealed, setRevealed] = useState(false);
  return <Shell tab="learn" navigate={navigate}><Header title="Quick recall" eyebrow="Magna Carta · 3 min" onBack={goBack} /><Text style={typography.h1}>What principle is Magna Carta commonly associated with?</Text><Card style={s.recallCard}>{revealed ? <><Pill label="Answer" tone="success" /><Text style={[typography.h2, { marginTop: 12 }]}>The law applies to rulers too.</Text><Text style={[typography.muted, { marginTop: 8 }]}>It is an important historical symbol of limits on arbitrary power and the rule of law.</Text></> : <Text style={s.recallPrompt}>Try to answer in your own words before revealing.</Text>}</Card>{!revealed ? <Button label="Reveal answer" onPress={() => setRevealed(true)} /> : <View style={s.twoButtons}><View style={{ flex: 1 }}><Button label="Got it" onPress={() => navigate('question')} /></View><View style={{ flex: 1 }}><Button secondary label="Didn’t know" onPress={() => navigate('learn-concept')} /></View></View>}</Shell>;
}

function Question({ navigate, goBack }: Props) {
  const [answer, setAnswer] = useState<string>();
  return <Shell tab="learn" navigate={navigate}><Header title="Practice" eyebrow="Unseen wording" onBack={goBack} /><Pill label="Government" /><Text style={[typography.h1, s.learningTitle]}>Which statement best describes the relationship between Parliament and Government?</Text>{['Parliament implements policy for Government', 'Government scrutinises Parliament', 'Parliament can hold Government accountable', 'They are the same institution'].map(x => <Option key={x} label={x} selected={answer === x} onPress={() => setAnswer(x)} />)}<Button label="Check answer" disabled={!answer} onPress={() => navigate('answer-explanation')} /></Shell>;
}

function AnswerExplanation({ navigate, goBack }: Props) {
  return <Shell tab="learn" navigate={navigate}><Header title="Understand the answer" eyebrow="Not quite" onBack={goBack} /><Card tone="warning"><Pill label="Concept confusion" tone="warning" /><Text style={[typography.h2, { marginTop: 12 }]}>Parliament holds Government accountable.</Text><Text style={[typography.muted, { marginTop: 8 }]}>You chose an answer that reversed the relationship. Government runs departments and policy; Parliament debates, legislates and scrutinises.</Text></Card><Section title="Why this matters"><Card><Text style={typography.body}>When wording changes, ask: “Who is checking whom?” That anchors the underlying concept rather than the exact sentence.</Text></Card></Section><Button label="Understand the difference" onPress={() => navigate('compare-concepts')} /><Button secondary label="Try an unseen question" onPress={() => navigate('session-complete')} /></Shell>;
}

function SessionComplete({ navigate, goBack }: Props) {
  return <Shell tab="learn" navigate={navigate}><Header title="Done for today" eyebrow="Session complete" onBack={goBack} /><View style={s.completeMark}><Text style={s.completeMarkText}>✓</Text></View><Text style={[typography.h1, { textAlign: 'center' }]}>Good stopping point</Text><Text style={[typography.muted, { textAlign: 'center', marginTop: 8 }]}>You’ve done enough useful work for this session.</Text><Card style={{ marginTop: 24 }}><View style={s.metrics}><Metric value="14 min" label="Studied" /><Metric value="4" label="Concepts" /><Metric value="+5%" label="Readiness" /></View></Card><Button label="Finish" onPress={() => navigate('home')} /><TextAction label="Keep practicing" onPress={() => navigate('question')} /></Shell>;
}

function ProgressOverview({ navigate }: Props) {
  return <Shell tab="progress" navigate={navigate}><Header title="Progress" eyebrow="Your mastery" /><ReadinessCard score={68} confidence="High" compact /><Section title="Needs attention"><Card>{domains.filter(x => x.weak > 0).map(d => <ListRow key={d.name} title={d.name} meta={`${d.weak} concepts need attention`} trailing={`${d.score}%`} onPress={() => navigate('domain-detail')} />)}</Card></Section><Section title="Strong"><Card><ListRow title="Culture & traditions" meta="Stable retention" trailing="91%" /><ListRow title="Rights & responsibilities" meta="1 light review due" trailing="82%" /></Card></Section></Shell>;
}

function DomainDetail({ navigate, goBack }: Props) {
  return <Shell tab="progress" navigate={navigate}><Header title="Government" eyebrow="61% mastery" onBack={goBack} /><ProgressBar value={61} label="Effective mastery" valueLabel="61%" /><Section title="Priority concepts"><Card><ListRow title="Parliament vs Government" meta="Misconception detected" trailing="High" onPress={() => navigate('concept-detail')} /><ListRow title="General elections" meta="Low retention" trailing="Medium" onPress={() => navigate('concept-detail')} /><ListRow title="Devolved government" meta="Low confidence" trailing="Medium" onPress={() => navigate('concept-detail')} /></Card></Section><Section title="Evidence"><Card><View style={s.metrics}><Metric value="14" label="Questions" /><Metric value="8" label="Variants" /><Metric value="5d" label="Last recall" /></View></Card></Section></Shell>;
}

function ConceptDetail({ navigate, goBack }: Props) {
  return <Shell tab="progress" navigate={navigate}><Header title="Parliament vs Government" eyebrow="Concept detail" onBack={goBack} /><Card><View style={s.metrics}><Metric value="54%" label="Mastery" /><Metric value="High" label="Confidence" /><Metric value="71%" label="Retention" /></View></Card><Section title="What we see"><Card tone="warning"><Text style={typography.h3}>Common confusion</Text><Text style={[typography.muted, { marginTop: 7 }]}>You sometimes reverse which institution scrutinises the other, especially with unfamiliar wording.</Text></Card></Section><Section title="Evidence history"><Card><ListRow title="Unseen variant" meta="Today" trailing="Incorrect" /><ListRow title="Delayed recall" meta="3 days ago" trailing="Correct" /><ListRow title="Compare check" meta="5 days ago" trailing="Correct" /></Card></Section><Button label="Strengthen this concept" onPress={() => navigate('compare-concepts')} /></Shell>;
}

function MockIntro({ navigate, goBack }: Props) {
  return <Shell navigate={navigate}><Header title="Mock test" eyebrow="Exam simulation" onBack={goBack} /><Card><Text style={typography.h1}>24 questions · 45 minutes</Text><Text style={[typography.muted, { marginTop: 10 }]}>No hints, explanations or live correctness. Review your answers before submitting.</Text></Card><Section title="Before you start"><Card><Bullet>Choose the best answer for every question.</Bullet><Bullet>You can flag questions and review them later.</Bullet><Bullet>Your mock score and readiness are reported separately.</Bullet></Card></Section><Card tone="soft"><Text style={typography.body}>Targeted study would currently give you slightly more value, but you can take a mock whenever you choose.</Text></Card><Button label="Start mock" onPress={() => navigate('mock-question')} /></Shell>;
}

function MockQuestion({ navigate, goBack }: Props) {
  const [answer, setAnswer] = useState<string>();
  return <Shell navigate={navigate}><Header title="Mock test" eyebrow="Question 7 of 24 · 34:18 left" onBack={goBack} /><ProgressBar value={7} max={24} /><Text style={[typography.h1, s.questionSpace]}>Which two Houses make up the UK Parliament?</Text>{['Commons and Senate', 'Commons and Lords', 'Lords and Cabinet', 'Cabinet and Commons'].map(x => <Option key={x} label={x} selected={answer === x} onPress={() => setAnswer(x)} />)}<View style={s.twoButtons}><View style={{ flex: 1 }}><Button secondary label="Flag" /></View><View style={{ flex: 1 }}><Button label="Next" disabled={!answer} onPress={() => navigate('mock-review')} /></View></View></Shell>;
}

function MockReview({ navigate, goBack }: Props) {
  return <Shell navigate={navigate}><Header title="Review answers" eyebrow="24 of 24 answered" onBack={goBack} /><Card><View style={s.metrics}><Metric value="24" label="Answered" /><Metric value="2" label="Flagged" /><Metric value="11:04" label="Time left" /></View></Card><Section title="Questions"><Card>{Array.from({ length: 6 }).map((_, i) => <ListRow key={i} title={`Question ${i + 1}`} meta={i === 2 || i === 5 ? 'Flagged for review' : 'Answered'} trailing={i === 2 || i === 5 ? '!' : '✓'} />)}</Card></Section><Button label="Submit mock" onPress={() => navigate('mock-result')} /></Shell>;
}

function MockResult({ navigate, goBack }: Props) {
  return <Shell navigate={navigate}><Header title="Mock result" eyebrow="Completed" onBack={goBack} /><Card tone="success"><Pill label="Passed" tone="success" /><Text style={[typography.display, { marginTop: 10 }]}>20 / 24</Text><Text style={typography.muted}>83% raw score</Text></Card><Section title="Readiness"><ReadinessCard score={78} confidence="High" compact /></Section><Card tone="soft"><Text style={typography.h3}>Why readiness is lower than your mock score</Text><Text style={[typography.muted, { marginTop: 7 }]}>Your history knowledge still has a few low-retention concepts, so one good mock is not enough evidence yet.</Text></Card><Section title="Fix first"><Card><ListRow title="Early British history" meta="2 weak concepts" onPress={() => navigate('domain-detail')} /><ListRow title="Parliament vs Government" meta="Unseen wording" onPress={() => navigate('compare-concepts')} /></Card></Section><Button label="Fix weak areas" onPress={() => navigate('today-plan')} /></Shell>;
}

function PassReady({ navigate }: Props) {
  return <Shell tab="home" navigate={navigate}><View style={s.topBrand}><BrandMark /><Text style={s.days}>7 days until test</Text></View><Card tone="success"><Pill label="PASS READY ✓" tone="success" /><Text style={[typography.display, { marginTop: 12 }]}>91%</Text><Text style={typography.h3}>You’re prepared.</Text><Text style={[typography.muted, { marginTop: 8 }]}>Based on demonstrated knowledge, retention and mock performance.</Text></Card><Section title="Evidence"><Card><View style={s.metrics}><Metric value="High" label="Coverage confidence" /><Metric value="4" label="Mocks passed" /><Metric value="0" label="Critical weaknesses" /></View></Card></Section><Card tone="soft"><Text style={typography.h3}>Until your exam</Text><Text style={[typography.muted, { marginTop: 7 }]}>We’ll keep your knowledge fresh with short reviews only when retention needs attention.</Text></Card><Button label="Keep me ready" onPress={() => navigate('maintenance-review')} /><TextAction label="View progress" onPress={() => navigate('progress-overview')} /></Shell>;
}

function MaintenanceReview({ navigate, goBack }: Props) {
  return <Shell tab="learn" navigate={navigate}><Header title="Keep me ready" eyebrow="Maintenance" onBack={goBack} /><Card tone="success"><Text style={typography.h2}>No study needed today</Text><Text style={[typography.muted, { marginTop: 7 }]}>Your retention is stable and no critical concept is due for review.</Text></Card><Section title="Next check"><Card><ListRow title="Government recall" meta="Expected in 2 days" trailing="2 min" /><ListRow title="History refresh" meta="Expected in 4 days" trailing="3 min" /></Card></Section><Text style={s.centerNote}>CitizenAI will only ask you to study when there is useful work to do.</Text><Button secondary label="Practice anyway" onPress={() => navigate('question')} /></Shell>;
}

function ExamCountdown({ navigate, goBack }: Props) {
  return <Shell tab="home" navigate={navigate}><Header title="3 days to go" eyebrow="Exam countdown" onBack={goBack} /><ReadinessCard score={92} confidence="High" compact /><Section title="Today"><Card><ListRow title="High-risk recall" meta="Government · History" trailing="5 min" /><ListRow title="Short confidence mock" meta="Optional" trailing="12 min" /></Card></Section><Card tone="soft"><Text style={typography.h3}>Avoid cramming</Text><Text style={[typography.muted, { marginTop: 7 }]}>Your evidence is strong. Short recall is more useful now than long study sessions.</Text></Card><Button label="Start 5-minute refresh" onPress={() => navigate('recall')} /><TextAction label="Preview test day" onPress={() => navigate('exam-day')} /></Shell>;
}

function ExamDay({ navigate, goBack }: Props) {
  return <Shell tab="home" navigate={navigate}><Header title="Test day" eyebrow="You’re ready" onBack={goBack} /><Card tone="success"><Text style={typography.h1}>Keep it simple today.</Text><Text style={[typography.muted, { marginTop: 8 }]}>No new learning. Use the optional confidence refresh only if it helps you feel settled.</Text></Card><Section title="Before you leave"><Card><Bullet>Follow the identification and arrival instructions from your official booking.</Bullet><Bullet>Give yourself enough travel time.</Bullet><Bullet>Read each question carefully before choosing.</Bullet></Card></Section><Button label="Optional 5-minute refresh" onPress={() => navigate('recall')} /><TextAction label="I’ve finished my test" onPress={() => navigate('exam-result')} /></Shell>;
}

function ExamResult({ navigate, goBack }: Props) {
  return <Shell navigate={navigate}><Header title="How did it go?" eyebrow="After your test" onBack={goBack} /><Text style={typography.muted}>Your answer helps CitizenAI recalibrate. You choose whether any result is shared anonymously for model evaluation.</Text><View style={s.outcomeGrid}><Pressable style={s.outcomeCard} onPress={() => navigate('passed')}><Text style={s.outcomeIcon}>✓</Text><Text style={typography.h2}>Passed</Text></Pressable><Pressable style={s.outcomeCard} onPress={() => navigate('failed')}><Text style={s.outcomeIcon}>↻</Text><Text style={typography.h2}>Didn’t pass</Text></Pressable></View><Button secondary label="My test was rescheduled" onPress={() => navigate('profile')} /></Shell>;
}

function Passed({ navigate, goBack }: Props) {
  const [consent, setConsent] = useState(false);
  return <Shell navigate={navigate}><Header title="Congratulations" eyebrow="Outcome" onBack={goBack} /><View style={s.completeMark}><Text style={s.completeMarkText}>✓</Text></View><Text style={[typography.h1, { textAlign: 'center' }]}>You passed.</Text><Text style={[typography.muted, { textAlign: 'center', marginTop: 8 }]}>Your preparation journey is complete.</Text><Card style={{ marginTop: 24 }}><Pressable onPress={() => setConsent(!consent)} style={s.checkRow}><View style={[s.checkbox, consent && s.checkboxOn]}>{consent ? <Text style={s.checkText}>✓</Text> : null}</View><View style={{ flex: 1 }}><Text style={s.listStrong}>Share my result anonymously</Text><Text style={s.fieldHint}>Used only to evaluate and calibrate readiness estimates.</Text></View></Pressable></Card><Button label="Finish" onPress={() => navigate('home')} /></Shell>;
}

function Failed({ navigate, goBack }: Props) {
  const [reason, setReason] = useState<string>();
  return <Shell navigate={navigate}><Header title="We’ll recalibrate" eyebrow="Outcome" onBack={goBack} /><Text style={typography.h1}>What felt different?</Text><Text style={[typography.muted, { marginTop: 8 }]}>This does not assume the readiness estimate was correct. Your feedback helps rebuild the plan.</Text><Section title="Optional"><Card>{['Questions felt harder', 'Topics felt unfamiliar', 'Timing was difficult', 'Wording was confusing'].map(x => <Option key={x} label={x} selected={reason === x} onPress={() => setReason(x)} />)}</Card></Section><Button label="Build a new plan" onPress={() => navigate('diagnostic')} /><TextAction label="Skip for now" onPress={() => navigate('home')} /></Shell>;
}

function Profile({ navigate }: Props) {
  return <Shell tab="profile" navigate={navigate}><Header title="Profile & settings" eyebrow="CitizenAI" /><Section title="Test"><Card><ListRow title="Exam date" meta="14 September 2026" trailing="Edit" /><ListRow title="Country pack" meta="United Kingdom" trailing="UK" /><ListRow title="Explanation language" meta="English" trailing="Edit" /></Card></Section><Section title="Preferences"><Card><ListRow title="Study reminders" meta="Short, readiness-based reminders" trailing="On" /><ListRow title="Outcome sharing" meta="Anonymous calibration data" trailing="Off" /></Card></Section><Section title="Trust"><Card><ListRow title="Sources & content version" meta="See where facts come from" onPress={() => navigate('source-info')} /><ListRow title="Readiness methodology" meta="Estimated readiness, never a guarantee" onPress={() => navigate('progress-overview')} /></Card></Section></Shell>;
}

function SourceInfo({ navigate, goBack }: Props) {
  return <Shell tab="profile" navigate={navigate}><Header title="Sources & version" eyebrow="Verified intelligence" onBack={goBack} /><Card tone="soft"><Text style={typography.h2}>UK Knowledge Pack</Text><Text style={[typography.muted, { marginTop: 7 }]}>Version 2026.09 · Independently authored from approved public-authority evidence.</Text></Card><Section title="Verification"><Card><View style={s.metrics}><Metric value="24" label="Sources" /><Metric value="684" label="Facts" /><Metric value="1,486" label="Questions" /></View></Card></Section><Section title="Content rules"><Card><Bullet>Canonical facts require approved evidence.</Bullet><Bullet>AI may propose wording, but cannot publish facts or answers.</Bullet><Bullet>Every production question preserves fact and source provenance.</Bullet></Card></Section><Section title="Recent checks"><Card><ListRow title="UK Parliament" meta="Verified today" trailing="Current" /><ListRow title="GOV.UK citizenship guidance" meta="Verified today" trailing="Current" /><ListRow title="Public authority history sources" meta="No material change" trailing="Current" /></Card></Section></Shell>;
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
  shell: { flex: 1 }, section: { marginTop: 24, gap: 10 }, sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, heroTop: { gap: 20, marginBottom: 26 }, heroMark: { marginTop: 28, width: 72, height: 72, borderRadius: 24, backgroundColor: theme.color.primarySoft, alignItems: 'center', justifyContent: 'center' }, heroMarkText: { fontSize: 34, color: theme.color.primary, fontWeight: '800' }, bottomActions: { marginTop: 'auto', paddingTop: 24 }, trust: { textAlign: 'center', color: theme.color.textMuted, fontSize: 11, lineHeight: 16, marginTop: 6 }, bulletRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', marginVertical: 7 }, dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: theme.color.primary, marginTop: 9 }, fieldLabel: { color: theme.color.textMuted, fontSize: 12, fontWeight: '700', marginBottom: 7 }, fieldHint: { color: theme.color.textMuted, fontSize: 12, lineHeight: 17 }, input: { minHeight: 48, borderRadius: 14, borderWidth: 1, borderColor: theme.color.border, paddingHorizontal: 14, color: theme.color.text, fontSize: 15, backgroundColor: theme.color.background }, option: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56, borderWidth: 1, borderColor: theme.color.border, backgroundColor: theme.color.surface, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10, marginTop: 9 }, optionSelected: { borderColor: theme.color.primary, backgroundColor: theme.color.primarySoft }, radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: theme.color.border, alignItems: 'center', justifyContent: 'center' }, radioSelected: { borderColor: theme.color.primary }, radioCore: { width: 10, height: 10, borderRadius: 5, backgroundColor: theme.color.primary }, optionText: { fontSize: 15, color: theme.color.text, flex: 1 }, questionSpace: { marginTop: 26, gap: 16 }, domainLine: { marginBottom: 15 }, metrics: { flexDirection: 'row', gap: 10 }, topBrand: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }, days: { color: theme.color.textMuted, fontSize: 12, fontWeight: '600' }, quickRow: { flexDirection: 'row', gap: 8, marginTop: 12 }, quick: { flex: 1, backgroundColor: theme.color.surface, borderWidth: 1, borderColor: theme.color.border, borderRadius: 16, padding: 12, minHeight: 72 }, quickTitle: { fontSize: 12, color: theme.color.text, fontWeight: '700' }, quickMeta: { fontSize: 10, color: theme.color.textMuted, marginTop: 5 }, centerNote: { textAlign: 'center', color: theme.color.textMuted, fontSize: 12, marginVertical: 16 }, learningTitle: { marginTop: 18, marginBottom: 18 }, compareRow: { flexDirection: 'row', gap: 10, marginVertical: 20 }, compareCard: { flex: 1, padding: 15 }, compareText: { color: theme.color.textMuted, fontSize: 13, lineHeight: 22, marginTop: 8 }, recallCard: { minHeight: 190, marginTop: 24, justifyContent: 'center' }, recallPrompt: { fontSize: 18, lineHeight: 27, color: theme.color.textMuted, textAlign: 'center' }, twoButtons: { flexDirection: 'row', gap: 10, alignItems: 'flex-end' }, completeMark: { width: 78, height: 78, borderRadius: 39, backgroundColor: theme.color.successSoft, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginTop: 32, marginBottom: 20 }, completeMarkText: { color: theme.color.success, fontSize: 38, fontWeight: '800' }, outcomeGrid: { flexDirection: 'row', gap: 12, marginTop: 28, marginBottom: 18 }, outcomeCard: { flex: 1, minHeight: 150, borderRadius: 22, borderWidth: 1, borderColor: theme.color.border, backgroundColor: theme.color.surface, alignItems: 'center', justifyContent: 'center', gap: 10 }, outcomeIcon: { fontSize: 32, color: theme.color.primary, fontWeight: '800' }, checkRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' }, checkbox: { width: 24, height: 24, borderRadius: 7, borderWidth: 1.5, borderColor: theme.color.border, alignItems: 'center', justifyContent: 'center' }, checkboxOn: { backgroundColor: theme.color.primary, borderColor: theme.color.primary }, checkText: { color: theme.color.white, fontWeight: '800' }, listStrong: { color: theme.color.text, fontSize: 14, fontWeight: '700' }
});
