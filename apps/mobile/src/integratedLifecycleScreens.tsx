import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppHeader, AppIcon, BottomTabs, Button, Card, IconTile, ListRow, Pill, ProgressBar, ProgressRing, SummaryMetric, TextAction, typography } from './components';
import { Navigator, ScreenId } from './model';
import { useCitizenAI } from './runtime';
import { theme } from './theme';

type Props = { navigate: Navigator; goBack: () => void };
type ScreenMap = Partial<Record<ScreenId, React.ComponentType<Props>>>;

function MockIntro({ navigate, goBack }: Props) {
  const rt = useCitizenAI();
  return <View style={s.screen}><AppHeader onBack={goBack} days={`${rt.daysUntilExam} days until test`} /><Text style={typography.h1}>Mock test</Text><Card tone="soft"><Text style={s.heroMetric}>24</Text><Text style={s.heroTitle}>questions · 45 minutes</Text><Text style={s.copy}>No hints, explanations or live correctness. Your mock score and readiness remain separate signals.</Text></Card><Card><ListRow title="Exam-format length" trailing="24 questions" icon="clipboard-outline" /><ListRow title="Time limit" trailing="45 min" icon="time-outline" /><ListRow title="Pass mark" trailing="75%" icon="checkmark-circle-outline" hideDivider /></Card><Button label="Start mock" onPress={() => { rt.startMock(); navigate('mock-question'); }} /></View>;
}

function MockQuestion({ navigate, goBack }: Props) {
  const rt = useCitizenAI();
  const q = rt.currentMockQuestion;
  const [selected, setSelected] = useState<string | null>(null);
  if (!q) return <View style={s.screen}><AppHeader onBack={goBack} /><Text style={typography.h1}>Mock not started</Text><Button label="Start mock" onPress={() => { rt.startMock(); }} /></View>;
  const index = rt.mock?.questions?.findIndex((x: any) => x.id === q.id) ?? 0;
  const isLast = index >= 23;
  return <View style={s.screen}><AppHeader onBack={goBack} /><View style={s.rowBetween}><Text style={s.label}>Question {index + 1} of 24</Text><Text style={s.meta}>45 min max</Text></View><ProgressBar value={index + 1} max={24} /><Text style={[typography.h1, { marginTop: 12 }]}>{q.stem}</Text><View accessibilityRole="radiogroup" style={s.options}>{q.options.map((o: any) => <Pressable accessibilityRole="radio" accessibilityState={{ selected: selected === o.id }} accessibilityLabel={o.text} key={o.id} onPress={() => setSelected(o.id)} style={({ pressed }) => [s.option, selected === o.id && s.optionSelected, pressed && s.pressed]}><View style={[s.radio, selected === o.id && s.radioSelected]} /><Text style={s.optionText}>{o.text}</Text></Pressable>)}</View><Button label={isLast ? 'Review answers' : 'Next'} disabled={!selected} onPress={() => { if (!selected) return; rt.answerMock(selected); setSelected(null); if (isLast) navigate('mock-review'); }} /></View>;
}

function MockReview({ navigate, goBack }: Props) {
  const rt = useCitizenAI();
  const answered = rt.mock?.answers?.length ?? 0;
  return <View style={s.screen}><AppHeader onBack={goBack} /><Text style={typography.h1}>Review answers</Text><Card><View style={s.metrics}><SummaryMetric icon="checkmark-circle-outline" label="Answered" value={`${answered}`} /><SummaryMetric icon="flag-outline" tone="teal" label="Remaining" value={`${24 - answered}`} /></View></Card><Text style={s.copy}>Submit when you are ready. No correctness is shown until the mock ends.</Text><Button label="Submit mock" disabled={answered < 24} onPress={() => { rt.finishMock(); navigate('mock-result'); }} /><Button secondary label="Return to questions" onPress={() => navigate('mock-question')} /></View>;
}

function MockResult({ navigate, goBack }: Props) {
  const rt = useCitizenAI();
  const result = rt.lastMockResult;
  if (!result) return <View style={s.screen}><AppHeader onBack={goBack} /><Text style={typography.h1}>No completed mock</Text><Button label="Take a mock" onPress={() => navigate('mock-intro')} /></View>;
  return <View style={s.screen}><AppHeader onBack={goBack} /><Card tone={result.passed ? 'success' : 'warning'}><Pill label={result.passed ? 'Passed' : 'Below pass mark'} tone={result.passed ? 'success' : 'warning'} /><Text style={s.score}>{result.correct} / 24</Text><Text style={s.heroTitle}>{Math.round(result.score * 100)}% raw score</Text></Card><Card><Text style={s.cardTitle}>Estimated readiness</Text><View style={s.readinessRow}><ProgressRing score={rt.readinessScore} label={rt.readinessStatus} size={130} stroke={7} /><View style={s.readinessCopy}><Text style={s.copy}>Readiness uses mastery, retention, diversity and coverage—not this one mock alone.</Text><Text style={s.confidence}>{Math.round(rt.readinessConfidence * 100)}% coverage confidence</Text></View></View></Card><Button label="Fix weak areas" onPress={() => navigate('today-plan')} /><TextAction label="View full progress" onPress={() => navigate('progress-overview')} /></View>;
}

function PassReady({ navigate }: Props) {
  const rt = useCitizenAI();
  const visual = rt.visualDemo;
  const score = visual ? 91 : rt.readinessScore;
  const mocks = visual ? 4 : rt.mocksPassed;
  const weak = visual ? 0 : rt.criticalWeakConcepts;
  const confidence = visual ? 0.91 : rt.readinessConfidence;
  const unlocked = visual || rt.passReady;
  return <View style={s.screen}><AppHeader days={`${rt.daysUntilExam} days until test`} /><Card style={s.passHero}><ProgressRing score={score} label={unlocked ? 'Pass Ready' : 'Building'} size={140} stroke={8} color={unlocked ? theme.color.success : theme.color.primary} /><View style={s.passCopy}><IconTile name={unlocked ? 'shield-checkmark' : 'shield-outline'} tone={unlocked ? 'teal' : 'blue'} size={50} iconSize={27} /><View style={s.passTitleRow}><Text style={s.passTitle}>{unlocked ? 'Pass Ready' : 'Keep Building'}</Text>{unlocked ? <AppIcon name="checkmark" size={24} color={theme.color.tealDark} /> : null}</View><Text style={s.copy}>{unlocked ? 'Based on demonstrated knowledge, retention and mock performance, you’re prepared.' : 'CitizenAI will unlock Pass Ready only when readiness, coverage, mocks and critical weaknesses all meet the gate.'}</Text></View></Card><Card><Text style={s.cardTitle}>Your readiness summary</Text><View style={s.metrics}><SummaryMetric icon="shield-checkmark-outline" tone="teal" label={'Coverage\nconfidence'} value={`${Math.round(confidence * 100)}%`} valueTone="teal" /><SummaryMetric icon="clipboard-outline" label={'Mocks\npassed'} value={`${mocks}`} /><SummaryMetric icon="locate-outline" tone="teal" label={'Critical weak\nconcepts'} value={`${weak}`} valueTone={weak === 0 ? 'teal' : undefined} /></View></Card><Pressable accessibilityRole="button" accessibilityLabel="Until your exam" style={({ pressed }) => [s.untilCard, pressed && s.pressed]} onPress={() => navigate('exam-countdown')}><IconTile name="calendar-outline" size={46} iconSize={24} /><View style={s.untilCopy}><Text style={s.untilTitle}>Until your exam</Text><Text style={s.copy}>Maintenance mode uses retention risk to decide whether any study is useful.</Text></View><AppIcon name="chevron-forward" size={21} color={theme.color.textSoft} /></Pressable><Button label={unlocked ? 'Keep me ready' : 'Continue my plan'} onPress={() => navigate(unlocked ? 'maintenance-review' : 'today-plan')} /><TextAction label="View progress" onPress={() => navigate('progress-overview')} /><BottomTabs active="progress" navigate={navigate} /></View>;
}

function MaintenanceReview({ navigate, goBack }: Props) {
  const rt = useCitizenAI();
  const state = String(rt.maintenance?.state ?? 'maintenance').replaceAll('_', ' ');
  const activities = rt.maintenance?.activities ?? [];
  return <View style={s.screen}><AppHeader onBack={goBack} days={`${rt.daysUntilExam} days until test`} /><Text style={typography.h1}>Keep me ready</Text><Card tone={activities.length === 0 ? 'success' : 'soft'}><Text style={s.heroTitle}>{activities.length === 0 ? 'No study needed today' : state}</Text><Text style={s.copy}>{activities.length === 0 ? 'Your current retention signals do not justify extra work.' : 'Only concepts at genuine retention risk are included.'}</Text></Card>{activities.length ? <Card>{activities.map((a: any, i: number) => <ListRow key={`${a.conceptId}-${i}`} title={a.conceptId.replaceAll('-', ' ')} trailing={`${a.minutes} min`} icon="refresh-outline" hideDivider={i === activities.length - 1} />)}</Card> : null}<Button secondary label="Practice anyway" onPress={() => navigate('question')} /><BottomTabs active="learn" navigate={navigate} /></View>;
}

function ExamCountdown({ navigate, goBack }: Props) {
  const rt = useCitizenAI();
  return <View style={s.screen}><AppHeader onBack={goBack} days={`${rt.daysUntilExam} days until test`} /><Text style={typography.h1}>{rt.daysUntilExam} days to go</Text><Card tone="soft" style={s.countdownCard}><ProgressRing score={rt.readinessScore} label={rt.readinessStatus} size={135} stroke={7} /><Text style={[s.copy, s.centerCopy]}>The closer you get to test day, the engine reduces volume and prioritises retention.</Text></Card><Card><ListRow title="Maintenance state" trailing={String(rt.maintenance?.state ?? '').replaceAll('_', ' ')} icon="pulse-outline" /><ListRow title="Recommended activities" trailing={`${rt.maintenance?.activities?.length ?? 0}`} icon="list-outline" hideDivider /></Card><Button label="Start recommended refresh" onPress={() => navigate(rt.maintenance?.activities?.length ? 'recall' : 'home')} /><TextAction label="Preview test day" onPress={() => navigate('exam-day')} /><BottomTabs active="home" navigate={navigate} /></View>;
}

function ExamDay({ navigate, goBack }: Props) {
  const rt = useCitizenAI();
  return <View style={s.screen}><AppHeader onBack={goBack} days="Test day" /><Card tone="success"><Text style={typography.h1}>Keep it simple today.</Text><Text style={s.copy}>No new learning. The engine allows only optional short recall if a retention signal genuinely needs attention.</Text></Card><Card><ListRow title="Read each question carefully" icon="eye-outline" /><ListRow title="Use your official booking instructions" icon="document-text-outline" /><ListRow title="Avoid last-minute cramming" icon="moon-outline" hideDivider /></Card><Button label="Optional short refresh" onPress={() => navigate('recall')} /><TextAction label="I’ve finished my test" onPress={() => navigate('exam-result')} /><BottomTabs active="home" navigate={navigate} /></View>;
}

function ExamResult({ navigate, goBack }: Props) {
  const rt = useCitizenAI();
  return <View style={s.screen}><AppHeader onBack={goBack} /><Text style={typography.h1}>How did it go?</Text><Text style={s.copy}>Your outcome can help evaluate readiness calibration. Sharing for calibration is always optional.</Text><View style={s.outcomeRow}><Pressable accessibilityRole="button" accessibilityLabel="Passed" style={({ pressed }) => [s.outcome, pressed && s.pressed]} onPress={() => { rt.saveExamOutcome('passed'); navigate('passed'); }}><IconTile name="checkmark" tone="teal" size={58} iconSize={30} /><Text style={s.outcomeTitle}>Passed</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Did not pass" style={({ pressed }) => [s.outcome, pressed && s.pressed]} onPress={() => { rt.saveExamOutcome('failed'); navigate('failed'); }}><IconTile name="refresh" size={58} iconSize={30} /><Text style={s.outcomeTitle}>Didn’t pass</Text></Pressable></View><Button secondary label="My test was rescheduled" onPress={() => { rt.saveExamOutcome('rescheduled'); navigate('profile'); }} /></View>;
}

function Passed({ navigate, goBack }: Props) {
  const rt = useCitizenAI();
  const [consent, setConsent] = useState(false);
  return <View style={s.screen}><AppHeader onBack={goBack} /><View style={s.center}><IconTile name="checkmark" tone="teal" size={76} iconSize={38} /><Text style={typography.h1}>You passed.</Text><Text style={s.copy}>Your preparation journey is complete.</Text></View><Pressable accessibilityRole="checkbox" accessibilityState={{ checked: consent }} accessibilityLabel="Share my result anonymously" style={({ pressed }) => [s.consent, pressed && s.pressed]} onPress={() => { const next = !consent; setConsent(next); rt.saveExamOutcome('passed', next); }}><View style={[s.checkbox, consent && s.checkboxOn]}>{consent ? <AppIcon name="checkmark" size={16} color="#fff" /> : null}</View><View style={s.consentCopy}><Text style={s.consentTitle}>Share my result anonymously</Text><Text style={s.meta}>Used only to evaluate and calibrate readiness estimates.</Text></View></Pressable><Button label="Finish" onPress={() => navigate('home')} /></View>;
}

function Failed({ navigate, goBack }: Props) {
  const rt = useCitizenAI();
  const [reason, setReason] = useState<string | null>(null);
  const options: Record<string, Record<string, boolean>> = {
    harder: { harderThanExpected: true }, unfamiliar: { unfamiliarTopics: true }, timing: { timePressure: true }, wording: { wordingDifferent: true }
  };
  return <View style={s.screen}><AppHeader onBack={goBack} /><Text style={typography.h1}>We’ll recalibrate</Text><Text style={s.copy}>The app should treat the real outcome as stronger evidence than its own prediction.</Text><Card>{[['harder','Questions felt harder'],['unfamiliar','Topics felt unfamiliar'],['timing','Timing was difficult'],['wording','Wording was confusing']].map(([id,label], i, all) => <ListRow key={id} title={label} trailing={reason === id ? 'Selected' : ''} icon={reason === id ? 'checkmark-circle' : 'ellipse-outline'} onPress={() => setReason(id)} hideDivider={i === all.length - 1} />)}</Card><Button label="Build a new plan" onPress={() => { rt.saveExamOutcome('failed', false, reason ? options[reason] : {}); rt.resetDiagnostic(); navigate('diagnostic'); }} /><TextAction label="Skip for now" onPress={() => navigate('home')} /></View>;
}

function Profile({ navigate }: Props) {
  const rt = useCitizenAI();
  return <View style={s.screen}><AppHeader days={`${rt.daysUntilExam} days until test`} /><Text style={typography.h1}>Profile & settings</Text><Card><ListRow title="Exam date" meta={rt.examDate} trailing="Active" icon="calendar-outline" /><ListRow title="Country pack" meta="United Kingdom" trailing="UK" icon="flag-outline" /><ListRow title="Explanation language" meta={rt.explanationLanguage} trailing="Edit" icon="language-outline" hideDivider /></Card><Card><ListRow title="Readiness methodology" meta="Mastery + retention + Monte Carlo + coverage" trailing={`${rt.readinessScore}%`} icon="analytics-outline" /><ListRow title="Sources & content version" meta="See provenance rules" icon="shield-checkmark-outline" onPress={() => navigate('source-info')} hideDivider /></Card><BottomTabs active="profile" navigate={navigate} /></View>;
}

function SourceInfo({ navigate, goBack }: Props) {
  return <View style={s.screen}><AppHeader onBack={goBack} /><Text style={typography.h1}>Sources & version</Text><Card tone="soft"><Text style={s.cardTitle}>UK Knowledge Pack</Text><Text style={s.copy}>CitizenAI uses the active verified preparation pack with provenance, versioning and explicit coverage limitations. It does not claim official handbook equivalence or a guaranteed pass.</Text></Card><Card><ListRow title="Canonical facts" meta="Approved with evidence and provenance" icon="shield-checkmark-outline" /><ListRow title="Question answers" meta="Resolve to publishable facts" icon="link-outline" /><ListRow title="AI role" meta="May propose wording, never establish facts" icon="sparkles-outline" hideDivider /></Card><Button secondary label="Back to profile" onPress={() => navigate('profile')} /></View>;
}

export const integratedLifecycleScreens: ScreenMap = {
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
  screen: { flex: 1, gap: 12 },
  rowBetween: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  label: { color: theme.color.text, fontSize: 15, lineHeight: 20, fontWeight: '650' },
  meta: { color: theme.color.textMuted, fontSize: 12, lineHeight: 17 },
  copy: { color: theme.color.textMuted, fontSize: 15, lineHeight: 22, marginTop: 7 },
  heroMetric: { color: theme.color.text, fontSize: 48, lineHeight: 52, fontWeight: '700' },
  heroTitle: { color: theme.color.text, fontSize: 20, lineHeight: 26, fontWeight: '700', marginTop: 4 },
  options: { gap: 10 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 60, borderWidth: 1, borderColor: theme.color.border, backgroundColor: theme.color.surface, borderRadius: 18, paddingHorizontal: 16, paddingVertical: 12, ...theme.shadow.soft },
  optionSelected: { borderColor: theme.color.primary, backgroundColor: theme.color.primaryPale },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: theme.color.textSoft },
  radioSelected: { borderColor: theme.color.primary, borderWidth: 5 },
  optionText: { flex: 1, color: theme.color.text, fontSize: 16, lineHeight: 22 },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around', alignItems: 'stretch', gap: 12 },
  score: { color: theme.color.text, fontSize: 48, lineHeight: 54, fontWeight: '700', marginTop: 14 },
  cardTitle: { color: theme.color.text, fontSize: 18, lineHeight: 23, fontWeight: '700' },
  readinessRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 18, marginTop: 8 },
  readinessCopy: { flex: 1, minWidth: 170 },
  confidence: { color: theme.color.tealDark, fontSize: 13, lineHeight: 18, fontWeight: '700', marginTop: 10 },
  passHero: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 16, padding: 18 },
  passCopy: { flex: 1, minWidth: 175 },
  passTitleRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginTop: 8 },
  passTitle: { color: theme.color.text, fontSize: 25, lineHeight: 31, fontWeight: '700' },
  untilCard: { minHeight: 84, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.color.border, borderRadius: theme.radius.lg, backgroundColor: theme.color.glassStrong, padding: 15, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12, ...theme.shadow.soft },
  untilCopy: { flex: 1, minWidth: 190 },
  untilTitle: { color: theme.color.text, fontSize: 16, lineHeight: 21, fontWeight: '700' },
  countdownCard: { alignItems: 'center' },
  centerCopy: { textAlign: 'center', marginTop: 10 },
  outcomeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 14 },
  outcome: { flex: 1, minWidth: 145, minHeight: 150, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.color.border, borderRadius: theme.radius.lg, backgroundColor: theme.color.surface, alignItems: 'center', justifyContent: 'center', gap: 12, ...theme.shadow.soft },
  outcomeTitle: { color: theme.color.text, fontSize: 18, lineHeight: 23, fontWeight: '700' },
  center: { alignItems: 'center', gap: 12, paddingVertical: 28 },
  consent: { minHeight: 72, flexDirection: 'row', gap: 12, alignItems: 'flex-start', padding: 16, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.color.border, borderRadius: theme.radius.lg, backgroundColor: theme.color.surface, ...theme.shadow.soft },
  consentCopy: { flex: 1, minWidth: 190 },
  checkbox: { width: 28, height: 28, borderRadius: 8, borderWidth: 1.5, borderColor: theme.color.borderStrong, alignItems: 'center', justifyContent: 'center' },
  checkboxOn: { backgroundColor: theme.color.primary, borderColor: theme.color.primary },
  consentTitle: { color: theme.color.text, fontSize: 15, lineHeight: 20, fontWeight: '700' },
  pressed: { transform: [{ scale: theme.motion.pressScale }], opacity: 0.95 }
});
