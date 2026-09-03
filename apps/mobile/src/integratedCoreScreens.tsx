import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { AppHeader, AppIcon, BottomTabs, Button, Card, IconTile, ListRow, Pill, ProgressBar, ProgressRing, QuickAction, TextAction, TrustCard, typography } from './components';
import { Navigator, ScreenId } from './model';
import { useCitizenAI, DomainId } from './runtime';
import { theme } from './theme';

type Props = { navigate: Navigator; goBack: () => void };
type ScreenMap = Partial<Record<ScreenId, React.ComponentType<Props>>>;

const domainMeta: Array<{ id: DomainId; name: string; icon: string; teal?: boolean }> = [
  { id: 'government', name: 'Government', icon: 'business-outline' },
  { id: 'history', name: 'History', icon: 'book-outline', teal: true },
  { id: 'rights', name: 'Rights', icon: 'scale-outline' },
  { id: 'culture', name: 'Culture', icon: 'people-outline', teal: true }
];

const activityRoute = (type: string): ScreenId => type === 'compare' ? 'compare-concepts' : type === 'recall' ? 'recall' : type === 'learn' ? 'learn-concept' : 'question';
const activityIcon = (type: string) => type === 'compare' ? 'business-outline' : type === 'recall' ? 'document-text-outline' : type === 'learn' ? 'book-outline' : 'sparkles-outline';

function TestSetup({ navigate, goBack }: Props) {
  const rt = useCitizenAI();
  return <View style={s.screen}>
    <AppHeader onBack={goBack} days={`${rt.daysUntilExam} days until test`} />
    <Text style={typography.h1}>Tell us about your test</Text>
    <Text style={s.intro}>Three details are enough to build your first readiness check.</Text>
    <Text style={s.sectionTitle}>Test date</Text>
    <Card><Text style={s.label}>Exam date</Text><TextInput accessibilityLabel="Exam date" value={rt.examDate} onChangeText={rt.setExamDate} style={s.input} /><Text style={s.hint}>{rt.daysUntilExam} days from today</Text></Card>
    <Text style={s.sectionTitle}>Explanation language</Text>
    <Card><ListRow title={rt.explanationLanguage} meta="Tap to change" trailing="Selected" icon="language-outline" onPress={() => rt.setExplanationLanguage(rt.explanationLanguage === 'English' ? 'Simple English' : 'English')} hideDivider /></Card>
    <Text style={s.sectionTitle}>Previous preparation</Text>
    <Card><View accessibilityRole="radiogroup" style={s.segment}>{['None', 'Some', 'A lot'].map(v => <Pressable accessibilityRole="radio" accessibilityState={{ selected: rt.preparation === v }} accessibilityLabel={`${v} previous preparation`} key={v} style={({ pressed }) => [s.segmentItem, rt.preparation === v && s.segmentSelected, pressed && s.optionPressed]} onPress={() => rt.setPreparation(v)}><Text style={[s.segmentText, rt.preparation === v && s.segmentTextSelected]}>{v}</Text></Pressable>)}</View></Card>
    <Button label="Check my readiness" onPress={() => { rt.resetDiagnostic(); navigate('diagnostic'); }} />
  </View>;
}

function Diagnostic({ navigate, goBack }: Props) {
  const rt = useCitizenAI();
  const [selected, setSelected] = useState<string | null>(null);
  const q = rt.diagnosticQuestion;
  const submit = () => {
    if (!selected) return;
    const done = rt.submitDiagnosticAnswer(selected === '__unknown__' ? null : selected);
    setSelected(null);
    if (done) navigate('diagnostic-result');
  };
  return <View style={s.screen}>
    <AppHeader onBack={goBack} days={`${rt.daysUntilExam} days until test`} />
    <View style={s.progressHead}><Text style={s.progressLabel}>Diagnostic · {rt.diagnosticAnswered + 1} of ~{rt.diagnosticTarget}</Text><ProgressBar value={rt.diagnosticAnswered} max={rt.diagnosticTarget} /></View>
    <Pill label={rt.conceptById(q.conceptId)?.title ?? 'Knowledge'} />
    <Text style={[typography.h1, { marginTop: 12 }]}>{q.stem}</Text>
    <Text style={s.intro}>Choose the best answer. Corrections stay hidden until the diagnostic is complete.</Text>
    <View accessibilityRole="radiogroup" style={s.options}>{q.options.map(option => <Pressable accessibilityRole="radio" accessibilityState={{ selected: selected === option.id }} accessibilityLabel={option.text} key={option.id} onPress={() => setSelected(option.id)} style={({ pressed }) => [s.option, selected === option.id && s.optionSelected, pressed && s.optionPressed]}><View style={[s.radio, selected === option.id && s.radioSelected]} /><Text style={s.optionText}>{option.text}</Text></Pressable>)}</View>
    <TextAction label="I don’t know" onPress={() => setSelected('__unknown__')} />
    <Button label={rt.diagnosticAnswered >= 19 ? 'Finish readiness check' : 'Next question'} disabled={!selected} onPress={submit} />
  </View>;
}

function DiagnosticResult({ navigate, goBack }: Props) {
  const rt = useCitizenAI();
  const visual = rt.visualDemo;
  const score = visual ? 58 : rt.readinessScore;
  const status = visual ? 'Building' : rt.readinessStatus;
  const scores: Record<DomainId, number> = visual ? { government: 41, history: 48, rights: 72, culture: 87 } : rt.domainScores;
  return <View style={s.screen}>
    <AppHeader onBack={goBack} days={`${rt.daysUntilExam} days until test`} />
    <View style={s.resultHero}><View style={s.resultCopyWrap}><Text style={s.resultTitle}>You’re {status}</Text><Text style={s.resultCopy}>{status === 'More evidence needed' ? 'We need a little more evidence before giving you a confident readiness label.' : 'CitizenAI has measured your current strengths and the highest-value gaps to work on next.'}</Text></View><ProgressRing score={score} label="Readiness" size={140} stroke={8} /></View>
    <Card style={s.anchorCard}><Text style={s.cardTitle}>Domain breakdown</Text>{domainMeta.map(d => <View key={d.id} style={s.domainRow}><IconTile name={d.icon} tone={d.teal ? 'teal' : 'blue'} size={40} iconSize={21} /><View style={{ flex: 1 }}><Text style={s.domainName}>{d.name}</Text><ProgressBar value={scores[d.id]} teal={d.teal} /></View><Text style={s.domainScore}>{scores[d.id]}%</Text><AppIcon name="chevron-forward" size={18} color={theme.color.textSoft} /></View>)}</Card>
    <Card style={s.anchorCard}><View style={s.rowBetween}><Text style={s.cardTitle}>Today’s plan</Text><Text style={s.meta}>{rt.studyPlan.durationMinutes} min total</Text></View>{rt.studyPlan.activities.slice(0, 4).map((a, i) => <ListRow key={`${a.conceptId}-${i}`} title={rt.conceptById(a.conceptId)?.title ?? a.conceptId} trailing={`${a.minutes} min`} icon={activityIcon(a.type)} iconTone={i % 2 ? 'teal' : 'blue'} hideDivider={i === Math.min(rt.studyPlan.activities.length, 4) - 1} />)}</Card>
    <Button label="Start my plan" onPress={() => navigate('today-plan')} /><TextAction label="See full breakdown" onPress={() => navigate('progress-overview')} />
  </View>;
}

function Home({ navigate }: Props) {
  const rt = useCitizenAI();
  const visual = rt.visualDemo;
  const score = visual ? 68 : rt.readinessScore;
  const label = visual ? 'Building' : rt.readinessStatus;
  const progressDomains = domainMeta.slice(0, 3);
  return <View style={s.screen}>
    <AppHeader days={`${rt.daysUntilExam} days until test`} />
    <View style={s.homeIntro}><Text style={s.homeGreeting}>Your citizenship journey</Text><Text style={s.homeSub}>Focus on the next best action, not more content.</Text></View>
    <Card style={s.homeHero}><ProgressRing score={score} label={label} size={148} stroke={8} /><View style={s.heroCopy}><Text style={s.heroTitle}>Your readiness</Text><Text style={s.heroDelta}>{visual ? '+7% this week' : `${Math.round(rt.readinessConfidence * 100)}% coverage confidence`}</Text><Text style={s.heroSupport}>{label === 'More evidence needed' ? 'Keep measuring before trusting the score.' : `${Math.max(0, 85 - score)}% to the Pass Ready threshold.`}</Text></View></Card>
    <Button label={`Today’s plan · ${rt.studyPlan.activities.length} activities · ${rt.studyPlan.durationMinutes} min`} onPress={() => navigate('today-plan')} />
    <View style={s.sectionHead}><Text style={s.sectionTitleCompact}>Your progress</Text><TextAction label="View all" onPress={() => navigate('progress-overview')} /></View>
    <Card style={s.progressList}>{progressDomains.map((d, i) => <View key={d.id} style={[s.progressDomain, i === progressDomains.length - 1 && { borderBottomWidth: 0 }]}><IconTile name={d.icon} tone={d.teal ? 'teal' : 'blue'} size={38} iconSize={20} /><View style={{ flex: 1 }}><View style={s.rowBetween}><Text style={s.domainName}>{d.name}</Text><Text style={s.domainScore}>{rt.domainScores[d.id]}%</Text></View><ProgressBar value={rt.domainScores[d.id]} teal={d.teal} /></View></View>)}</Card>
    <Text style={s.sectionTitleCompact}>Quick actions</Text>
    <View style={s.quickRow}><QuickAction icon="book-outline" title="Study" onPress={() => navigate('today-plan')} /><QuickAction icon="flash" tone="teal" title="Practice" onPress={() => navigate('question')} /><QuickAction icon="clipboard-outline" title="Mock Test" onPress={() => navigate('mock-intro')} /><QuickAction icon="git-compare-outline" tone="teal" title="Compare" onPress={() => navigate('compare-concepts')} /></View>
    <TrustCard title="Study only what you need." subtitle="Smart practice. Focused results." />
    <BottomTabs active="home" navigate={navigate} />
  </View>;
}

function TodayPlan({ navigate, goBack }: Props) {
  const rt = useCitizenAI();
  return <View style={s.screen}><AppHeader onBack={goBack} days={`${rt.daysUntilExam} days until test`} /><Text style={typography.h1}>Today’s plan</Text><Text style={s.intro}>Chosen by the study engine for the greatest expected readiness gain in about {rt.studyPlan.durationMinutes} minutes.</Text><Card>{rt.studyPlan.activities.map((a, i) => <ListRow key={`${a.conceptId}-${i}`} title={`${i + 1}. ${rt.conceptById(a.conceptId)?.title ?? a.conceptId}`} meta={`${a.type.replace('_', ' ')} · priority ${Math.round((a as any).priority * 1000) / 1000}`} trailing={`${a.minutes} min`} icon={activityIcon(a.type)} iconTone={i % 2 ? 'teal' : 'blue'} onPress={() => navigate(activityRoute(a.type))} hideDivider={i === rt.studyPlan.activities.length - 1} />)}</Card><Card tone="soft" style={s.note}><IconTile name="checkmark-circle-outline" tone="teal" /><View style={{ flex: 1 }}><Text style={s.noteTitle}>Stop when the plan is done</Text><Text style={s.noteText}>CitizenAI will not add extra study just to keep you in the app.</Text></View></Card><Button label="Start plan" onPress={() => navigate(activityRoute(rt.studyPlan.activities[0]?.type ?? 'question'))} /><BottomTabs active="learn" navigate={navigate} /></View>;
}

function Question({ navigate, goBack }: Props) {
  const rt = useCitizenAI();
  const q = rt.practiceQuestion;
  const [selected, setSelected] = useState<string | null>(null);
  return <View style={s.screen}><AppHeader onBack={goBack} days={`${rt.daysUntilExam} days until test`} /><Pill label={rt.conceptById(q.conceptId)?.title ?? 'Practice'} /><Text style={[typography.h1, { marginTop: 12 }]}>{q.stem}</Text><View accessibilityRole="radiogroup" style={s.options}>{q.options.map(o => <Pressable accessibilityRole="radio" accessibilityState={{ selected: selected === o.id }} accessibilityLabel={o.text} key={o.id} onPress={() => setSelected(o.id)} style={({ pressed }) => [s.option, selected === o.id && s.optionSelected, pressed && s.optionPressed]}><View style={[s.radio, selected === o.id && s.radioSelected]} /><Text style={s.optionText}>{o.text}</Text></Pressable>)}</View><Button label="Check answer" disabled={!selected} onPress={() => { if (selected) { rt.answerPractice(selected); navigate('answer-explanation'); } }} /><BottomTabs active="learn" navigate={navigate} /></View>;
}

function AnswerExplanation({ navigate, goBack }: Props) {
  const rt = useCitizenAI();
  const a = rt.lastAttempt;
  if (!a) return <View style={s.screen}><AppHeader onBack={goBack} /><Text style={typography.h1}>No answer yet</Text><Button label="Try a question" onPress={() => navigate('question')} /></View>;
  const compare = a.remediation?.type === 'compare';
  return <View style={s.screen}><AppHeader onBack={goBack} /><Card tone={a.correct ? 'success' : 'warning'}><Pill label={a.correct ? 'Correct' : 'Not quite'} tone={a.correct ? 'success' : 'warning'} /><Text style={[typography.h2, { marginTop: 12 }]}>{a.question.explanation}</Text><Text style={s.intro}>{a.correct ? 'The engine records this as evidence, weighted by difficulty and wording diversity.' : `Recommended intervention: ${a.remediation?.type ?? 'learn'} because ${String(a.remediation?.reason ?? 'knowledge gap').replaceAll('_', ' ')}.`}</Text></Card><Button label={compare ? 'Understand the difference' : 'Continue'} onPress={() => navigate(compare ? 'compare-concepts' : 'session-complete')} /><Button secondary label="Try an unseen question" onPress={() => navigate('question')} /><BottomTabs active="learn" navigate={navigate} /></View>;
}

function SessionComplete({ navigate, goBack }: Props) {
  const rt = useCitizenAI();
  return <View style={s.screen}><AppHeader onBack={goBack} /><View style={s.complete}><IconTile name="checkmark" tone="teal" size={72} iconSize={36} /><Text style={typography.h1}>Done for today</Text><Text style={s.intro}>You’ve reached a useful stopping point.</Text></View><Card><View style={s.summaryRow}><View><Text style={s.bigMetric}>{rt.sessionSummary.minutes}</Text><Text style={s.meta}>minutes</Text></View><View><Text style={s.bigMetric}>{rt.sessionSummary.conceptsStrengthened}</Text><Text style={s.meta}>concepts</Text></View><View><Text style={s.bigMetric}>{rt.readinessScore}%</Text><Text style={s.meta}>readiness</Text></View></View></Card><Button label="Finish" onPress={() => navigate('home')} /><TextAction label="Keep practicing" onPress={() => navigate('question')} /><BottomTabs active="learn" navigate={navigate} /></View>;
}

function ProgressOverview({ navigate }: Props) {
  const rt = useCitizenAI();
  return <View style={s.screen}><AppHeader days={`${rt.daysUntilExam} days until test`} /><Text style={typography.h1}>Progress</Text><Card style={s.progressCard}><ProgressRing score={rt.readinessScore} label={rt.readinessStatus} size={130} stroke={7} /><View style={s.progressCopy}><Text style={s.heroTitle}>Coverage confidence</Text><Text style={s.bigMetric}>{Math.round(rt.readinessConfidence * 100)}%</Text><Text style={s.meta}>Readiness stays conservative until evidence is broad enough.</Text></View></Card><Text style={s.sectionTitle}>Domains</Text><Card>{domainMeta.map((d, i) => <ListRow key={d.id} title={d.name} meta={rt.domainScores[d.id] < 70 ? 'Needs attention' : 'Building strength'} trailing={`${rt.domainScores[d.id]}%`} icon={d.icon} iconTone={d.teal ? 'teal' : 'blue'} onPress={() => navigate('domain-detail')} hideDivider={i === domainMeta.length - 1} />)}</Card><BottomTabs active="progress" navigate={navigate} /></View>;
}

function DomainDetail({ navigate, goBack }: Props) {
  const rt = useCitizenAI();
  const lowest = domainMeta.toSorted((a, b) => rt.domainScores[a.id] - rt.domainScores[b.id])[0];
  const concepts = rt.studyPlan.activities.map(a => rt.conceptById(a.conceptId)).filter(Boolean);
  return <View style={s.screen}><AppHeader onBack={goBack} /><Text style={typography.h1}>{lowest.name}</Text><Text style={s.intro}>{rt.domainScores[lowest.id]}% current evidence score</Text><ProgressBar value={rt.domainScores[lowest.id]} valueLabel={`${rt.domainScores[lowest.id]}%`} /><Text style={s.sectionTitle}>Priority concepts</Text><Card>{concepts.slice(0, 4).map((c, i) => <ListRow key={c!.id} title={c!.title} meta="Selected by study engine" trailing={i === 0 ? 'High' : 'Medium'} icon={activityIcon(rt.studyPlan.activities[i]?.type ?? 'review')} onPress={() => navigate('concept-detail')} hideDivider={i === Math.min(concepts.length, 4) - 1} />)}</Card><Button label="Study highest priority" onPress={() => navigate(activityRoute(rt.studyPlan.activities[0]?.type ?? 'question'))} /><BottomTabs active="progress" navigate={navigate} /></View>;
}

function ConceptDetail({ navigate, goBack }: Props) {
  const rt = useCitizenAI();
  const activity = rt.studyPlan.activities[0];
  const concept = rt.conceptById(activity?.conceptId ?? 'parliament-government');
  return <View style={s.screen}><AppHeader onBack={goBack} /><Text style={typography.h1}>{concept?.title}</Text><Card><ListRow title="Recommended action" trailing={activity?.type.replace('_', ' ') ?? 'review'} icon="sparkles-outline" /><ListRow title="Study cost" trailing={`${activity?.minutes ?? 3} min`} icon="time-outline" /><ListRow title="Importance" trailing={`${Math.round((concept?.importance ?? 0) * 100)}%`} icon="flag-outline" hideDivider /></Card><Card tone="soft" style={s.note}><IconTile name="analytics-outline" /><View style={{ flex: 1 }}><Text style={s.noteTitle}>Why this is here</Text><Text style={s.noteText}>The engine ranks importance, weakness, forgetting risk, uncertainty and expected learning gain against study cost.</Text></View></Card><Button label="Strengthen this concept" onPress={() => navigate(activityRoute(activity?.type ?? 'question'))} /><BottomTabs active="progress" navigate={navigate} /></View>;
}

export const integratedCoreScreens: ScreenMap = {
  'test-setup': TestSetup,
  diagnostic: Diagnostic,
  'diagnostic-result': DiagnosticResult,
  home: Home,
  'today-plan': TodayPlan,
  question: Question,
  'answer-explanation': AnswerExplanation,
  'session-complete': SessionComplete,
  'progress-overview': ProgressOverview,
  'domain-detail': DomainDetail,
  'concept-detail': ConceptDetail
};

const s = StyleSheet.create({
  screen: { flex: 1, gap: 12 },
  intro: { color: theme.color.textMuted, fontSize: 16, lineHeight: 23, marginTop: 6 },
  label: { color: theme.color.textMuted, fontSize: 12, fontWeight: '700', marginBottom: 8 },
  hint: { color: theme.color.textMuted, fontSize: 12, marginTop: 7 },
  input: { minHeight: 52, borderRadius: 16, borderWidth: 1, borderColor: theme.color.borderStrong, paddingHorizontal: 15, color: theme.color.text, fontSize: 17, backgroundColor: theme.color.surfaceMuted },
  sectionTitle: { color: theme.color.text, fontSize: 19, fontWeight: '700', marginTop: 14 },
  sectionTitleCompact: { color: theme.color.text, fontSize: 21, lineHeight: 27, fontWeight: '700' },
  segment: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  segmentItem: { flex: 1, minWidth: 86, minHeight: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.color.surfaceMuted, borderWidth: 1, borderColor: 'transparent' },
  segmentSelected: { backgroundColor: theme.color.primaryPale, borderColor: theme.color.primary },
  segmentText: { color: theme.color.textMuted, fontSize: 15, fontWeight: '600' },
  segmentTextSelected: { color: theme.color.primaryDark },
  progressHead: { gap: 9, marginBottom: 5 },
  progressLabel: { color: theme.color.text, fontSize: 15, fontWeight: '650' },
  options: { gap: 10 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 60, borderWidth: 1, borderColor: theme.color.border, backgroundColor: theme.color.surface, borderRadius: 18, paddingHorizontal: 16, paddingVertical: 12, ...theme.shadow.soft },
  optionSelected: { borderColor: theme.color.primary, backgroundColor: theme.color.primaryPale },
  optionPressed: { transform: [{ scale: theme.motion.pressScale }], opacity: 0.95 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: theme.color.textSoft },
  radioSelected: { borderColor: theme.color.primary, borderWidth: 5 },
  optionText: { flex: 1, color: theme.color.text, fontSize: 16, lineHeight: 22 },
  resultHero: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16, minHeight: 158, marginHorizontal: 2 },
  resultCopyWrap: { flex: 1, minWidth: 190 },
  resultTitle: { color: theme.color.text, fontSize: 30, lineHeight: 36, fontWeight: '700' },
  resultCopy: { color: theme.color.textMuted, fontSize: 15, lineHeight: 22, marginTop: 9, paddingRight: 4 },
  anchorCard: { marginHorizontal: 2, paddingVertical: 14, paddingHorizontal: 16 },
  cardTitle: { color: theme.color.text, fontSize: 18, fontWeight: '700' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  meta: { color: theme.color.textMuted, fontSize: 12, lineHeight: 17 },
  domainRow: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 10 },
  domainName: { color: theme.color.text, fontSize: 15, fontWeight: '650', marginBottom: 6 },
  domainScore: { color: theme.color.textMuted, fontSize: 14, fontWeight: '600' },
  homeIntro: { gap: 3, marginTop: -2, marginBottom: 2 },
  homeGreeting: { color: theme.color.text, fontSize: 28, lineHeight: 34, fontWeight: '700', letterSpacing: -0.55 },
  homeSub: { color: theme.color.textMuted, fontSize: 15, lineHeight: 21 },
  homeHero: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 18, padding: 18, minHeight: 190 },
  heroCopy: { flex: 1, minWidth: 150, gap: 8 },
  heroTitle: { color: theme.color.text, fontSize: 21, lineHeight: 27, fontWeight: '700' },
  heroDelta: { color: theme.color.success, fontSize: 16, fontWeight: '700' },
  heroSupport: { color: theme.color.textMuted, fontSize: 14, lineHeight: 20 },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginTop: 6 },
  progressList: { paddingVertical: 4, paddingHorizontal: 14 },
  progressDomain: { minHeight: 62, flexDirection: 'row', alignItems: 'center', gap: 11, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.color.border, paddingVertical: 9 },
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  note: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, alignItems: 'center', marginTop: 4 },
  noteTitle: { color: theme.color.text, fontSize: 16, fontWeight: '700' },
  noteText: { color: theme.color.textMuted, fontSize: 13, lineHeight: 19, marginTop: 3 },
  complete: { alignItems: 'center', gap: 10, paddingVertical: 28 },
  summaryRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around', alignItems: 'center', gap: 20 },
  bigMetric: { color: theme.color.text, fontSize: 26, lineHeight: 32, fontWeight: '700' },
  progressCard: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 18 },
  progressCopy: { flex: 1, minWidth: 160, gap: 5 }
});
