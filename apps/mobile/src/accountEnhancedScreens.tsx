import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { AppHeader, BottomTabs, Button, Card, ListRow, typography } from './components';
import { useCitizenAIAuth } from './auth';
import { Navigator, ScreenId } from './model';
import { useCitizenAI } from './runtime';
import { theme } from './theme';

type Props = { navigate: Navigator; goBack: () => void };
type ScreenMap = Partial<Record<ScreenId, React.ComponentType<Props>>>;

function Profile({ navigate }: Props) {
  const rt = useCitizenAI();
  const auth = useCitizenAIAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState<'signup' | 'signin' | 'signout' | null>(null);

  const run = async (action: 'signup' | 'signin' | 'signout') => {
    setPending(action);
    try {
      if (action === 'signup') await auth.signUp(email, password);
      else if (action === 'signin') await auth.signIn(email, password);
      else await auth.signOut();
    } catch {
      // AuthProvider exposes a user-safe error string in the card below.
    } finally {
      setPending(null);
    }
  };

  return (
    <View style={s.screen}>
      <AppHeader days={`${rt.daysUntilExam} days until test`} />
      <Text style={typography.h1}>Profile & settings</Text>

      <Card>
        <ListRow title="Exam date" meta={rt.examDate} trailing="Active" icon="calendar-outline" />
        <ListRow title="Country pack" meta="United Kingdom" trailing="UK" icon="flag-outline" />
        <ListRow title="Explanation language" meta={rt.explanationLanguage} trailing="Edit" icon="language-outline" hideDivider />
      </Card>

      <Card tone={auth.session ? 'success' : 'soft'}>
        <Text style={s.cardTitle}>Account & progress</Text>
        {auth.session ? (
          <>
            <Text style={s.accountEmail}>{auth.session.user.email ?? 'Signed-in account'}</Text>
            <Text style={s.copy}>Your learner progress is bound to this account. The old guest token is no longer accepted after claiming.</Text>
            {auth.message ? <Text style={s.success}>{auth.message}</Text> : null}
            {auth.error ? <Text style={s.error}>{auth.error}</Text> : null}
            <Button secondary label={pending === 'signout' ? 'Signing out…' : 'Sign out'} disabled={pending !== null} onPress={() => { void run('signout'); }} />
          </>
        ) : auth.configured ? (
          <>
            <Text style={s.copy}>Create an account to protect this same learner and restore it on another session. Your current progress is claimed; it is not copied.</Text>
            <TextInput
              accessibilityLabel="Email address"
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              placeholder="Email address"
              placeholderTextColor={theme.color.textSoft}
              value={email}
              onChangeText={setEmail}
              style={s.input}
            />
            <TextInput
              accessibilityLabel="Password"
              autoCapitalize="none"
              autoComplete="password"
              placeholder="Password"
              placeholderTextColor={theme.color.textSoft}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              style={s.input}
            />
            {auth.message ? <Text style={s.success}>{auth.message}</Text> : null}
            {auth.error ? <Text style={s.error}>{auth.error}</Text> : null}
            <Button label={pending === 'signup' ? 'Creating account…' : 'Protect my progress'} disabled={pending !== null || !email.trim() || password.length < 8} onPress={() => { void run('signup'); }} />
            <Button secondary label={pending === 'signin' ? 'Signing in…' : 'I already have an account'} disabled={pending !== null || !email.trim() || !password} onPress={() => { void run('signin'); }} />
          </>
        ) : (
          <Text style={s.copy}>Account protection is not configured in this build. Guest learning remains available.</Text>
        )}
      </Card>

      <Card>
        <Text style={s.cardTitle}>Readiness & sources</Text>
        <ListRow title="Readiness methodology" meta="Mastery + retention + Monte Carlo + coverage" trailing={`${rt.readinessScore}%`} icon="analytics-outline" />
        <ListRow title="Sources & content version" meta="See provenance rules" icon="shield-checkmark-outline" onPress={() => navigate('source-info')} hideDivider />
      </Card>
      <BottomTabs active="profile" navigate={navigate} />
    </View>
  );
}

export const accountEnhancedScreens: ScreenMap = {
  profile: Profile
};

const s = StyleSheet.create({
  screen: { flex: 1, gap: 16 },
  cardTitle: { color: theme.color.text, fontSize: 16, fontWeight: '800', marginBottom: 8 },
  copy: { color: theme.color.textMuted, fontSize: 14, lineHeight: 21 },
  accountEmail: { color: theme.color.text, fontSize: 16, fontWeight: '700', marginBottom: 4 },
  input: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: theme.color.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    color: theme.color.text,
    backgroundColor: theme.color.surface,
    fontSize: 15
  },
  success: { color: theme.color.tealDark, fontSize: 13, lineHeight: 19 },
  error: { color: theme.color.danger ?? '#B42318', fontSize: 13, lineHeight: 19 }
});
