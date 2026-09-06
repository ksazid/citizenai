import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createCitizenAIApiClient, type RemoteQuestion } from './apiClient';
import { AppHeader, Button, Pill, ProgressBar, typography } from './components';
import { Navigator } from './model';
import { useCitizenAI } from './runtime';
import { theme } from './theme';

type Props = { navigate: Navigator; goBack: () => void };
type RemoteDiagnostic = { question: RemoteQuestion; answered: number; target: number };

export function DiagnosticScreen({ navigate, goBack }: Props) {
  const rt = useCitizenAI();
  const insets = useSafeAreaInsets();
  const api = useMemo(() => createCitizenAIApiClient(), []);
  const [remoteDiagnostic, setRemoteDiagnostic] = useState<RemoteDiagnostic | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(api.enabled);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRemoteQuestion = useCallback(async () => {
    if (!api.enabled || !rt.learnerId) return;
    setLoading(true);
    setError(null);
    try {
      const next = await api.nextDiagnostic(rt.learnerId);
      setRemoteDiagnostic(next);
      setSelected(null);
    } catch {
      setError('We could not load the next question. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [api, rt.learnerId]);

  useEffect(() => {
    if (!api.enabled) return;
    setRemoteDiagnostic(null);
    if (rt.learnerId) void loadRemoteQuestion();
  }, [api.enabled, rt.learnerId, loadRemoteQuestion]);

  const question = api.enabled ? remoteDiagnostic?.question ?? null : rt.diagnosticQuestion;
  const answered = api.enabled ? remoteDiagnostic?.answered ?? rt.diagnosticAnswered : rt.diagnosticAnswered;
  const target = api.enabled ? remoteDiagnostic?.target ?? rt.diagnosticTarget : rt.diagnosticTarget;

  const submitAnswer = useCallback(async (optionId: string | null) => {
    if (!question || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      if (api.enabled) {
        if (!rt.learnerId) throw new Error('Learner is not ready');
        const result = await api.recordAttempt({
          learnerId: rt.learnerId,
          questionId: question.id,
          optionId,
          sessionType: 'diagnostic'
        });

        if (result?.diagnosticDone) {
          await rt.retryBackend();
          navigate('diagnostic-result');
          return;
        }

        const next = await api.nextDiagnostic(rt.learnerId);
        if (next.question?.id === question.id) {
          throw new Error('Diagnostic question did not advance');
        }
        setRemoteDiagnostic(next);
        setSelected(null);
        void rt.retryBackend();
      } else {
        const done = await Promise.resolve(rt.submitDiagnosticAnswer(optionId));
        setSelected(null);
        if (done) navigate('diagnostic-result');
      }
    } catch {
      setError('We could not save that answer. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [api, navigate, question, rt, submitting]);

  if (api.enabled && (loading || !question) && !error) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="small" color={theme.color.primary} />
        <Text style={styles.loadingText}>Loading your next question…</Text>
      </View>
    );
  }

  if (api.enabled && error && !question) {
    return (
      <View style={styles.loadingScreen}>
        <Text style={typography.h2}>Question unavailable</Text>
        <Text style={styles.errorText}>{error}</Text>
        <Button label="Try again" onPress={() => { void loadRemoteQuestion(); }} />
      </View>
    );
  }

  if (!question) return null;

  const nextLabel = submitting
    ? 'Saving…'
    : answered >= 19
      ? 'Finish readiness check'
      : 'Next question';

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <AppHeader onBack={goBack} days={`${rt.daysUntilExam} days until test`} />
        <View style={styles.progressHead}>
          <Text style={styles.progressLabel}>Diagnostic · {Math.min(answered + 1, target)} of ~{target}</Text>
          <ProgressBar value={answered} max={target} />
        </View>
        <Pill label="Readiness check" />
        <Text style={[typography.h1, styles.question]}>{question.stem}</Text>
        <Text style={styles.intro}>Choose the best answer. Corrections stay hidden until the diagnostic is complete.</Text>
        <View accessibilityRole="radiogroup" style={styles.options}>
          {question.options.map(option => (
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ selected: selected === option.id, disabled: submitting }}
              accessibilityLabel={option.text}
              disabled={submitting}
              key={option.id}
              onPress={() => setSelected(option.id)}
              style={({ pressed }) => [
                styles.option,
                selected === option.id && styles.optionSelected,
                pressed && !submitting && styles.optionPressed
              ]}
            >
              <View style={[styles.radio, selected === option.id && styles.radioSelected]} />
              <Text maxFontSizeMultiplier={1.45} style={styles.optionText}>{option.text}</Text>
            </Pressable>
          ))}
        </View>
        {error ? <Text accessibilityRole="alert" style={styles.errorText}>{error}</Text> : null}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="I don't know"
          accessibilityState={{ disabled: submitting }}
          disabled={submitting}
          onPress={() => { void submitAnswer(null); }}
          style={({ pressed }) => [styles.unknownAction, pressed && !submitting && styles.optionPressed]}
        >
          <Text style={styles.unknownText}>I don’t know</Text>
        </Pressable>
        <Button
          label={nextLabel}
          disabled={!selected || submitting}
          onPress={() => { if (selected) void submitAnswer(selected); }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24 },
  loadingScreen: { flex: 1, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center', gap: 14 },
  loadingText: { color: theme.color.textMuted, fontSize: 15 },
  progressHead: { marginTop: 18, marginBottom: 18, gap: 9 },
  progressLabel: { color: theme.color.textMuted, fontWeight: '700', fontSize: 14 },
  question: { marginTop: 12 },
  intro: { color: theme.color.textMuted, fontSize: 16, lineHeight: 23, marginTop: 10 },
  options: { gap: 10, marginTop: 20 },
  option: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.color.border,
    backgroundColor: theme.color.surface
  },
  optionSelected: { borderColor: theme.color.primary, backgroundColor: theme.color.primarySoft },
  optionPressed: { opacity: 0.72 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: theme.color.textSoft },
  radioSelected: { borderWidth: 6, borderColor: theme.color.primary },
  optionText: { flex: 1, color: theme.color.text, fontSize: 17, lineHeight: 23, fontWeight: '600' },
  errorText: { color: theme.color.danger, fontSize: 14, lineHeight: 20, textAlign: 'center', marginTop: 12 },
  footer: {
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 10,
    backgroundColor: theme.color.background,
    borderTopWidth: 1,
    borderTopColor: theme.color.border,
    ...theme.shadow.soft
  },
  unknownAction: { minHeight: 42, alignItems: 'center', justifyContent: 'center' },
  unknownText: { color: theme.color.primary, fontSize: 16, fontWeight: '700' }
});
