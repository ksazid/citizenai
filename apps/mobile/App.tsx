import React, { useMemo, useState } from 'react';
import { SafeAreaView, ScrollView, StatusBar, StyleSheet, View } from 'react-native';
import { approvedAnchorScreens } from './src/approvedAnchorScreens';
import { BottomTabs } from './src/components';
import { integratedCoreScreens } from './src/integratedCoreScreens';
import { integratedLearningScreens } from './src/integratedLearningScreens';
import { integratedLifecycleScreens } from './src/integratedLifecycleScreens';
import { integratedSourceInfoScreen } from './src/integratedSourceInfoScreen';
import { integratedWelcomeScreen } from './src/integratedWelcomeScreen';
import { SCREEN_IDS, ScreenId, TabId } from './src/model';
import { CitizenAIRuntimeProvider } from './src/runtime';
import './src/verifiedPackInstall';
import { screenComponents } from './src/screens';
import { theme } from './src/theme';

function requestedScreen(): ScreenId | null {
  const search = String((globalThis as any).location?.search ?? '');
  const match = search.match(/[?&]screen=([^&]+)/);
  if (!match) return null;
  const requested = decodeURIComponent(match[1]) as ScreenId;
  return (SCREEN_IDS as readonly string[]).includes(requested) ? requested : null;
}

function tabForScreen(screen: ScreenId): TabId | null {
  if (['home', 'exam-countdown', 'exam-day'].includes(screen)) return 'home';
  if (['today-plan', 'learn-concept', 'compare-concepts', 'recall', 'question', 'answer-explanation', 'session-complete', 'mock-intro', 'mock-question', 'mock-review', 'mock-result', 'maintenance-review'].includes(screen)) return 'learn';
  if (['progress-overview', 'domain-detail', 'concept-detail', 'pass-ready'].includes(screen)) return 'progress';
  if (['profile', 'source-info'].includes(screen)) return 'profile';
  return null;
}

function MobileApp() {
  const captureScreen = requestedScreen();
  const [history, setHistory] = useState<ScreenId[]>([captureScreen ?? 'welcome']);
  const current = history[history.length - 1];
  const activeTab = tabForScreen(current);
  const Screen = useMemo(() => {
    // Visual capture now exercises the same integrated screen hierarchy users see.
    return integratedWelcomeScreen[current]
      ?? integratedCoreScreens[current]
      ?? integratedLearningScreens[current]
      ?? integratedSourceInfoScreen[current]
      ?? integratedLifecycleScreens[current]
      ?? approvedAnchorScreens[current]
      ?? screenComponents[current];
  }, [current]);

  const navigate = (screen: ScreenId) => setHistory(prev => [...prev, screen]);
  const goBack = () => setHistory(prev => prev.length > 1 ? prev.slice(0, -1) : prev);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.color.background} />
      <View style={styles.frame}>
        <View pointerEvents="none" style={styles.auraTop} />
        <View pointerEvents="none" style={styles.auraSide} />
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.content, activeTab && styles.contentWithTabs]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentInsetAdjustmentBehavior="automatic"
          automaticallyAdjustKeyboardInsets
        >
          <Screen navigate={navigate} goBack={goBack} />
        </ScrollView>
        {activeTab ? <View pointerEvents="box-none" style={styles.tabOverlay}><BottomTabs persistent active={activeTab} navigate={navigate} /></View> : null}
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  return <CitizenAIRuntimeProvider><MobileApp /></CitizenAIRuntimeProvider>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.color.background },
  frame: { flex: 1, overflow: 'hidden', backgroundColor: theme.color.background },
  auraTop: { position: 'absolute', width: 420, height: 420, borderRadius: 210, top: -230, left: -80, backgroundColor: 'rgba(31,91,232,0.075)' },
  auraSide: { position: 'absolute', width: 360, height: 360, borderRadius: 180, top: 290, right: -245, backgroundColor: 'rgba(22,163,161,0.055)' },
  scroll: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 22 },
  contentWithTabs: { paddingBottom: 108 },
  tabOverlay: { position: 'absolute', left: 20, right: 20, bottom: 10 }
});
