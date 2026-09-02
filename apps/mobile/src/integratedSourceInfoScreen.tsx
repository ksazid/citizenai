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
      <View style={s.row}><Text style={s.title}>UK Knowledge Pack</Text><Pill label="Coverage candidate" tone="success" /></View>
      <Text style={s.copy}>Version {VERIFIED_UK_PACK_META.version}</Text>
      <Text style={s.copy}>Every included question resolves to an approved canonical fact, evidence record and authoritative public source.</Text>
    </Card>
    <Card>
      <ListRow title="Authoritative sources" meta="Government · Parliament · archives · public libraries · science collections" trailing={`${VERIFIED_UK_PACK_META.sourceCount}`} icon="shield-checkmark-outline" />
      <ListRow title="Verified concepts" meta="Government · rights · history · culture" trailing={`${VERIFIED_UK_PACK_META.conceptCount}`} icon="git-network-outline" />
      <ListRow title="Verified facts" meta="Approved with explicit evidence" trailing={`${VERIFIED_UK_PACK_META.factCount}`} icon="document-text-outline" />
      <ListRow title="Question variants" meta="Independently authored; provenance verified" trailing={`${VERIFIED_UK_PACK_META.questionCount}`} icon="help-circle-outline" />
      <ListRow title="Coverage blockers" meta="Must reach zero before activation" trailing={`${VERIFIED_UK_PACK_META.openGapCount}`} icon="alert-circle-outline" />
      <ListRow title="Source-body snapshots" meta="SHA-256 pipeline implemented; historical backfill required" trailing={VERIFIED_UK_PACK_META.sourceSnapshotBackfillComplete ? 'Complete' : 'Pending'} icon="finger-print-outline" hideDivider />
    </Card>
    <Card tone="warning">
      <Text style={s.warningTitle}>Release gate remains closed</Text>
      <Text style={s.copy}>This candidate has broad verified public-source coverage, but it does not claim 100% exam alignment. Activation requires complete source snapshots and exact-version human certification against a lawful exam-scope map.</Text>
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
