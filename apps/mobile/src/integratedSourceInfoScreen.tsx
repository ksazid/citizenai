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
      <View style={s.row}><Text style={s.title}>UK Knowledge Pack</Text><Pill label="Release candidate" tone="success" /></View>
      <Text style={s.copy}>Version {VERIFIED_UK_PACK_META.version}</Text>
      <Text style={s.copy}>Every included question resolves to an approved canonical fact, evidence record and authoritative public source.</Text>
    </Card>
    <Card>
      <ListRow title="Authoritative sources" meta="Government · Parliament · archives · public bodies" trailing={`${VERIFIED_UK_PACK_META.sourceCount}`} icon="shield-checkmark-outline" />
      <ListRow title="Verified concepts" meta="Government · rights · history · culture" trailing={`${VERIFIED_UK_PACK_META.conceptCount}`} icon="git-network-outline" />
      <ListRow title="Verified facts" meta="Approved with explicit evidence" trailing={`${VERIFIED_UK_PACK_META.factCount}`} icon="document-text-outline" />
      <ListRow title="Question variants" meta="Independently authored; provenance verified" trailing={`${VERIFIED_UK_PACK_META.questionCount}`} icon="help-circle-outline" />
      <ListRow title="Sports source policy" meta="Public-body sourcing only" trailing={VERIFIED_UK_PACK_META.sportsSourcePolicyClosed ? 'Closed' : 'Open'} icon="football-outline" />
      <ListRow title="Pre-1066 breadth" meta="Roman · Anglo-Saxon · Viking · Sutton Hoo" trailing={VERIFIED_UK_PACK_META.pre1066BreadthMapped ? 'Mapped' : 'Open'} icon="time-outline" />
      <ListRow title="Source-body snapshots" meta="Live SHA-256 capture is a blocking CI gate" trailing={VERIFIED_UK_PACK_META.sourceSnapshotBackfillComplete ? 'Complete' : 'Pending'} icon="finger-print-outline" />
      <ListRow title="Remaining approval" meta="Exact-version human coverage certification" trailing={`${VERIFIED_UK_PACK_META.openGapCount}`} icon="person-outline" hideDivider />
    </Card>
    <Card tone="warning">
      <Text style={s.warningTitle}>Human release gate remains closed</Text>
      <Text style={s.copy}>Engineering coverage is release-candidate ready, but CitizenAI still does not claim 100% exam alignment. A human reviewer must explicitly approve this exact pack version before any activation or exam-completeness claim.</Text>
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
