import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppHeader, Button, Card, ListRow, Pill, typography } from './components';
import { Navigator, ScreenId } from './model';
import { VERIFIED_UK_PACK_META } from './verifiedPackInstall';
import { theme } from './theme';

type Props = { navigate: Navigator; goBack: () => void };
type ScreenMap = Partial<Record<ScreenId, React.ComponentType<Props>>>;

function SourceInfo({ navigate, goBack }: Props) {
  return <View style={s.screen}>
    <AppHeader onBack={goBack} />
    <Text style={typography.h1}>Sources & version</Text>
    <Card tone="soft">
      <View style={s.row}><Text style={s.title}>UK Knowledge Pack</Text><Pill label="Verified foundation" tone="success" /></View>
      <Text style={s.copy}>Version {VERIFIED_UK_PACK_META.version}</Text>
      <Text style={s.copy}>Every active question in this foundation resolves to an approved canonical fact, evidence record and official public source.</Text>
    </Card>
    <Card>
      <ListRow title="Official sources" meta="GOV.UK · UK Parliament · Electoral Commission · ONS · UK Supreme Court" trailing={`${VERIFIED_UK_PACK_META.sourceCount}`} icon="shield-checkmark-outline" />
      <ListRow title="Verified facts" meta="Approved with explicit evidence" trailing={`${VERIFIED_UK_PACK_META.factCount}`} icon="document-text-outline" />
      <ListRow title="Question variants" meta="Independently authored; provenance verified" trailing={`${VERIFIED_UK_PACK_META.questionCount}`} icon="help-circle-outline" />
      <ListRow title="Pack state" meta="Fact-verified, coverage certification still open" trailing="Review" icon="layers-outline" hideDivider />
    </Card>
    <Card tone="warning">
      <Text style={s.warningTitle}>Exam-completeness is not claimed yet</Text>
      <Text style={s.copy}>The official test is based on the Guide for New Residents. This pack deliberately remains blocked from “exam complete” status until lawful coverage mapping is certified.</Text>
    </Card>
    <Button secondary label="Back to profile" onPress={() => navigate('profile')} />
  </View>;
}

export const integratedSourceInfoScreen: ScreenMap = { 'source-info': SourceInfo };

const s = StyleSheet.create({
  screen: { flex: 1, gap: 14 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  title: { color: theme.color.text, fontSize: 20, lineHeight: 26, fontWeight: '700', flex: 1 },
  copy: { color: theme.color.textMuted, fontSize: 14, lineHeight: 21, marginTop: 7 },
  warningTitle: { color: theme.color.text, fontSize: 17, lineHeight: 23, fontWeight: '700' }
});
