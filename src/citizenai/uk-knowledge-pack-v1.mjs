import { createCountryPack, createSource, createConcept, createFact, validateQuestionProvenance } from './knowledge.mjs';

const RETRIEVED_AT = '2026-09-02T08:42:00.000Z';
const OFFICIAL_HOSTS = new Set([
  'www.gov.uk',
  'www.parliament.uk',
  'www.electoralcommission.org.uk',
  'service-manual.ons.gov.uk',
  'www.supremecourt.uk'
]);

export const UK_PACK_MANIFEST = Object.freeze({
  id: 'GB-2026.09.02-foundation.1',
  countryCode: 'GB',
  version: '2026.09.02-foundation.1',
  status: 'review',
  independentlyAuthored: true,
  copyrightPolicy: 'No copied or translated handbook text. Canonical facts and questions are independently authored from official public sources.',
  coverage: Object.freeze({
    status: 'foundation',
    officialGuideAligned: false,
    examComplete: false,
    activationAllowed: false,
    reason: 'GOV.UK states the test is based on the official Guide for New Residents. This public-source pack is verified but full guide coverage has not yet been certified.'
  }),
  examContract: Object.freeze({ questions: 24, minutes: 45, passMark: 0.75, sourceId: 'src-govuk-test' }),
  monitoring: Object.freeze({ dynamicSources: ['src-govuk-test', 'src-govuk-bankholidays'], staticSourcesUseChangeDetection: true }),
  generatedAt: RETRIEVED_AT
});

export const UK_COUNTRY_PACK = createCountryPack({
  id: UK_PACK_MANIFEST.id,
  countryCode: 'GB',
  version: UK_PACK_MANIFEST.version,
  status: UK_PACK_MANIFEST.status,
  effectiveFrom: null,
  publishedAt: null
});

const sourceRows = [
  ['src-govuk-test', 'https://www.gov.uk/life-in-the-uk-test/what-happens-test', 'GOV.UK — Life in the UK Test: What happens at the test', 'government', true, 'd9eadcdf4694de21da867e877fbb1d484d20fc2a2d7988452a9501afee9aef23'],
  ['src-parliament-relations', 'https://www.parliament.uk/about/how/role/relations-with-other-institutions/parliament-government/', 'UK Parliament — Parliament and the Government', 'public_authority', false, 'b371da567883d6e65962e7f054792a48e6c2b5c26bbe7b6c519e71aa76747ffb'],
  ['src-parliament-role', 'https://www.parliament.uk/about/how/role/', 'UK Parliament — What is the role of Parliament?', 'public_authority', false, '22a1ab937a21466746dae19817fbe292f46700db6b8b7c1b4c9092503bfbefdc'],
  ['src-parliament-lords', 'https://www.parliament.uk/about/faqs/house-of-lords-faqs/role/', 'UK Parliament — Role and work of the House of Lords', 'public_authority', false, 'e04015bceaaa5584d1f1ca73873cc75a7f3a4828253f1001a2656fc871df7687'],
  ['src-electoral-fptp', 'https://www.electoralcommission.org.uk/resources/resources-young-people/who-responsible/uk-parliament/how-mps-are-elected', 'Electoral Commission — How MPs are elected', 'public_authority', false, '323fc852e509b06c50fffbaa421ff30715f458d41d3b1ff0a69fc8c1bba43850'],
  ['src-govuk-devolution', 'https://www.gov.uk/government/collections/devolution-scotland-wales-and-northern-ireland', 'GOV.UK — Devolution: Scotland, Wales and Northern Ireland', 'government', false, '9f3539c51105589990743f5813d32fc0c50682be9c227d0cb0a819a335630b6c'],
  ['src-parliament-magna', 'https://www.parliament.uk/about/living-heritage/evolutionofparliament/originsofparliament/birthofparliament/overview/magnacarta/', 'UK Parliament — Magna Carta', 'public_authority', false, 'bf8a6b08557b0406cf58b7b532c57eee5ed1964b6ff1a23b37588f9c4297efc3'],
  ['src-parliament-bor', 'https://www.parliament.uk/about/living-heritage/evolutionofparliament/parliamentaryauthority/revolution/overview/billofrights/', 'UK Parliament — The Convention and Bill of Rights', 'public_authority', false, '0c590f8dbbaa455203e997362c44e24e72a5e400d9953e9065602a0fbf8832a5'],
  ['src-parliament-union', 'https://www.parliament.uk/about/living-heritage/evolutionofparliament/legislativescrutiny/act-of-union-1707/', 'UK Parliament — Act of Union 1707', 'public_authority', false, 'c15ff0d66120d3d0e69e3dc3599aa35875d620dd183e15edd7b125ef88ef4fc0'],
  ['src-parliament-suffrage', 'https://www.parliament.uk/about/living-heritage/transformingsociety/electionsvoting/womenvote/parliamentary-collections/collections-the-vote-and-after/representation-of-the-people-act-1918/', 'UK Parliament — Representation of the People Act 1918', 'public_authority', false, 'f0c959d1d3ca9cbb6c6403f59513458d8e7dde5a6a424188183b854081891a00'],
  ['src-ons-uk', 'https://service-manual.ons.gov.uk/content/language/countries-and-regions', 'ONS — UK and constituent countries', 'public_authority', false, 'aef408de20cecfe492bdab8be754410abbbbc63d92e3081e3957e0480b0a9eb0'],
  ['src-supreme-role', 'https://www.supremecourt.uk/about-the-court/role-of-the-supreme-court', 'UK Supreme Court — Role of the Supreme Court', 'public_authority', false, '4416f5f9fbda07764dad34fe250e2801d61b2041019e998d54f438536cfd5e30'],
  ['src-govuk-bankholidays', 'https://www.gov.uk/bank-holidays', 'GOV.UK — UK bank holidays', 'government', true, '66e5f20473748507f371ee4b1fb75e0996537bed36a4bf4e72b8880ec704652d']
];

export const UK_SOURCES = Object.freeze(sourceRows.map(([id, url, title, sourceType, dynamic, contentHash]) => createSource({
  id, packId: UK_COUNTRY_PACK.id, url, sourceType, title, retrievedAt: RETRIEVED_AT, contentHash, dynamic, verificationStatus: 'approved'
})));

const evidenceRows = [
  ['ev-test', 'src-govuk-test', 'The official test allows 45 minutes for 24 questions and requires a score of at least 75% to pass.', 'Test format and pass result sections'],
  ['ev-parliament-government', 'src-parliament-relations', 'Parliament and Government are separate institutions: Government runs the country day to day, while Parliament makes laws, represents people and holds Government to account.', 'Parliament and Government overview'],
  ['ev-parliament-role', 'src-parliament-role', 'Parliament scrutinises Government, makes and changes laws, debates issues, and checks and approves public spending and taxation.', 'Main functions of Parliament'],
  ['ev-lords', 'src-parliament-lords', 'The House of Lords is the second chamber of Parliament and works with the Commons on legislation and scrutiny.', 'What does the House of Lords do?'],
  ['ev-elections', 'src-electoral-fptp', 'MPs are elected to the House of Commons using First Past the Post; each constituency elects one MP and voters choose a candidate rather than directly electing the Prime Minister.', 'How MPs are elected'],
  ['ev-devolution', 'src-govuk-devolution', 'Devolution transfers statutory powers from the UK Parliament and Government to legislatures and governments in Scotland, Wales and Northern Ireland.', 'Devolution information'],
  ['ev-magna', 'src-parliament-magna', 'Magna Carta was first issued in 1215 and established in writing the principle that the king and his government were not above the law.', 'Magna Carta overview'],
  ['ev-bor', 'src-parliament-bor', 'The Bill of Rights took statutory effect in 1689 and affirmed parliamentary liberties and limits on royal power.', 'Declaration and Bill of Rights'],
  ['ev-union', 'src-parliament-union', 'The Acts of Union passed by the English and Scottish Parliaments created Great Britain in 1707 and a single Parliament.', 'Act of Union 1707 overview'],
  ['ev-suffrage', 'src-parliament-suffrage', 'The Representation of the People Act 1918 greatly widened the electorate, including women over 30 who met specified property qualifications and almost all men over 21.', 'Representation of the People Act 1918'],
  ['ev-uk-nations', 'src-ons-uk', 'The UK is made up of England, Northern Ireland, Scotland and Wales; Great Britain is England, Scotland and Wales.', 'UK and constituent countries'],
  ['ev-supreme', 'src-supreme-role', 'The Supreme Court is the final court of appeal for UK civil cases and for criminal cases from England, Wales and Northern Ireland, and hears points of law of general public importance.', 'Role of the Supreme Court'],
  ['ev-bankholidays', 'src-govuk-bankholidays', 'Bank holidays differ across England and Wales, Scotland, and Northern Ireland; when a bank holiday falls on a weekend, a substitute weekday is normally used.', 'UK bank holiday rules and regional lists']
];

export const UK_EVIDENCE = Object.freeze(evidenceRows.map(([id, sourceId, evidenceText, locator]) => Object.freeze({
  id, sourceId, evidenceText, locator, retrievedAt: RETRIEVED_AT
})));

const conceptRows = [
  ['parliament-government', 'government', 'parliament-government', 'Parliament vs Government', 1.00, 0.62, 4, 'parliament_government_reversal'],
  ['parliament-role', 'government', 'parliament-role', 'Role of Parliament', 0.95, 0.55, 4, null],
  ['commons-lords', 'government', 'commons-lords', 'Commons and Lords', 0.86, 0.50, 4, 'commons_lords_reversal'],
  ['elections-fptp', 'government', 'elections-fptp', 'General Elections and First Past the Post', 0.95, 0.55, 4, 'direct_pm_election'],
  ['devolution', 'government', 'devolution', 'Devolution', 0.85, 0.58, 4, null],
  ['rule-of-law', 'rights', 'rule-of-law', 'Rule of Law', 0.95, 0.52, 3, null],
  ['supreme-court', 'rights', 'supreme-court', 'UK Supreme Court', 0.74, 0.62, 4, null],
  ['magna-carta', 'history', 'magna-carta', 'Magna Carta', 0.85, 0.50, 3, null],
  ['bill-of-rights', 'history', 'bill-of-rights', 'Bill of Rights 1689', 0.80, 0.62, 4, null],
  ['union-1707', 'history', 'union-1707', 'Acts of Union 1707', 0.80, 0.55, 4, null],
  ['suffrage-1918', 'history', 'suffrage-1918', 'Representation of the People Act 1918', 0.85, 0.58, 4, null],
  ['uk-nations', 'culture', 'uk-nations', 'UK Nations and Great Britain', 0.80, 0.35, 3, null],
  ['bank-holidays', 'culture', 'bank-holidays', 'Bank Holidays', 0.55, 0.35, 3, null]
];

export const UK_CONCEPTS = Object.freeze(conceptRows.map(([id, domainId, key, title, importance, baseDifficulty, studyMinutes, misconceptionCode]) => Object.freeze({
  ...createConcept({ id, domainId, key, title, importance, baseDifficulty, status: 'approved' }),
  studyMinutes,
  misconceptionCode
})));

const factRows = [
  ['fact-parliament-government', 'parliament-government', 'Government manages day-to-day administration; Parliament legislates, represents people and scrutinises Government.', ['ev-parliament-government']],
  ['fact-parliament-role', 'parliament-role', 'Parliament makes and changes laws, scrutinises Government, debates issues, and checks taxation and public spending.', ['ev-parliament-role']],
  ['fact-commons-lords', 'commons-lords', 'The Commons is the elected chamber; the Lords is Parliament’s second chamber and participates in legislation and scrutiny.', ['ev-parliament-government', 'ev-lords']],
  ['fact-elections-fptp', 'elections-fptp', 'UK MPs are elected by constituency using First Past the Post; voters choose an MP candidate, not the Prime Minister directly.', ['ev-elections']],
  ['fact-devolution', 'devolution', 'Devolution gives statutory powers to legislatures and governments in Scotland, Wales and Northern Ireland for devolved matters.', ['ev-devolution']],
  ['fact-rule-of-law', 'rule-of-law', 'A central rule-of-law principle is that rulers and government are subject to law rather than above it.', ['ev-magna']],
  ['fact-supreme-court', 'supreme-court', 'The UK Supreme Court is the final appeal court for UK civil cases and certain criminal cases and focuses on important points of law.', ['ev-supreme']],
  ['fact-magna-carta', 'magna-carta', 'Magna Carta was first issued in 1215 and is associated with placing legal limits on royal authority.', ['ev-magna']],
  ['fact-bill-of-rights', 'bill-of-rights', 'The Bill of Rights became law in 1689 and affirmed important parliamentary liberties and constraints on royal power.', ['ev-bor']],
  ['fact-union-1707', 'union-1707', 'The 1707 Acts of Union joined England and Scotland into Great Britain and created one Parliament for the new state.', ['ev-union']],
  ['fact-suffrage-1918', 'suffrage-1918', 'The 1918 Representation of the People Act greatly expanded voting rights, enfranchising almost all men over 21 and some women over 30 subject to qualifications.', ['ev-suffrage']],
  ['fact-uk-nations', 'uk-nations', 'The UK consists of England, Scotland, Wales and Northern Ireland; Great Britain consists of England, Scotland and Wales.', ['ev-uk-nations']],
  ['fact-bank-holidays', 'bank-holidays', 'Bank-holiday calendars differ across UK nations, and a weekend bank holiday normally receives a substitute weekday.', ['ev-bankholidays']]
];

export const UK_FACTS = Object.freeze(factRows.map(([id, conceptId, canonicalValue, evidenceIds]) => createFact({
  id, conceptId, canonicalValue, dynamic: conceptId === 'bank-holidays', verificationStatus: 'approved', confidence: 1, evidenceIds
})));

const option = (id, text) => Object.freeze({ id, text });
const variants = {
  'parliament-government': [
    ['Which institution is responsible for making laws and holding the UK Government to account?', [option('p','Parliament'), option('g','The Government'), option('c','The Civil Service'), option('s','The Supreme Court')], 'p'],
    ['Which statement correctly distinguishes Parliament from Government?', [option('a','Government runs the country day to day; Parliament legislates and scrutinises it'), option('b','Parliament runs departments; Government appoints MPs'), option('c','They are the same institution'), option('d','Parliament is part of the Civil Service')], 'a'],
    ['A minister is questioned about a government decision in the House of Commons. What constitutional role is Parliament performing?', [option('a','Scrutiny'), option('b','Judicial appeal'), option('c','Civil-service administration'), option('d','Local-government delivery')], 'a']
  ],
  'parliament-role': [
    ['Which is a core function of the UK Parliament?', [option('a','Making and changing laws'), option('b','Running every government department'), option('c','Appointing judges in every court'), option('d','Managing local council services')], 'a'],
    ['What does Parliament do with government taxation and spending?', [option('a','Checks and approves them'), option('b','Leaves them entirely to ministers'), option('c','Delegates all decisions to courts'), option('d','Sets them through local councils only')], 'a'],
    ['Which group best describes Parliament’s work?', [option('a','Legislation, scrutiny, debate and financial oversight'), option('b','Police operations, prosecutions and sentencing'), option('c','School management, NHS management and licensing'), option('d','Party leadership elections only')], 'a']
  ],
  'commons-lords': [
    ['Which chamber of the UK Parliament contains elected MPs?', [option('a','House of Commons'), option('b','House of Lords'), option('c','Supreme Court'), option('d','Cabinet')], 'a'],
    ['What is the House of Lords?', [option('a','The second chamber of the UK Parliament'), option('b','The elected lower chamber'), option('c','A government department'), option('d','The highest criminal court for Scotland')], 'a'],
    ['Which statement about the two Houses is correct?', [option('a','Commons MPs are elected; the Lords also works on legislation and scrutiny'), option('b','Both Houses are elected in the same general election'), option('c','Only the Lords can make laws'), option('d','The Commons is part of the judiciary')], 'a']
  ],
  'elections-fptp': [
    ['Which voting system is used to elect MPs to the House of Commons?', [option('a','First Past the Post'), option('b','Single Transferable Vote everywhere'), option('c','Direct presidential election'), option('d','Appointment by the House of Lords')], 'a'],
    ['At a UK general election, what does a voter directly choose?', [option('a','A candidate to represent their constituency as MP'), option('b','The Prime Minister'), option('c','A Supreme Court justice'), option('d','A life peer')], 'a'],
    ['Under First Past the Post for Westminster elections, who wins a constituency?', [option('a','The candidate with the most votes'), option('b','The candidate ranked second nationally'), option('c','The party leader automatically'), option('d','The candidate selected by the Lords')], 'a']
  ],
  'devolution': [
    ['What does devolution mean in the UK?', [option('a','Certain powers are granted to legislatures and governments in Scotland, Wales and Northern Ireland'), option('b','All powers are transferred permanently to local councils'), option('c','The UK Parliament is abolished'), option('d','Courts take over policy making')], 'a'],
    ['Which parts of the UK have devolved national legislatures or assemblies?', [option('a','Scotland, Wales and Northern Ireland'), option('b','England only'), option('c','Jersey and Guernsey only'), option('d','Every English county')], 'a'],
    ['A policy area is described as “devolved”. What does that indicate?', [option('a','Decision-making power has been granted away from the central UK institutions for that area'), option('b','Only the monarch may decide it'), option('c','It is outside all law'), option('d','It must be decided by referendum')], 'a']
  ],
  'rule-of-law': [
    ['Which statement best expresses the rule-of-law principle illustrated by Magna Carta?', [option('a','Those who govern are also subject to law'), option('b','Government may ignore law during normal administration'), option('c','Only elected people must obey law'), option('d','Courts answer to political parties')], 'a'],
    ['What is incompatible with the rule of law?', [option('a','A ruler claiming to be above the law'), option('b','Government action being constrained by law'), option('c','Courts applying legal rules'), option('d','Parliament passing legislation')], 'a'],
    ['Why is the idea that government is not above the law constitutionally important?', [option('a','It limits arbitrary public power'), option('b','It removes the need for courts'), option('c','It ends parliamentary scrutiny'), option('d','It makes ministers unelected judges')], 'a']
  ],
  'supreme-court': [
    ['What is a principal role of the UK Supreme Court?', [option('a','Acting as the final court of appeal in the cases within its jurisdiction'), option('b','Writing the government budget'), option('c','Electing MPs'), option('d','Running local councils')], 'a'],
    ['What kind of issues does the Supreme Court especially focus on in appeals?', [option('a','Points of law of general public importance'), option('b','Party manifesto disputes'), option('c','Council tax collection'), option('d','Parliamentary election campaigning')], 'a'],
    ['Which statement about the Supreme Court is correct?', [option('a','It is part of the judiciary, not Parliament or Government'), option('b','It is the second chamber of Parliament'), option('c','It appoints the Cabinet'), option('d','It directly drafts all Acts of Parliament')], 'a']
  ],
  'magna-carta': [
    ['In which year was Magna Carta first issued?', [option('a','1215'), option('b','1066'), option('c','1689'), option('d','1707')], 'a'],
    ['Magna Carta is most closely associated with which constitutional idea?', [option('a','Legal limits on royal power'), option('b','Direct election of the Prime Minister'), option('c','Creation of the devolved governments'), option('d','Universal adult suffrage')], 'a'],
    ['Which monarch was confronted by the barons when Magna Carta was first issued?', [option('a','King John'), option('b','William III'), option('c','Queen Anne'), option('d','George VI')], 'a']
  ],
  'bill-of-rights': [
    ['In which year did the Bill of Rights take statutory effect?', [option('a','1689'), option('b','1215'), option('c','1707'), option('d','1918')], 'a'],
    ['The Bill of Rights 1689 is important mainly because it strengthened which relationship?', [option('a','Parliamentary liberties and limits on royal power'), option('b','Direct rule by government departments'), option('c','Hereditary election of MPs'), option('d','Local councils over Parliament')], 'a'],
    ['Which development is associated with the Bill of Rights 1689?', [option('a','Greater constitutional authority for Parliament'), option('b','Creation of Great Britain by union with Scotland'), option('c','Votes for some women over 30'), option('d','First issue of Magna Carta')], 'a']
  ],
  'union-1707': [
    ['What did the Acts of Union of 1707 create?', [option('a','A united kingdom called Great Britain'), option('b','The United States of America'), option('c','The European Union'), option('d','The Republic of Ireland')], 'a'],
    ['Which two kingdoms were joined politically by the 1707 Acts of Union?', [option('a','England and Scotland'), option('b','England and Northern Ireland'), option('c','Scotland and Ireland'), option('d','Wales and Northern Ireland')], 'a'],
    ['What parliamentary change followed the 1707 union?', [option('a','A single Parliament for Great Britain met at Westminster'), option('b','Parliament was permanently dissolved'), option('c','Every county gained its own national parliament'), option('d','The House of Commons became a court')], 'a']
  ],
  'suffrage-1918': [
    ['What was a major effect of the Representation of the People Act 1918?', [option('a','It greatly widened the parliamentary electorate'), option('b','It abolished Parliament'), option('c','It created the Supreme Court'), option('d','It joined England and Scotland')], 'a'],
    ['Which women gained the parliamentary vote under the 1918 Act?', [option('a','Women over 30 who met specified qualifications'), option('b','All women over 18 without qualification'), option('c','Only women in the House of Lords'), option('d','No women')], 'a'],
    ['Which statement about male voting rights in the 1918 Act is correct?', [option('a','Almost all men over 21 gained the vote'), option('b','Only landowners over 40 could vote'), option('c','Men lost the parliamentary vote'), option('d','Only serving MPs could vote')], 'a']
  ],
  'uk-nations': [
    ['Which four countries make up the UK?', [option('a','England, Scotland, Wales and Northern Ireland'), option('b','England, Scotland, Wales and Ireland'), option('c','England, Wales, Jersey and Guernsey'), option('d','England, Scotland, Isle of Man and Northern Ireland')], 'a'],
    ['What does Great Britain consist of?', [option('a','England, Scotland and Wales'), option('b','England, Scotland, Wales and Northern Ireland'), option('c','England and Wales only'), option('d','Northern Ireland and Scotland only')], 'a'],
    ['Which part of the UK is not part of Great Britain?', [option('a','Northern Ireland'), option('b','England'), option('c','Scotland'), option('d','Wales')], 'a']
  ],
  'bank-holidays': [
    ['Which statement about UK bank holidays is correct?', [option('a','The calendar can differ between England and Wales, Scotland, and Northern Ireland'), option('b','Every UK nation always has exactly the same bank holidays'), option('c','Bank holidays are set by local MPs individually'), option('d','Only Scotland has bank holidays')], 'a'],
    ['What normally happens when a bank holiday falls on a weekend?', [option('a','A substitute weekday becomes the bank holiday'), option('b','The holiday is permanently cancelled'), option('c','Parliament must hold an election'), option('d','All businesses must close for a week')], 'a'],
    ['Why should a learner check the correct UK bank-holiday list for their nation?', [option('a','Some bank holidays differ between the UK nations'), option('b','Bank holidays are chosen by each household'), option('c','There are no official lists'), option('d','Bank holidays apply only to tourists')], 'a']
  ]
};

const factByConcept = new Map(UK_FACTS.map((fact) => [fact.conceptId, fact]));
const explanationByConcept = new Map(UK_FACTS.map((fact) => [fact.conceptId, fact.canonicalValue]));

export const UK_QUESTIONS = Object.freeze(Object.entries(variants).flatMap(([conceptId, rows]) => rows.map(([stem, options, correctOptionId], index) => Object.freeze({
  id: `${conceptId}-q${index + 1}`,
  conceptId,
  factId: factByConcept.get(conceptId).id,
  packVersion: UK_PACK_MANIFEST.version,
  questionType: 'single_choice',
  stem,
  options,
  correctOptionId,
  difficulty: Math.min(0.9, (UK_CONCEPTS.find((c) => c.id === conceptId)?.baseDifficulty ?? 0.5) + index * 0.04),
  variantId: `${conceptId}-v${index + 1}`,
  explanation: explanationByConcept.get(conceptId),
  misconceptionCode: UK_CONCEPTS.find((c) => c.id === conceptId)?.misconceptionCode ?? null,
  status: 'approved',
  provenanceStatus: 'verified'
}))));

export function validateUkPackV1() {
  const errors = [];
  const sourceById = new Map(UK_SOURCES.map((source) => [source.id, source]));
  const evidenceById = new Map(UK_EVIDENCE.map((evidence) => [evidence.id, evidence]));
  const factsById = new Map(UK_FACTS.map((fact) => [fact.id, fact]));
  const conceptsById = new Map(UK_CONCEPTS.map((concept) => [concept.id, concept]));

  for (const source of UK_SOURCES) {
    const host = new URL(source.url).hostname;
    if (!OFFICIAL_HOSTS.has(host)) errors.push(`source_not_official:${source.id}:${host}`);
    if (source.verificationStatus !== 'approved') errors.push(`source_not_approved:${source.id}`);
  }
  for (const evidence of UK_EVIDENCE) {
    if (!sourceById.has(evidence.sourceId)) errors.push(`evidence_source_missing:${evidence.id}`);
    if (!evidence.evidenceText || evidence.evidenceText.length < 20) errors.push(`evidence_too_short:${evidence.id}`);
  }
  for (const fact of UK_FACTS) {
    if (!conceptsById.has(fact.conceptId)) errors.push(`fact_concept_missing:${fact.id}`);
    for (const evidenceId of fact.evidenceIds) if (!evidenceById.has(evidenceId)) errors.push(`fact_evidence_missing:${fact.id}:${evidenceId}`);
  }
  for (const question of UK_QUESTIONS) {
    const result = validateQuestionProvenance({ question, factsById });
    if (!result.ok) errors.push(`question_provenance:${question.id}:${result.reason}`);
    if (question.status !== 'approved' || question.provenanceStatus !== 'verified') errors.push(`question_not_approved:${question.id}`);
    if (new Set(question.options.map((o) => o.id)).size !== question.options.length) errors.push(`duplicate_option_id:${question.id}`);
    if (!question.options.some((o) => o.id === question.correctOptionId)) errors.push(`correct_option_missing:${question.id}`);
  }

  const domains = new Set(UK_CONCEPTS.map((concept) => concept.domainId));
  for (const domain of ['government', 'history', 'rights', 'culture']) if (!domains.has(domain)) errors.push(`domain_missing:${domain}`);
  if (UK_QUESTIONS.length < 24) errors.push('insufficient_mock_pool');
  if (UK_PACK_MANIFEST.coverage.activationAllowed) errors.push('foundation_pack_must_not_activate');

  return Object.freeze({
    ok: errors.length === 0,
    errors: Object.freeze(errors),
    counts: Object.freeze({ sources: UK_SOURCES.length, evidence: UK_EVIDENCE.length, concepts: UK_CONCEPTS.length, facts: UK_FACTS.length, questions: UK_QUESTIONS.length }),
    coverage: UK_PACK_MANIFEST.coverage
  });
}

export const UK_PACK_V1 = Object.freeze({
  manifest: UK_PACK_MANIFEST,
  pack: UK_COUNTRY_PACK,
  sources: UK_SOURCES,
  evidence: UK_EVIDENCE,
  concepts: UK_CONCEPTS,
  facts: UK_FACTS,
  questions: UK_QUESTIONS
});
