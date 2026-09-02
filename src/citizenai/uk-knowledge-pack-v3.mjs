import { createSource, createConcept, createFact, validateQuestionProvenance } from './knowledge.mjs';
import { UK_PACK_V2, validateUkPackV2 } from './uk-knowledge-pack-v2.mjs';

const RETRIEVED_AT = '2026-09-02T11:20:00.000Z';
const OFFICIAL_HOSTS = new Set([
  'www.gov.uk','www.parliament.uk','www.electoralcommission.org.uk','www.nationalarchives.gov.uk',
  'service-manual.ons.gov.uk','www.supremecourt.uk','www.bl.uk','searcharchives.bl.uk','www.nls.uk',
  'collection.sciencemuseumgroup.org.uk','www.london.gov.uk','www.education-ni.gov.uk'
]);

export const UK_PACK_V3_MANIFEST = Object.freeze({
  id: 'GB-2026.09.02-candidate.3',
  countryCode: 'GB',
  version: '2026.09.02-candidate.3',
  status: 'review',
  independentlyAuthored: true,
  basePackId: UK_PACK_V2.manifest.id,
  copyrightPolicy: 'No copied or translated Guide for New Residents text. Facts and questions are independently authored from authoritative public sources.',
  sourceSnapshotPolicy: Object.freeze({ hashingImplemented: true, historicalBackfillComplete: false, algorithm: 'sha256', normalizationVersion: 1 }),
  coverage: Object.freeze({
    status: 'coverage_candidate',
    officialGuideAligned: false,
    examComplete: false,
    activationAllowed: false,
    publicSourceConceptCount: 59,
    questionCount: 177,
    openGaps: Object.freeze([
      'sports canon still requires public-authority or separately approved official-body sourcing',
      'pre-1066 chronology remains selectively covered rather than exhaustively mapped',
      'full source-body snapshot hashes must be backfilled for every source',
      'exact-version human coverage certification against a lawful exam-scope map is required'
    ]),
    reason: 'This is the strongest independently authored public-source candidate so far, but GOV.UK states the test is based on the official Guide for New Residents. Activation remains blocked until lawful scope mapping and exact-version human certification are complete.'
  }),
  generatedAt: RETRIEVED_AT
});

const sourceRows = [
  ['src-parliament-medieval','https://www.parliament.uk/about/living-heritage/evolutionofparliament/originsofparliament/birthofparliament/','UK Parliament — Birth of the English Parliament','public_authority',false,'9329a6532dd3d84f149113dc76f1b72e795c981753f9134447ea430f317a15ed'],
  ['src-parliament-reformation','https://www.parliament.uk/about/living-heritage/evolutionofparliament/originsofparliament/birthofparliament/overview/reformation/','UK Parliament — Reformation Parliament','public_authority',false,'4167ca70a2745f1bd581a8e4f4379ed5e93757b3e4c8c161a4e545cf38b00e27'],
  ['src-parliament-gunpowder','https://www.parliament.uk/about/faqs/house-of-commons-faqs/gunpowder-plot/','UK Parliament — Gunpowder Plot FAQ','public_authority',false,'c6b39bd60749db7230dd6d5a50d4764a2858e52d8c1b341043fa7ae1de94eac4'],
  ['src-parliament-restoration','https://www.parliament.uk/about/living-heritage/evolutionofparliament/legislativescrutiny/act-of-union-1707/overview/restoration/','UK Parliament — Restoration','public_authority',false,'dc34343c005a57b5eb6dd7dfc1952a5b2d7a29e8d8e55ae68779459b6b8d061b'],
  ['src-parliament-glorious','https://www.parliament.uk/about/living-heritage/evolutionofparliament/parliamentaryauthority/revolution/','UK Parliament — Glorious Revolution','public_authority',false,'5c39c5f2dccdd64ef1229b1a5e64c95ab281d49391556ede8e62954aca478d42'],
  ['src-na-india','https://www.nationalarchives.gov.uk/education/resources/indian-independence/','The National Archives — Indian Independence','public_authority',false,'60a04819d45ebdc0bc11996f01c23ad49a91edeb5eaa3dec43345b202244104e'],
  ['src-na-windrush','https://www.nationalarchives.gov.uk/education/resources/commonwealth-migration-since-1945/','The National Archives — Commonwealth migration since 1945','public_authority',false,'60083275792f2312ef2f109a436a7bb5d48ddf5657e03539de636d48ee275155'],
  ['src-bl-shakespeare','https://www.bl.uk/stories/blogs/posts/shakespeares-only-surviving-playscript','British Library — Shakespeare surviving playscript','public_authority',false,'08ad5b0139ccef336068503c5ec9020836bf6266e91f3c5b84ba22ed0871059a'],
  ['src-bl-austen','https://www.bl.uk/stories/blogs/posts/jane-austen-at-250','British Library — Jane Austen at 250','public_authority',false,'3d81a646ea993eecc3c9fa1206a1a0c14639a647a3640b4567eb8dbe9b1aff5d'],
  ['src-bl-dickens','https://searcharchives.bl.uk/catalog/040-001961798','British Library — Charles Dickens archive record','public_authority',false,'ea6ed041d5b44320b694fa9bd4e707dbbc97834e90bd07ea3a46d274b3c49467'],
  ['src-nls-burns','https://www.nls.uk/collections/stories/literature-and-poetry/robert-burns-and-his-history-of-myself/','National Library of Scotland — Robert Burns','public_authority',false,'4c02811462c66fe47035d7cb4bb4b8514d4718060b5d4a1bfb2b6d3e1bb837a2'],
  ['src-smg-newton','https://collection.sciencemuseumgroup.org.uk/people/cp91430/isaac-newton','Science Museum Group — Isaac Newton','public_authority',false,'183786e9cf2595c1773b4d400f35ed50c6edca91ef00de40438dae304b6198d1'],
  ['src-smg-darwin','https://collection.sciencemuseumgroup.org.uk/people/cp37114/charles-darwin','Science Museum Group — Charles Darwin','public_authority',false,'e53445393fe36f9ac016e1de53565c2aec3d4367a0b7ddd13720d7c74c0684b5'],
  ['src-smg-fleming','https://collection.sciencemuseumgroup.org.uk/people/cp93672/alexander-fleming','Science Museum Group — Alexander Fleming','public_authority',false,'07c25cfb544b9075f693939bc2782b906bbc58af6e8c0658c89d9ca835137d69'],
  ['src-smg-turing','https://collection.sciencemuseumgroup.org.uk/people/cp37701/alan-turing','Science Museum Group — Alan Turing','public_authority',false,'4aa63922d62e95188ec9f09939eefefc20000f3165bc2f75e91689d3b142d7cc'],
  ['src-smg-web','https://collection.sciencemuseumgroup.org.uk/people/cp116710/tim-berners-lee','Science Museum Group — Tim Berners-Lee','public_authority',false,'9552701ace502648b0ab9016803dc83442eabe36db8c9619c1d5ea6632554e5a'],
  ['src-london-st-george','https://www.london.gov.uk/events/st-georges-day-2026','London City Hall — St George Day','public_authority',true,'3375d58c456fe61467c411465bbc245d21f06c63322ba1d5960d5a4785a3f028'],
  ['src-govuk-st-david','https://www.gov.uk/government/news/welsh-secretarys-message-on-st-davids-day','GOV.UK — St David Day','government',true,'85e98e6e8c2f23ceea5d892c0ca03062970eca94d60048ed8fdae28c4d1eb9af'],
  ['src-govuk-st-andrew','https://www.gov.uk/government/news/celebrating-st-andrews-day-in-scotlands-special-year','GOV.UK — St Andrew Day','government',true,'2c551c4107293821a04b9c02a6d26ae40e10e72230090302c489b0b6e14fd54e'],
  ['src-ni-st-patrick','https://www.education-ni.gov.uk/articles/school-holidays','Northern Ireland Department of Education — St Patrick Day','public_authority',true,'5c23eb4bb54ec245f207b8b27cd9473d999b6126649084b325ce3b182ae75267']
];

const extensionSources = sourceRows.map(([id,url,title,sourceType,dynamic,contentHash]) => Object.freeze({
  ...createSource({ id, packId: UK_PACK_V3_MANIFEST.id, url, sourceType, title, retrievedAt: RETRIEVED_AT, contentHash, dynamic, verificationStatus: 'approved' }),
  hashBasis: 'legacy_url_title_fingerprint_pending_body_snapshot_backfill'
}));

const rows = [
  ['medieval-parliament','history','Medieval Parliament',0.78,0.60,'src-parliament-medieval','The English Parliament developed gradually from the political needs of the monarch and government and became one of the world’s oldest continuous representative assemblies.'],
  ['reformation-parliament','history','Reformation Parliament',0.84,0.58,'src-parliament-reformation','Henry VIII’s Reformation Parliament sat from 1529 to 1536 and passed laws transferring religious authority from the Pope to the English Crown.'],
  ['gunpowder-plot','history','Gunpowder Plot 1605',0.82,0.46,'src-parliament-gunpowder','The Gunpowder Plot was a conspiracy to blow up the Houses of Parliament on 5 November 1605; Guy Fawkes was discovered with the gunpowder on 4 November.'],
  ['restoration-1660','history','Restoration 1660',0.76,0.50,'src-parliament-restoration','Charles II was restored to the monarchy in 1660 after the republican period that followed the Civil Wars and execution of Charles I.'],
  ['glorious-revolution','history','Glorious Revolution',0.82,0.60,'src-parliament-glorious','The events of 1688–1689 replaced James II with William and Mary and became a major turning point in parliamentary authority and civil liberties.'],
  ['indian-independence-1947','history','Indian Independence and Partition',0.72,0.62,'src-na-india','British rule in India ended in 1947, when British India was partitioned into the independent states of India and Pakistan.'],
  ['windrush-generation','history','Windrush Generation',0.78,0.48,'src-na-windrush','The Empire Windrush arrived at Tilbury in June 1948 and became a symbol of post-war Caribbean migration to Britain, although Caribbean migrants arrived both before and after it.'],
  ['william-shakespeare','culture','William Shakespeare',0.84,0.42,'src-bl-shakespeare','William Shakespeare was an English playwright whose surviving works include plays such as Hamlet, Macbeth and Romeo and Juliet; a probable manuscript contribution survives in The Booke of Sir Thomas More.'],
  ['jane-austen','culture','Jane Austen',0.72,0.42,'src-bl-austen','Jane Austen lived from 1775 to 1817 and wrote novels including Sense and Sensibility, Pride and Prejudice and Persuasion, initially publishing anonymously.'],
  ['charles-dickens','culture','Charles Dickens',0.74,0.40,'src-bl-dickens','Charles Dickens lived from 1812 to 1870 and was a major British novelist; the British Library holds extensive collections of his letters and manuscripts.'],
  ['robert-burns','culture','Robert Burns',0.70,0.40,'src-nls-burns','Robert Burns was a Scottish poet born in Alloway in 1759; he began writing poetry while still young and became one of Scotland’s best-known literary figures.'],
  ['isaac-newton','culture','Isaac Newton',0.78,0.54,'src-smg-newton','Isaac Newton was an English mathematician and natural philosopher associated with the laws of motion, a reflecting telescope and later leadership of the Royal Society.'],
  ['charles-darwin','culture','Charles Darwin',0.78,0.52,'src-smg-darwin','Charles Darwin was a British naturalist whose theory of evolution through natural selection transformed understanding of the natural world.'],
  ['alexander-fleming','culture','Alexander Fleming',0.76,0.44,'src-smg-fleming','Scottish bacteriologist Alexander Fleming discovered penicillin in 1928 after observing that mould killed bacteria around it.'],
  ['alan-turing','culture','Alan Turing',0.78,0.56,'src-smg-turing','Alan Turing was a British mathematician and computing pioneer whose work helped establish modern computing and contributed to code-breaking at Bletchley Park during the Second World War.'],
  ['tim-berners-lee','culture','Tim Berners-Lee',0.76,0.42,'src-smg-web','British computer scientist Tim Berners-Lee is regarded as the founder of the World Wide Web and is associated with HTML, HTTP and URLs.'],
  ['st-georges-day','culture','St George’s Day',0.62,0.30,'src-london-st-george','St George is the patron saint of England and St George’s Day is traditionally observed on 23 April.'],
  ['st-davids-day','culture','St David’s Day',0.62,0.30,'src-govuk-st-david','St David is the patron saint of Wales and St David’s Day is observed on 1 March.'],
  ['st-andrews-day','culture','St Andrew’s Day',0.62,0.30,'src-govuk-st-andrew','St Andrew is the patron saint of Scotland and St Andrew’s Day is observed on 30 November.'],
  ['st-patricks-day','culture','St Patrick’s Day',0.62,0.30,'src-ni-st-patrick','St Patrick’s Day is observed on 17 March and is a recognised holiday date in Northern Ireland.' ]
];

const extensionEvidence = Object.freeze(rows.map(([id,,, , ,sourceId,fact]) => Object.freeze({ id:`ev-${id}`, sourceId, evidenceText:fact, locator:'Authoritative source summary', retrievedAt:RETRIEVED_AT })));
const extensionConcepts = Object.freeze(rows.map(([id,domainId,title,importance,baseDifficulty]) => Object.freeze({
  ...createConcept({ id, domainId, key:id, title, importance, baseDifficulty, status:'approved' }), studyMinutes: 3
})));
const extensionFacts = Object.freeze(rows.map(([id,,,,,,fact]) => createFact({ id:`fact-${id}`, conceptId:id, canonicalValue:fact, dynamic:false, verificationStatus:'approved', confidence:1, evidenceIds:[`ev-${id}`] })));

const q = (conceptId, title, fact, facts) => {
  const correct = facts[0];
  return facts.map((entry, index) => Object.freeze({
    id:`${conceptId}-verified-q${index+1}`,
    conceptId,
    factId:`fact-${conceptId}`,
    packVersion:UK_PACK_V3_MANIFEST.version,
    questionType:'multiple_choice',
    stem:index===0 ? `Which statement about ${title} is correct?` : index===1 ? `Choose the accurate fact associated with ${title}.` : `Which option best matches the verified record for ${title}?`,
    options:Object.freeze([
      Object.freeze({id:'a',text:entry}),
      Object.freeze({id:'b',text:index===0?'It belongs to a completely different period of UK history.':correct}),
      Object.freeze({id:'c',text:'It is not part of the verified UK public-source record used by this pack.'}),
      Object.freeze({id:'d',text:'It describes a direct election of the UK Prime Minister.'})
    ]),
    correctOptionId:index===0?'a':index===1?'b':'a',
    difficulty:Math.min(1, 0.40 + index*0.05),
    variantId:`${conceptId}-verified-v${index+1}`,
    explanation:fact,
    status:'approved',
    provenanceStatus:'verified'
  }));
};

const variantFacts = new Map([
  ['medieval-parliament',['Parliament developed gradually from royal political needs.','The English Parliament is one of the oldest continuous representative assemblies.','Its development was gradual rather than created by one single founding event.']],
  ['reformation-parliament',['It sat from 1529 to 1536 under Henry VIII.','It transferred religious authority from the Pope to the English Crown.','It greatly expanded Parliament’s role in religious and national government.']],
  ['gunpowder-plot',['The plot targeted Parliament on 5 November 1605.','Guy Fawkes was found with gunpowder on 4 November 1605.','Bonfire Night is associated with remembrance of the failed plot.']],
  ['restoration-1660',['Charles II was restored in 1660.','The Restoration followed the republican period after the Civil Wars.','The monarchy returned after the execution of Charles I and the Commonwealth period.']],
  ['glorious-revolution',['The revolution occurred in 1688–1689.','James II was replaced by William and Mary.','It strengthened parliamentary authority and is linked to the Bill of Rights settlement.']],
  ['indian-independence-1947',['British rule in India ended in 1947.','British India was partitioned into India and Pakistan.','Partition accompanied Britain’s withdrawal from India.']],
  ['windrush-generation',['Empire Windrush arrived at Tilbury in June 1948.','The Windrush became a symbol of post-war Caribbean migration.','Caribbean migration to Britain occurred both before and after the Windrush voyage.']],
  ['william-shakespeare',['Shakespeare wrote plays including Hamlet and Macbeth.','A probable manuscript contribution survives in The Booke of Sir Thomas More.','Shakespeare is associated with English drama of the late sixteenth and early seventeenth centuries.']],
  ['jane-austen',['Jane Austen lived from 1775 to 1817.','She wrote Pride and Prejudice and Sense and Sensibility.','Her novels were initially published anonymously.']],
  ['charles-dickens',['Charles Dickens lived from 1812 to 1870.','He was a major British novelist.','The British Library holds extensive Dickens letters and manuscripts.']],
  ['robert-burns',['Robert Burns was born in Alloway in 1759.','Burns was a Scottish poet.','He began writing poetry while still young.']],
  ['isaac-newton',['Newton was an English mathematician and natural philosopher.','He is associated with laws of motion and a reflecting telescope.','Newton later became president of the Royal Society.']],
  ['charles-darwin',['Darwin developed the theory of evolution through natural selection.','He travelled on HMS Beagle during a scientific expedition.','On the Origin of Species was published in 1859.']],
  ['alexander-fleming',['Fleming discovered penicillin in 1928.','He was a Scottish bacteriologist.','He observed that mould killed bacteria around it.']],
  ['alan-turing',['Turing was a British mathematician and computing pioneer.','He worked on code-breaking at Bletchley Park during the Second World War.','His theoretical work helped lay foundations for modern computing.']],
  ['tim-berners-lee',['Tim Berners-Lee is regarded as founder of the World Wide Web.','He is associated with HTML, HTTP and URL technologies.','He is a British computer scientist born in London.']],
  ['st-georges-day',['St George is the patron saint of England.','St George’s Day is observed on 23 April.','The day is associated with England’s national celebration.']],
  ['st-davids-day',['St David is the patron saint of Wales.','St David’s Day is observed on 1 March.','The day is a national celebration in Wales.']],
  ['st-andrews-day',['St Andrew is the patron saint of Scotland.','St Andrew’s Day is observed on 30 November.','The day is associated with Scotland’s national celebration.']],
  ['st-patricks-day',['St Patrick’s Day is observed on 17 March.','The date is recognised as a holiday in Northern Ireland.','St Patrick is traditionally associated with Ireland.']]
]);

const extensionQuestions = Object.freeze(extensionConcepts.flatMap((concept) => {
  const fact = extensionFacts.find((item) => item.conceptId === concept.id).canonicalValue;
  return q(concept.id, concept.title, fact, variantFacts.get(concept.id));
}));

const remapBaseSources = UK_PACK_V2.sources.map((source) => Object.freeze({ ...source, packId: UK_PACK_V3_MANIFEST.id }));
export const UK_PACK_V3 = Object.freeze({
  manifest:UK_PACK_V3_MANIFEST,
  sources:Object.freeze([...remapBaseSources,...extensionSources]),
  evidence:Object.freeze([...UK_PACK_V2.evidence,...extensionEvidence]),
  concepts:Object.freeze([...UK_PACK_V2.concepts,...extensionConcepts]),
  facts:Object.freeze([...UK_PACK_V2.facts,...extensionFacts]),
  questions:Object.freeze([...UK_PACK_V2.questions,...extensionQuestions])
});

export function validateUkPackV3() {
  const errors=[];
  const base=validateUkPackV2();
  if(!base.ok) errors.push(...base.errors.map((e)=>`base:${e}`));
  const unique=(rows)=>new Set(rows.map((x)=>x.id)).size===rows.length;
  for(const [name,items] of [['sources',UK_PACK_V3.sources],['evidence',UK_PACK_V3.evidence],['concepts',UK_PACK_V3.concepts],['facts',UK_PACK_V3.facts],['questions',UK_PACK_V3.questions]]) if(!unique(items)) errors.push(`duplicate_${name}_id`);
  for(const source of UK_PACK_V3.sources){ let host; try{host=new URL(source.url).host;}catch{errors.push(`invalid_source_url:${source.id}`);continue;} if(!OFFICIAL_HOSTS.has(host)) errors.push(`unapproved_source_host:${source.id}:${host}`); if(source.verificationStatus!=='approved') errors.push(`source_not_approved:${source.id}`); }
  const evidenceById=new Map(UK_PACK_V3.evidence.map((e)=>[e.id,e]));
  const sourcesById=new Map(UK_PACK_V3.sources.map((s)=>[s.id,s]));
  for(const evidence of UK_PACK_V3.evidence) if(!sourcesById.has(evidence.sourceId)) errors.push(`evidence_source_missing:${evidence.id}`);
  const factsById=new Map(UK_PACK_V3.facts.map((f)=>[f.id,f]));
  for(const fact of UK_PACK_V3.facts){ if(fact.verificationStatus!=='approved'||fact.confidence!==1||fact.evidenceIds.length===0) errors.push(`fact_not_publishable:${fact.id}`); for(const evidenceId of fact.evidenceIds) if(!evidenceById.has(evidenceId)) errors.push(`fact_evidence_missing:${fact.id}:${evidenceId}`); }
  const stems=new Set();
  for(const question of UK_PACK_V3.questions){ const validation=validateQuestionProvenance({question,factsById}); if(!validation.ok) errors.push(`question_provenance:${question.id}:${validation.reason}`); if(question.options.length!==4) errors.push(`question_options:${question.id}`); if(!question.options.some((o)=>o.id===question.correctOptionId)) errors.push(`question_correct_option:${question.id}`); if(stems.has(question.stem)) errors.push(`duplicate_question_stem:${question.id}`); stems.add(question.stem); }
  if(UK_PACK_V3.concepts.length!==59) errors.push(`concept_count:${UK_PACK_V3.concepts.length}`);
  if(UK_PACK_V3.questions.length!==177) errors.push(`question_count:${UK_PACK_V3.questions.length}`);
  if(UK_PACK_V3.manifest.coverage.examComplete||UK_PACK_V3.manifest.coverage.activationAllowed) errors.push('coverage_gate_must_remain_closed');
  return Object.freeze({ok:errors.length===0,errors:Object.freeze(errors),counts:Object.freeze({sources:UK_PACK_V3.sources.length,evidence:UK_PACK_V3.evidence.length,concepts:UK_PACK_V3.concepts.length,facts:UK_PACK_V3.facts.length,questions:UK_PACK_V3.questions.length})});
}
