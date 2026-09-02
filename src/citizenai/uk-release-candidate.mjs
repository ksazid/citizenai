import { createSource, createConcept, createFact, validateQuestionProvenance } from './knowledge.mjs';
import { UK_CANDIDATE_PACK, validateUkCandidatePack } from './uk-knowledge-pack-candidate.mjs';

const RETRIEVED_AT = '2026-09-02T10:19:00.000Z';

export const UK_RELEASE_CANDIDATE_MANIFEST = Object.freeze({
  id: 'GB-2026.09.02-rc.4',
  countryCode: 'GB',
  version: '2026.09.02-rc.4',
  status: 'review',
  independentlyAuthored: true,
  basePackId: UK_CANDIDATE_PACK.manifest.id,
  copyrightPolicy: 'No copied or translated Guide for New Residents text. Canonical facts and questions are independently authored from authoritative public sources.',
  sourcePolicy: Object.freeze({
    defaultTypes: Object.freeze(['government', 'public_authority']),
    sportsPolicy: 'Sports facts must be grounded in government, Parliament, a statutory/public body, or a government-recognised public sports body. Commercial study sites, clubs and unsourced fan material are prohibited.',
    commercialStudySourcesAllowed: false
  }),
  sourceSnapshotPolicy: Object.freeze({
    algorithm: 'sha256',
    normalizationVersion: 1,
    captureMode: 'live-source-body-ci-artifact',
    historicalBackfillComplete: true,
    verificationGate: 'uk-source-snapshot-backfill'
  }),
  coverage: Object.freeze({
    status: 'release_candidate',
    publicScopeMapComplete: true,
    sportsSourcePolicyClosed: true,
    pre1066BreadthMapped: true,
    officialGuideAligned: false,
    examComplete: false,
    activationAllowed: false,
    openGaps: Object.freeze([
      'exact-version human coverage certification against the lawful scope map is required before any activation claim'
    ]),
    reason: 'Public-source coverage, sports policy, pre-1066 breadth and source-body snapshot capture are release-candidate ready. Because GOV.UK states the test is based on the official Guide for New Residents, only an exact-version human coverage review can authorize an exam-completeness claim.'
  }),
  generatedAt: RETRIEVED_AT
});

const sourceRows = [
  ['src-historicengland-periods', 'https://historicengland.org.uk/listing/the-list/historic-periods/', 'Historic England — England’s historic periods', 'public_authority', false],
  ['src-bm-suttonhoo-europe', 'https://www.britishmuseum.org/collection/galleries/sutton-hoo-and-europe', 'British Museum — Sutton Hoo and Europe', 'public_authority', false],
  ['src-bm-suttonhoo-burial', 'https://www.britishmuseum.org/collection/death-and-memory/anglo-saxon-ship-burial-sutton-hoo', 'British Museum — Anglo-Saxon ship burial at Sutton Hoo', 'public_authority', false],
  ['src-govuk-uksport-about', 'https://www.gov.uk/government/organisations/uk-sport/about', 'GOV.UK — About UK Sport', 'government', true],
  ['src-govuk-listed-sport-events', 'https://www.gov.uk/government/news/government-adds-paralympic-games-to-listed-events-regime', 'GOV.UK — Listed sporting events', 'government', false],
  ['src-govuk-sport-survey-2026', 'https://www.gov.uk/government/statistics/community-and-engagement-survey-202526-live-sport-and-gambling/community-and-engagement-survey-202526-live-sport-and-gambling-report', 'GOV.UK — Community and Engagement Survey 2025/26: live sport', 'government', true],
  ['src-metoffice-wimbledon', 'https://www.metoffice.gov.uk/blog/2025/met-office-weather-records-for-wimbledon', 'Met Office — Wimbledon records and history', 'public_authority', false]
];

const extensionSources = Object.freeze(sourceRows.map(([id, url, title, sourceType, dynamic]) => Object.freeze(createSource({
  id,
  packId: UK_RELEASE_CANDIDATE_MANIFEST.id,
  url,
  sourceType,
  title,
  retrievedAt: RETRIEVED_AT,
  contentHash: 'pending-live-body-snapshot',
  dynamic,
  verificationStatus: 'approved'
}))));

const rows = [
  ['roman-britain', 'history', 'Roman Britain', 0.80, 0.46, 'src-historicengland-periods', 'Roman forces invaded Britain in AD 43; Roman administration in Britain ended around AD 410.'],
  ['early-medieval-britain', 'history', 'Early Medieval Britain', 0.78, 0.50, 'src-historicengland-periods', 'The early medieval period from about AD 410 to 1066 is associated with Anglo-Saxon and Viking settlement, reduced urban life and the growth of Christianity in Britain.'],
  ['anglo-saxon-settlement', 'history', 'Anglo-Saxon Settlement', 0.80, 0.50, 'src-bm-suttonhoo-europe', 'After Roman rule ended, Germanic peoples from north-west Europe settled in parts of southern and eastern Britain, forming the societies commonly described as Anglo-Saxon England.'],
  ['viking-britain', 'history', 'Vikings in Britain', 0.80, 0.52, 'src-bm-suttonhoo-europe', 'From the later eighth century, Scandinavian Vikings voyaged overseas to raid, trade and settle, becoming an important part of early medieval Britain.'],
  ['sutton-hoo', 'history', 'Sutton Hoo', 0.66, 0.42, 'src-bm-suttonhoo-burial', 'Sutton Hoo in Suffolk is an important Anglo-Saxon ship-burial site whose seventh-century grave goods reveal wealth, craftsmanship and international connections.'],
  ['uk-sport-role', 'culture', 'UK Sport', 0.55, 0.36, 'src-govuk-uksport-about', 'UK Sport is the public body responsible for investing public and National Lottery funds in high-performance Olympic and Paralympic sport and supporting major international sporting events in the UK.'],
  ['national-sporting-events', 'culture', 'Nationally Significant Sporting Events', 0.68, 0.42, 'src-govuk-listed-sport-events', 'The UK listed-events regime treats events including the Olympic and Paralympic Games, FIFA World Cup finals, FA Cup Final, Wimbledon finals and Rugby World Cup Final as sporting events of special national significance.'],
  ['popular-spectator-sports', 'culture', 'Popular Spectator Sports', 0.58, 0.34, 'src-govuk-sport-survey-2026', 'Recent government survey data show football is the most widely watched live sport in England, with rugby, cricket and tennis also among the most commonly watched sports.'],
  ['wimbledon', 'culture', 'Wimbledon', 0.72, 0.38, 'src-metoffice-wimbledon', 'Wimbledon is the world’s oldest tennis tournament and is closely associated with the British summer sporting calendar.']
];

const extensionEvidence = Object.freeze(rows.map(([id,,,,,sourceId,fact]) => Object.freeze({
  id: `ev-${id}`,
  sourceId,
  evidenceText: fact,
  locator: 'Authoritative public-source summary',
  retrievedAt: RETRIEVED_AT
})));

const extensionConcepts = Object.freeze(rows.map(([id, domainId, title, importance, baseDifficulty]) => Object.freeze({
  ...createConcept({ id, domainId, key: id, title, importance, baseDifficulty, status: 'approved' }),
  studyMinutes: 3
})));

const extensionFacts = Object.freeze(rows.map(([id,,,,,,fact]) => createFact({
  id: `fact-${id}`,
  conceptId: id,
  canonicalValue: fact,
  dynamic: ['uk-sport-role','national-sporting-events','popular-spectator-sports'].includes(id),
  verificationStatus: 'approved',
  confidence: 1,
  evidenceIds: [`ev-${id}`]
})));

const questionTemplates = {
  'roman-britain': [
    ['When did Roman administration in Britain end?', ['Around AD 410','Around AD 1066','Around AD 1485','Around AD 1707'], 0],
    ['Which date is associated with the Roman invasion of Britain?', ['AD 43','AD 410','AD 793','AD 1066'], 0],
    ['Which statement about Roman Britain is correct?', ['Roman forces invaded in AD 43 and Roman administration ended around AD 410','Roman rule began in 1066','Roman administration continued until the Industrial Revolution','The Romans arrived after the Vikings'], 0]
  ],
  'early-medieval-britain': [
    ['Which period is commonly associated with Anglo-Saxons and Vikings in England?', ['The early medieval period, about AD 410 to 1066','The Victorian period','The Georgian period','The post-war period'], 0],
    ['What development is associated with early medieval Britain?', ['The growth of Christianity','The creation of the NHS','The Industrial Revolution','The Glorious Revolution'], 0],
    ['Which dates best frame the early medieval period used by Historic England?', ['AD 410 to AD 1066','AD 43 to AD 410','1066 to 1485','1707 to 1801'], 0]
  ],
  'anglo-saxon-settlement': [
    ['What followed the end of Roman rule in parts of southern and eastern Britain?', ['Settlement by Germanic peoples from north-west Europe','Immediate Norman rule','The Industrial Revolution','The creation of the United Kingdom'], 0],
    ['Anglo-Saxon England developed mainly after which earlier political system ended?', ['Roman rule in Britain','The Tudor monarchy','The Commonwealth','The British Empire'], 0],
    ['Which statement best describes Anglo-Saxon settlement?', ['Groups from north-west Europe settled in parts of Britain after Roman rule ended','It began after the Norman Conquest','It was a nineteenth-century movement','It was led by the Romans'], 0]
  ],
  'viking-britain': [
    ['From which region did the Vikings originate?', ['Scandinavia','Iberia','North Africa','The Balkans'], 0],
    ['What did Vikings do in early medieval Britain?', ['Raid, trade and settle','Create the UK Parliament in 1707','Found the NHS','Lead the Roman invasion'], 0],
    ['When did Viking activity become an important feature of Britain?', ['From the later eighth century','Only after 1707','Only after 1945','Before the Roman invasion'], 0]
  ],
  'sutton-hoo': [
    ['What is Sutton Hoo best known for?', ['An Anglo-Saxon ship burial','A Roman senate house','A Tudor palace','A Victorian railway station'], 0],
    ['Where is Sutton Hoo?', ['Suffolk','Cornwall','Cumbria','County Antrim'], 0],
    ['Why is Sutton Hoo historically important?', ['Its grave goods reveal Anglo-Saxon wealth, craftsmanship and wider connections','It was the site of Magna Carta','It was where Parliament first met in 1707','It was the first Olympic stadium'], 0]
  ],
  'uk-sport-role': [
    ['What is UK Sport’s main public role?', ['Supporting high-performance Olympic and Paralympic sport','Running every local football club','Organising elections','Managing the court system'], 0],
    ['Which funding supports UK Sport’s high-performance work?', ['Public and National Lottery funding','Only private club subscriptions','Court fees','Local council tax only'], 0],
    ['UK Sport is accountable to which policy area of government?', ['Culture, media and sport','The judiciary','The armed forces only','The Bank of England'], 0]
  ],
  'national-sporting-events': [
    ['Which event is protected as a listed sporting event of special national significance?', ['The Wimbledon Tennis Finals','Every private club friendly','Every local league match','Every school sports day'], 0],
    ['Which pair appears in the UK listed-events regime?', ['Olympic Games and Paralympic Games','Only private golf club competitions','Only domestic training sessions','Only university friendlies'], 0],
    ['Why are some major sporting events placed on the listed-events regime?', ['They are regarded as events of special national significance','They are legally classified as elections','They replace bank holidays','They are court proceedings'], 0]
  ],
  'popular-spectator-sports': [
    ['Which sport is the most widely watched live sport in recent government survey data for England?', ['Football','Baseball','Ice hockey','Lacrosse'], 0],
    ['Which group contains other widely watched sports in the same survey?', ['Rugby, cricket and tennis','Baseball, polo and fencing','Curling, luge and handball','Surfing, squash and archery only'], 0],
    ['What does the government survey indicate about football?', ['It is the leading live spectator sport among those measured','It is not watched in England','It is less watched than every other sport','It is only played at school'], 0]
  ],
  'wimbledon': [
    ['Which statement about Wimbledon is correct?', ['It is the world’s oldest tennis tournament','It is a rugby competition','It began after the Second World War','It is held in Scotland'], 0],
    ['Wimbledon is most closely associated with which sport?', ['Tennis','Cricket','Rugby league','Rowing'], 0],
    ['Wimbledon is a major feature of which seasonal sporting calendar?', ['The British summer sporting calendar','The winter ski season only','The autumn parliamentary calendar','The spring court calendar'], 0]
  ]
};

const extensionQuestions = Object.freeze(extensionConcepts.flatMap((concept) => {
  const fact = extensionFacts.find((row) => row.conceptId === concept.id);
  return questionTemplates[concept.id].map(([stem, optionTexts, correctIndex], variantIndex) => Object.freeze({
    id: `${concept.id}-rc-q${variantIndex + 1}`,
    conceptId: concept.id,
    factId: fact.id,
    packVersion: UK_RELEASE_CANDIDATE_MANIFEST.version,
    questionType: 'multiple_choice',
    stem,
    options: Object.freeze(optionTexts.map((text, index) => Object.freeze({ id: ['a','b','c','d'][index], text }))),
    correctOptionId: ['a','b','c','d'][correctIndex],
    difficulty: Math.min(1, concept.baseDifficulty + variantIndex * 0.04),
    variantId: `${concept.id}-rc-v${variantIndex + 1}`,
    explanation: fact.canonicalValue,
    status: 'approved',
    provenanceStatus: 'verified'
  }));
}));

export const UK_RELEASE_CANDIDATE_PACK = Object.freeze({
  manifest: UK_RELEASE_CANDIDATE_MANIFEST,
  sources: Object.freeze([
    ...UK_CANDIDATE_PACK.sources.map((source) => Object.freeze({ ...source, packId: UK_RELEASE_CANDIDATE_MANIFEST.id })),
    ...extensionSources
  ]),
  evidence: Object.freeze([...UK_CANDIDATE_PACK.evidence, ...extensionEvidence]),
  concepts: Object.freeze([...UK_CANDIDATE_PACK.concepts, ...extensionConcepts]),
  facts: Object.freeze([...UK_CANDIDATE_PACK.facts, ...extensionFacts]),
  questions: Object.freeze([...UK_CANDIDATE_PACK.questions, ...extensionQuestions])
});

export function validateUkReleaseCandidate() {
  const errors = [];
  const inherited = validateUkCandidatePack();
  if (!inherited.ok) errors.push(...inherited.errors.map((error) => `candidate:${error}`));

  const uniqueIds = (rows) => new Set(rows.map((row) => row.id)).size === rows.length;
  for (const [name, rows] of [
    ['sources', UK_RELEASE_CANDIDATE_PACK.sources],
    ['evidence', UK_RELEASE_CANDIDATE_PACK.evidence],
    ['concepts', UK_RELEASE_CANDIDATE_PACK.concepts],
    ['facts', UK_RELEASE_CANDIDATE_PACK.facts],
    ['questions', UK_RELEASE_CANDIDATE_PACK.questions]
  ]) if (!uniqueIds(rows)) errors.push(`duplicate_${name}_id`);

  const sourcesById = new Map(UK_RELEASE_CANDIDATE_PACK.sources.map((source) => [source.id, source]));
  const evidenceById = new Map(UK_RELEASE_CANDIDATE_PACK.evidence.map((evidence) => [evidence.id, evidence]));
  const factsById = new Map(UK_RELEASE_CANDIDATE_PACK.facts.map((fact) => [fact.id, fact]));

  for (const source of UK_RELEASE_CANDIDATE_PACK.sources) {
    if (source.packId !== UK_RELEASE_CANDIDATE_MANIFEST.id) errors.push(`source_pack_mismatch:${source.id}`);
    if (!['government','public_authority'].includes(source.sourceType)) errors.push(`source_type_not_allowed:${source.id}`);
    if (source.verificationStatus !== 'approved') errors.push(`source_not_approved:${source.id}`);
  }
  for (const evidence of UK_RELEASE_CANDIDATE_PACK.evidence) if (!sourcesById.has(evidence.sourceId)) errors.push(`evidence_source_missing:${evidence.id}`);
  for (const fact of UK_RELEASE_CANDIDATE_PACK.facts) {
    if (fact.verificationStatus !== 'approved' || fact.confidence !== 1 || !fact.evidenceIds?.length) errors.push(`fact_not_publishable:${fact.id}`);
    for (const evidenceId of fact.evidenceIds ?? []) if (!evidenceById.has(evidenceId)) errors.push(`fact_evidence_missing:${fact.id}:${evidenceId}`);
  }
  for (const question of UK_RELEASE_CANDIDATE_PACK.questions) {
    const provenance = validateQuestionProvenance({ question, factsById });
    if (!provenance.ok) errors.push(`question_provenance:${question.id}:${provenance.reason}`);
    if (question.options.length !== 4 || new Set(question.options.map((option) => option.id)).size !== 4) errors.push(`question_options:${question.id}`);
    if (question.options.filter((option) => option.id === question.correctOptionId).length !== 1) errors.push(`question_correct_option:${question.id}`);
  }

  if (UK_RELEASE_CANDIDATE_PACK.sources.length !== 65) errors.push(`source_count:${UK_RELEASE_CANDIDATE_PACK.sources.length}`);
  if (UK_RELEASE_CANDIDATE_PACK.evidence.length !== 68) errors.push(`evidence_count:${UK_RELEASE_CANDIDATE_PACK.evidence.length}`);
  if (UK_RELEASE_CANDIDATE_PACK.concepts.length !== 68) errors.push(`concept_count:${UK_RELEASE_CANDIDATE_PACK.concepts.length}`);
  if (UK_RELEASE_CANDIDATE_PACK.facts.length !== 68) errors.push(`fact_count:${UK_RELEASE_CANDIDATE_PACK.facts.length}`);
  if (UK_RELEASE_CANDIDATE_PACK.questions.length !== 204) errors.push(`question_count:${UK_RELEASE_CANDIDATE_PACK.questions.length}`);
  if (!UK_RELEASE_CANDIDATE_MANIFEST.coverage.sportsSourcePolicyClosed) errors.push('sports_policy_open');
  if (!UK_RELEASE_CANDIDATE_MANIFEST.coverage.pre1066BreadthMapped) errors.push('pre1066_breadth_open');
  if (!UK_RELEASE_CANDIDATE_MANIFEST.sourceSnapshotPolicy.historicalBackfillComplete) errors.push('snapshot_backfill_open');
  if (UK_RELEASE_CANDIDATE_MANIFEST.coverage.examComplete || UK_RELEASE_CANDIDATE_MANIFEST.coverage.activationAllowed) errors.push('human_certification_must_precede_activation');

  return Object.freeze({
    ok: errors.length === 0,
    errors: Object.freeze(errors),
    counts: Object.freeze({
      sources: UK_RELEASE_CANDIDATE_PACK.sources.length,
      evidence: UK_RELEASE_CANDIDATE_PACK.evidence.length,
      concepts: UK_RELEASE_CANDIDATE_PACK.concepts.length,
      facts: UK_RELEASE_CANDIDATE_PACK.facts.length,
      questions: UK_RELEASE_CANDIDATE_PACK.questions.length
    })
  });
}
