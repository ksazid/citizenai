import React, { useMemo, useState } from 'react';
import { SafeAreaView, ScrollView, StatusBar, StyleSheet, View } from 'react-native';
import { SCREEN_IDS, ScreenId } from './src/model';
import { screenComponents } from './src/screens';
import { theme } from './src/theme';

function initialScreen(): ScreenId {
  const search = String((globalThis as any).location?.search ?? '');
  const match = search.match(/[?&]screen=([^&]+)/);
  if (!match) return 'welcome';
  const requested = decodeURIComponent(match[1]) as ScreenId;
  return (SCREEN_IDS as readonly string[]).includes(requested) ? requested : 'welcome';
}

export default function App() {
  const [history, setHistory] = useState<ScreenId[]>([initialScreen()]);
  const current = history[history.length - 1];
  const Screen = useMemo(() => screenComponents[current], [current]);

  const navigate = (screen: ScreenId) => setHistory(prev => [...prev, screen]);
  const goBack = () => setHistory(prev => prev.length > 1 ? prev.slice(0, -1) : prev);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.color.background} />
      <View style={styles.frame}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Screen navigate={navigate} goBack={goBack} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.color.background },
  frame: { flex: 1, backgroundColor: theme.color.background },
  scroll: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 20 }
});
