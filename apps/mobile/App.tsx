import React, { useMemo, useState } from 'react';
import { SafeAreaView, ScrollView, StatusBar, StyleSheet, View } from 'react-native';
import { approvedAnchorScreens } from './src/approvedAnchorScreens';
import { integratedCoreScreens } from './src/integratedCoreScreens';
import { integratedLearningScreens } from './src/integratedLearningScreens';
import { integratedLifecycleScreens } from './src/integratedLifecycleScreens';
import { integratedSourceInfoScreen } from './src/integratedSourceInfoScreen';
import { SCREEN_IDS, ScreenId } from './src/model';
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

function MobileApp() {
  const captureScreen = requestedScreen();
  const [history, setHistory] = useState<ScreenId[]>([captureScreen ?? 'welcome']);
  const current = history[history.length - 1];
  const Screen = useMemo(() => {
    // Visual capture now exercises the same integrated screen hierarchy users see.
    return integratedCoreScreens[current]
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
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentInsetAdjustmentBehavior="automatic"
          automaticallyAdjustKeyboardInsets
        >
          <Screen navigate={navigate} goBack={goBack} />
        </ScrollView>
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
  content: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 22 }
});
