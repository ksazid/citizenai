import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { AppHeader, AppIcon, BottomTabs, Button, Card, IconTile, ProgressBar, typography } from './components';
import { Navigator, ScreenId } from './model';
import { useCitizenAI } from './runtime';
import { theme } from './theme';

type Props = { navigate: Navigator; goBack: () => void };
type ScreenMap = Partial<Record<ScreenId, React.ComponentType<Props>>>;

function LearnConcept({ navigate, goBack }: Props) {
  const rt = useCitizenAI();
  const activity = rt.studyPlan.activities.find(a => a.type === 'learn') ?? rt.studyPlan.activities[0];
  const concept = rt.conceptById(activity?.conceptId ?? 'elections');
  return <View style={s.screen}><AppHeader onBack={goBack} days={`${rt.daysUntilExam} days until test`} /><View style={s.progress}><Text style={s.progressText}>Today’s plan · Learn</Text><View style={s.progressBar}><ProgressBar value={1} max={4} /></View></View><Text style={typography.h1}>{concept?.title ?? 'Learn concept'}</Text><Text style={s.subtitle}>Focus on the underlying idea, not a memorised sentence.</Text><Card><View style={s.lessonRow}><IconTile name="people-outline" /><View style={s.lessonCopy}><Text style={s.lessonTitle}>Core idea</Text><Text style={s.lessonText}>{concept?.id === 'elections' ? 'Voters elect Members of Parliament to represent constituencies.' : 'Build a clear mental model of this concept before testing it.'}</Text></View></View><View style={s.lessonRow}><IconTile name="git-compare-outline" tone="teal" /><View style={s.lessonCopy}><Text style={s.lessonTitle}>Distinction</Text><Text style={s.lessonText}>{concept?.id === 'elections' ? 'Voters do not directly elect the Prime Minister.' : 'Separate this concept from nearby ideas that are easy to confuse.'}</Text></View></View><View style={s.lessonRow}><IconTile name="sparkles-outline" /><View style={s.lessonCopy}><Text style={s.lessonTitle}>Next evidence</Text><Text style={s.lessonText}>CitizenAI will test this with unseen wording so one remembered question cannot inflate mastery.</Text></View></View></Card><Button label="Check understanding" onPress={() => navigate('question')} /><BottomTabs active="learn" navigate={navigate} /></View>;
}

function CompareConcepts({ navigate, goBack }: Props) {
  const rt = useCitizenAI();
  const { fontScale } = useWindowDimensions();
  const stackComparison = fontScale >= 1.3;
  return <View style={s.screen}><AppHeader onBack={goBack} days={`${rt.daysUntilExam} days until test`} /><View style={s.progress}><Text style={s.progressText}>Today’s plan · Compare</Text><View style={s.progressBar}><ProgressBar value={2} max={4} /></View></View><Text style={s.compareTitle}>Parliament vs Government</Text><Text style={s.subtitle}>The remediation engine selected a contrast because this is a concept-confusion pattern.</Text><Card style={s.matrix}><View style={s.headers}><View style={s.header}><IconTile name="business-outline" /><Text style={[s.headerText, { color: theme.color.primary }]}>Parliament</Text></View><Text style={s.vs}>VS</Text><View style={s.header}><IconTile name="business-outline" tone="teal" /><Text style={[s.headerText, { color: theme.color.tealDark }]}>Government</Text></View></View><View style={[s.columns, stackComparison && s.columnsStacked]}><View style={s.column}><Cell icon="create-outline" text="Makes and scrutinises laws" /><Cell icon="people-outline" text="Includes MPs and House of Lords" /><Cell icon="scale-outline" text="Holds Government accountable" /></View><View style={[s.vertical, stackComparison && s.verticalStacked]} /><View style={s.column}><Cell tone="teal" icon="settings-outline" text="Runs the country" /><Cell tone="teal" icon="person-outline" text="Led by the Prime Minister" /><Cell tone="teal" icon="checkmark-circle-outline" text="Implements policy" /></View></View></Card><Card tone="soft" style={s.callout}><IconTile name="sparkles-outline" /><View style={s.lessonCopy}><Text style={s.lessonTitle}>Why CitizenAI sent you here</Text><Text style={s.lessonText}>Wrong answers that reverse these roles trigger compare → recall → unseen variant rather than another random question.</Text></View></Card><Button label="Check understanding" onPress={() => navigate('recall')} /><Pressable accessibilityRole="button" accessibilityLabel="Save for later" style={({ pressed }) => [s.save, pressed && s.pressed]}><AppIcon name="bookmark-outline" size={21} color={theme.color.text} /><Text style={s.saveText}>Save for later</Text></Pressable><BottomTabs active="learn" navigate={navigate} /></View>;
}

function Cell({ icon, text, tone = 'blue' }: { icon: string; text: string; tone?: 'blue' | 'teal' }) {
  return <View style={s.cell}><IconTile name={icon} tone={tone} size={40} iconSize={21} /><Text style={s.cellText}>{text}</Text></View>;
}

function Recall({ navigate, goBack }: Props) {
  const rt = useCitizenAI();
  const activity = rt.studyPlan.activities.find(a => a.type === 'recall') ?? rt.studyPlan.activities[0];
  const concept = rt.conceptById(activity?.conceptId ?? 'magna-carta');
  const [revealed, setRevealed] = useState(false);
  const magna = concept?.id === 'magna-carta';
  return <View style={s.screen}><AppHeader onBack={goBack} days={`${rt.daysUntilExam} days until test`} /><Text style={s.progressText}>Recall · {activity?.minutes ?? 3} min</Text><Text style={typography.h1}>{magna ? 'What principle is Magna Carta commonly associated with?' : `What is the key idea behind ${concept?.title ?? 'this concept'}?`}</Text><Card style={s.recall}>{revealed ? <><IconTile name="checkmark-circle-outline" tone="teal" /><Text style={s.recallAnswer}>{magna ? 'Limits on arbitrary power and the rule of law.' : 'Recall the core idea in your own words before checking a variant.'}</Text><Text style={s.lessonText}>Delayed recall is weighted more strongly than immediate repetition because it gives better evidence of retention.</Text></> : <Text style={s.recallPrompt}>Answer in your own words first. Do not reveal until you have genuinely tried to retrieve it.</Text>}</Card>{!revealed ? <Button label="Reveal answer" onPress={() => setRevealed(true)} /> : <><Button label="Got it" onPress={() => navigate('question')} /><Button secondary label="Didn’t know" onPress={() => navigate('learn-concept')} /></>}<BottomTabs active="learn" navigate={navigate} /></View>;
}

export const integratedLearningScreens: ScreenMap = {
  'learn-concept': LearnConcept,
  'compare-concepts': CompareConcepts,
  recall: Recall
};

const s = StyleSheet.create({
  screen: { flex: 1, gap: 12 },
  progress: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12 },
  progressBar: { flex: 1, minWidth: 150 },
  progressText: { color: theme.color.text, fontSize: 14, lineHeight: 19, fontWeight: '650' },
  subtitle: { color: theme.color.textMuted, fontSize: 16, lineHeight: 23 },
  lessonRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, alignItems: 'flex-start', paddingVertical: 12 },
  lessonCopy: { flex: 1, minWidth: 180 },
  lessonTitle: { color: theme.color.text, fontSize: 17, lineHeight: 22, fontWeight: '700' },
  lessonText: { color: theme.color.textMuted, fontSize: 14, lineHeight: 20, marginTop: 4 },
  compareTitle: { color: theme.color.text, fontSize: 30, lineHeight: 36, fontWeight: '700', letterSpacing: -0.55 },
  matrix: { padding: 14 },
  headers: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.color.border },
  header: { flex: 1, minWidth: 130, flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerText: { fontSize: 17, lineHeight: 22, fontWeight: '700' },
  vs: { color: theme.color.textMuted, fontSize: 12, fontWeight: '700', marginHorizontal: 4 },
  columns: { flexDirection: 'row' },
  columnsStacked: { flexDirection: 'column' },
  column: { flex: 1, paddingHorizontal: 4 },
  vertical: { width: 1, backgroundColor: theme.color.border },
  verticalStacked: { width: '100%', height: 1, marginVertical: 8 },
  cell: { minHeight: 92, gap: 8, justifyContent: 'center', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.color.border, paddingVertical: 10 },
  cellText: { color: theme.color.text, fontSize: 14, lineHeight: 20 },
  callout: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, alignItems: 'center' },
  save: { minHeight: 52, borderWidth: 1, borderColor: theme.color.borderStrong, borderRadius: 18, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.color.glassStrong, ...theme.shadow.soft },
  saveText: { color: theme.color.text, fontSize: 15, fontWeight: '600' },
  pressed: { transform: [{ scale: theme.motion.pressScale }], opacity: 0.94 },
  recall: { minHeight: 220, alignItems: 'center', justifyContent: 'center', gap: 14 },
  recallPrompt: { color: theme.color.textMuted, fontSize: 18, lineHeight: 27, textAlign: 'center' },
  recallAnswer: { color: theme.color.text, fontSize: 21, lineHeight: 28, fontWeight: '700', textAlign: 'center' }
});
