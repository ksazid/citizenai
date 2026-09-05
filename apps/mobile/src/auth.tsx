import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';
import type { Session } from '@supabase/supabase-js';
import { supabase, supabaseConfigured } from './supabaseClient';
import {
  clearStoredLearnerId,
  deleteGuestAccessToken,
  readGuestAccessToken,
  readStoredLearnerId,
  writeStoredLearnerId
} from './sessionStorage';

declare const process: { env: { EXPO_PUBLIC_CITIZENAI_API_URL?: string } };

const configuredApiBaseUrl = () => String(process.env.EXPO_PUBLIC_CITIZENAI_API_URL ?? '').replace(/\/$/, '');

type AuthContextValue = {
  configured: boolean;
  loading: boolean;
  session: Session | null;
  error: string | null;
  message: string | null;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function requestAccount(path: string, accessToken: string, init: RequestInit = {}) {
  const baseUrl = configuredApiBaseUrl();
  if (!baseUrl) throw new Error('CitizenAI API URL is not configured');
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${accessToken}`,
      ...(init.headers ?? {})
    }
  });
  const text = await response.text();
  let payload: any = null;
  try { payload = text ? JSON.parse(text) : null; }
  catch { payload = null; }
  if (!response.ok) throw new Error(payload?.message ?? `CitizenAI API ${response.status}`);
  return payload;
}

async function synchronizeLearnerOwnership(accessToken: string) {
  const baseUrl = configuredApiBaseUrl();
  if (!baseUrl) return;

  const account = await requestAccount('/v1/account/learner', accessToken);
  if (account?.learner?.id) {
    await writeStoredLearnerId(account.learner.id);
    return;
  }

  const learnerId = await readStoredLearnerId();
  if (!learnerId) return;
  const guestToken = await readGuestAccessToken(learnerId);
  if (!guestToken) return;

  await requestAccount('/v1/account/claim', accessToken, {
    method: 'POST',
    headers: { 'x-citizenai-guest-token': guestToken },
    body: JSON.stringify({ learnerId })
  });
  await deleteGuestAccessToken(learnerId);
  await writeStoredLearnerId(learnerId);
}

export function CitizenAIAuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(supabaseConfigured);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const authClient = supabase;
    if (!authClient) {
      setLoading(false);
      return;
    }
    let active = true;

    const applySession = async (next: Session | null, event?: string) => {
      if (!active) return;
      try {
        if (event === 'SIGNED_OUT') await clearStoredLearnerId();
        if (next?.access_token && event !== 'TOKEN_REFRESHED') {
          await synchronizeLearnerOwnership(next.access_token);
        }
        if (active) {
          setSession(next);
          setError(null);
        }
      } catch (syncError) {
        if (active) {
          setSession(next);
          setError(syncError instanceof Error ? syncError.message : 'Account sync failed');
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void authClient.auth.getSession().then(({ data, error: sessionError }) => {
      if (sessionError) {
        setError(sessionError.message);
        setLoading(false);
        return;
      }
      void applySession(data.session, 'INITIAL_SESSION');
    });

    const { data: authListener } = authClient.auth.onAuthStateChange((event, next) => {
      setTimeout(() => { void applySession(next, event); }, 0);
    });

    const appStateListener = AppState.addEventListener('change', (state) => {
      if (state === 'active') authClient.auth.startAutoRefresh();
      else authClient.auth.stopAutoRefresh();
    });

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
      appStateListener.remove();
    };
  }, []);

  async function signUp(email: string, password: string) {
    if (!supabase) throw new Error('Supabase Auth is not configured');
    setError(null);
    setMessage(null);
    const { data, error: authError } = await supabase.auth.signUp({ email: email.trim(), password });
    if (authError) {
      setError(authError.message);
      throw authError;
    }
    if (data.session?.access_token) {
      await synchronizeLearnerOwnership(data.session.access_token);
      setSession(data.session);
      setMessage('Your progress is now protected by your account.');
    } else {
      setMessage('Check your email to confirm your account, then sign in to protect your progress.');
    }
  }

  async function signIn(email: string, password: string) {
    if (!supabase) throw new Error('Supabase Auth is not configured');
    setError(null);
    setMessage(null);
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (authError) {
      setError(authError.message);
      throw authError;
    }
    if (data.session?.access_token) await synchronizeLearnerOwnership(data.session.access_token);
    setSession(data.session);
    setMessage('Signed in. Your account learner has been restored.');
  }

  async function signOut() {
    if (!supabase) return;
    setError(null);
    setMessage(null);
    const { error: authError } = await supabase.auth.signOut();
    if (authError) {
      setError(authError.message);
      throw authError;
    }
  }

  const value = useMemo<AuthContextValue>(() => ({
    configured: supabaseConfigured,
    loading,
    session,
    error,
    message,
    signUp,
    signIn,
    signOut
  }), [loading, session, error, message]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useCitizenAIAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('CitizenAIAuthProvider is missing');
  return value;
}
