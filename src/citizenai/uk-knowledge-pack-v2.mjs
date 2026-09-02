import { createSource, createConcept, createFact, validateQuestionProvenance } from './knowledge.mjs';
import { UK_PACK_V1, validateUkPackV1 } from './uk-knowledge-pack-v1.mjs';

const RETRIEVED_AT = '2026-09-02T10:42:00.000Z';
const OFFICIAL_HOSTS = new Set(['www.gov.uk','www.parliament.uk','www.electoralcommission.org.uk','www.nationalarchives.gov.uk','service-manual.ons.gov.uk','www.supremecourt.uk']);

export const UK_PACK_V2_MANIFEST = Object.freeze({
  id: 'GB-2026.09.02-coverage.2',
  countryCode: 'GB',
  version: '2026.09.02-coverage.2',
  status: 'review',
  independentlyAuthored: true,
  basePackId: UK_PACK_V1.manifest.id,
  copyrightPolicy: 'No copied or translated Guide for New Residents text. Facts and questions are independently authored from official public sources.',
  sourceFingerprintBasis: 'canonical URL + source title fingerprint in this review build; full source-body snapshot hashing remains an activation prerequisite',
  coverage: Object.freeze({
    status: 'expanded_review',
    officialGuideAligned: false,
    examComplete: false,
    activationAllowed: false,
    publicSourceConceptCount: 39,
    questionCount: 117,
    openGaps: Object.freeze([
      'broader pre-1066 and medieval chronology',
      'broader Tudor/Stuart social and political history',
      'empire, decolonisation and migration breadth',
      'arts, literature, science, sport and cultural canon',
      'nation-specific customs, patron saints and national days',
      'full-source-body snapshot hashing and exact-version human coverage certification'
    ]),
    reason: 'GOV.UK states the test is based only on the official Guide for New Residents. This pack expands verified public-source coverage but cannot claim complete exam alignment without licensed/authorised coverage certification.'
  }),
  generatedAt: RETRIEVED_AT
});

const sourceRows = [
  ["src-parliament-constitution", "https://www.parliament.uk/site-information/glossary/constitution/", "UK Parliament — Constitution", "public_authority", false, "ea45316fe31678f884517f8ba3fd416f7709d0031ff140e9e6dff8f5c5f27348"],
  ["src-parliament-sovereignty", "https://www.parliament.uk/about/how/sovereignty/", "UK Parliament — Parliamentary sovereignty", "public_authority", false, "f4905c08403ad122334792b823ff6cf2865c6fc8a1df2514ac31a2cbd6bc9e28"],
  ["src-parliament-crown", "https://www.parliament.uk/about/how/role/relations-with-other-institutions/parliament-crown/", "UK Parliament — Parliament and Crown", "public_authority", false, "e615eeddd8a010cb44ce49d6d2c433ea89bf6197937684a44a9664d283f148ef"],
  ["src-parliament-royal-assent", "https://www.parliament.uk/about/how/laws/passage-bill/commons/coms-royal-assent/", "UK Parliament — Royal Assent", "public_authority", false, "056dba8041561c601a290cb0b51c843415b3c94d46896176fafc898e6dcb66cb"],
  ["src-parliament-government-opposition", "https://www.parliament.uk/about/mps-and-lords/principal/government-opposition/", "UK Parliament — Government and Opposition roles", "public_authority", false, "a05a7cf25badcab16e8ac8f3320bc815878b5c9e02071c8e9dfb095fbb015a8c"],
  ["src-electoral-register", "https://www.electoralcommission.org.uk/voting-and-elections/register-vote", "Electoral Commission — Register to vote", "public_authority", true, "0433d420039be2505dbac95e176de2e2ed342cc4f59d8e966f5fdf6fb27daf31"],
  ["src-electoral-eligibility", "https://www.electoralcommission.org.uk/voting-and-elections/who-can-vote/which-elections-you-can-vote", "Electoral Commission — Which elections you can vote in", "public_authority", true, "554604b7d700fd6da199c6ec1451cccd65503027259d3b3981537de0f1e2c140"],
  ["src-electoral-byelection", "https://www.electoralcommission.org.uk/voting-and-elections/how-elections-work/types-elections/uk-parliamentary-elections", "Electoral Commission — UK parliamentary by-elections", "public_authority", true, "ad3614f33adc63e21083ef49b747e7b52e351cf20d612ba643ad031b24c1ecde"],
  ["src-govuk-local-government", "https://www.gov.uk/government/how-government-works", "GOV.UK — How government works", "government", true, "68fba02ec7f9d72e3cdd03523e894bc58028e26478a901119e5fe4c565d03835"],
  ["src-govuk-jury", "https://www.gov.uk/jury-service/how-jury-service-works", "GOV.UK — How jury service works", "government", true, "52d049242dd04679ce9b24c9470045fcc097b8ed0dcf4f78fddd124a0136caff"],
  ["src-govuk-values", "https://www.gov.uk/government/publications/protecting-what-matters-towards-a-more-confident-cohesive-and-resilient-united-kingdom/protecting-what-matters-towards-a-more-confident-cohesive-and-resilient-united-kingdom", "GOV.UK — Protecting What Matters", "government", true, "11fe51e9cca79105054cc0ab4b9599ead3bf3c12aee30e538eb4290e9605f0dd"],
  ["src-govuk-forb", "https://www.gov.uk/guidance/freedom-of-religion-or-belief-understanding-this-human-right", "GOV.UK — Freedom of religion or belief", "government", true, "2587a9793ded1cf4f0e0e878d39c66e8cdaae316bd4536077e98bea98061a8bb"],
  ["src-na-norman", "https://www.nationalarchives.gov.uk/education/resources/significant-events/norman-conquest-1086/", "The National Archives — Norman Conquest 1086", "public_authority", false, "36d5e38978865936e00f154b0a982714b7d7ad74681ba506bd9e0470d6676b64"],
  ["src-na-domesday", "https://www.nationalarchives.gov.uk/help-with-your-research/research-guides/domesday-book/", "The National Archives — Domesday Book", "public_authority", false, "307539bf378c706432849b248041c8443a97f1a3bb7e5c5daf92f07d611bad3d"],
  ["src-na-tudors", "https://www.nationalarchives.gov.uk/education/resources/archives-live-tudors/archives-live-tudors-tudor-timeline/", "The National Archives — Tudor timeline", "public_authority", false, "32168790e106cec1383fb54435e3bba098cdbf00b2e7d8bb0edaf8dc121a612d"],
  ["src-na-civil-war", "https://www.nationalarchives.gov.uk/education/resources/women-english-civil-wars/", "The National Archives — English Civil Wars", "public_authority", false, "caca6ff2a0c97084409b84ffe77ab6751271aee234a663add74b28131475a354"],
  ["src-parliament-reform-1832", "https://www.parliament.uk/about/living-heritage/evolutionofparliament/houseofcommons/reformacts/overview/reformact1832/", "UK Parliament — Reform Act 1832", "public_authority", false, "ef6047f7778caaa956d93a3f49557c5c2418d7e61ebdf888cce81d0e9bdd9d70"],
  ["src-parliament-franchise-1928", "https://www.parliament.uk/about/living-heritage/transformingsociety/electionsvoting/womenvote/unesco/equal-franchise-act-1928/", "UK Parliament — Equal Franchise Act 1928", "public_authority", false, "059067aca1f84a8b49d07471ebe1e77f718b9ed0a49f7dd7d164520860d5d4e0"],
  ["src-parliament-abolition", "https://www.parliament.uk/about/living-heritage/transformingsociety/tradeindustry/slavetrade/overview/parliament-abolishes-the-slave-trade/", "UK Parliament — Parliament abolishes the slave trade", "public_authority", false, "9114de0e0471e588d0de77050fb619d95e682e762088e663f19f3f444661ac57"],
  ["src-na-industrial", "https://www.nationalarchives.gov.uk/education/sessions-and-resources/?time-period=empire-and-industry", "The National Archives — Empire and Industry", "public_authority", false, "6015103e7e493c23fa4a97807434fd4665bf432d90306bea6a28c10c22eea718"],
  ["src-na-first-world-war", "https://www.nationalarchives.gov.uk/help-with-your-research/research-guides/first-world-war/", "The National Archives — First World War overview", "public_authority", false, "26d9fc074d61077966c5a869c0e11953d9713e0662bf7eb083f4f4dd54cecc88"],
  ["src-na-second-world-war", "https://www.nationalarchives.gov.uk/explore-the-collection/explore-by-time-period/second-world-war/", "The National Archives — Second World War 1939–1945", "public_authority", false, "66ba8910e80d01e1b7398ca1950301a1f7d1608815b5f453400f4ae39bc08b38"],
  ["src-govuk-churchill", "https://www.gov.uk/government/history/past-prime-ministers/winston-churchill", "GOV.UK — Winston Churchill", "government", false, "b9c82715ed831b2a1a0a3756cfdea3937ed81539667aecdb431c6790a9a373e8"],
  ["src-govuk-attlee", "https://www.gov.uk/government/history/past-prime-ministers/clement-attlee", "GOV.UK — Clement Attlee", "government", false, "927baf01bad3cab4d7b92afb72b3a55d01381e3f80a9e7cfc9d076e3a889cfd4"],
  ["src-govuk-union-flag", "https://www.gov.uk/guidance/designated-days-for-union-flag-flying", "GOV.UK — Union Flag flying guidance", "government", true, "a69faa340d485862a34272cb3b84ed75c409bac9b077c6d377590cad5f5fad55"]
];

const extensionSources = sourceRows.map(([id,url,title,sourceType,dynamic,contentHash]) => Object.freeze({
  ...createSource({ id, packId: UK_PACK_V2_MANIFEST.id, url, sourceType, title, retrievedAt: RETRIEVED_AT, contentHash, dynamic, verificationStatus: 'approved' }),
  hashBasis: 'canonical_url_and_title_fingerprint'
}));

const evidenceRows = [
  ["ev-constitution", "src-parliament-constitution", "The UK constitution is not codified in a single document; statutes, conventions, judicial decisions and treaties collectively govern how the UK is run.", "Constitution definition"],
  ["ev-sovereignty", "src-parliament-sovereignty", "Parliamentary sovereignty makes Parliament the supreme legal authority: it can create or end law, courts generally cannot overrule its legislation, and a future Parliament can change earlier laws.", "Parliamentary sovereignty overview"],
  ["ev-crown", "src-parliament-crown", "The Crown, House of Commons and House of Lords are integral parts of Parliament; the Monarch has constitutional roles including opening and dissolving Parliament and approving Bills.", "Parliament and Crown overview"],
  ["ev-royal-assent", "src-parliament-royal-assent", "A Bill that has completed its stages in both Houses requires Royal Assent before it becomes an Act of Parliament.", "Royal Assent overview"],
  ["ev-pm-cabinet", "src-parliament-government-opposition", "The Prime Minister is head of government, is appointed after a general election from the party winning the most seats, chooses government members, and senior ministers form the Cabinet.", "Prime Minister and Cabinet"],
  ["ev-opposition", "src-parliament-government-opposition", "The largest party not in government forms the Official Opposition; its leader and Shadow Cabinet scrutinise government departments and propose alternatives.", "Opposition and Shadow Cabinet"],
  ["ev-register", "src-electoral-register", "A person must be registered to vote before voting; registration is tied to address and should be updated after relevant changes such as moving home.", "Register to vote"],
  ["ev-voting-age", "src-electoral-eligibility", "For UK Parliamentary general elections the voting age is 18 across the UK; some devolved and local elections in Scotland and Wales allow voting from 16.", "Age by election type"],
  ["ev-byelection", "src-electoral-byelection", "A UK parliamentary by-election is held when a House of Commons seat becomes vacant between general elections.", "UK parliamentary by-election definition"],
  ["ev-local-government", "src-govuk-local-government", "Councils make and carry out decisions on local services; local-government structures differ, and some areas use two tiers while others use unitary authorities.", "Local government overview"],
  ["ev-jury", "src-govuk-jury", "In England and Wales a person who receives a jury summons must respond, and a criminal-trial jury normally consists of 12 people; Scotland and Northern Ireland use different rules.", "How jury service works"],
  ["ev-values", "src-govuk-values", "The UK government describes national civic values around democracy, the rule of law, individual liberty, mutual respect and tolerance.", "Shared national values"],
  ["ev-forb", "src-govuk-forb", "Freedom of religion or belief includes holding, changing, practising or having no religion or belief, without coercion or discrimination.", "Freedom of religion or belief"],
  ["ev-norman", "src-na-norman", "The Norman Conquest of England occurred in 1066 under William I and transformed landholding and royal control.", "Norman Conquest background"],
  ["ev-domesday", "src-na-domesday", "Domesday Book is a detailed survey of landed property ordered by William the Conqueror in 1085 and undertaken in 1086; it records landholding and value rather than serving as a population census.", "What is Domesday Book?"],
  ["ev-tudors", "src-na-tudors", "In 1534 Henry VIII made himself Supreme Head of the Church of England; between 1536 and 1539 monasteries and convents were dissolved.", "Tudor timeline"],
  ["ev-civil-war", "src-na-civil-war", "The Civil Wars began in 1642 amid conflict between Charles I and Parliament; Charles I was executed in 1649, and monarchy returned with Charles II in 1660.", "English Civil Wars background"],
  ["ev-reform-1832", "src-parliament-reform-1832", "The 1832 Reform Act redistributed parliamentary seats and broadened the franchise, but property qualifications still excluded most working men.", "Reform Act 1832 overview"],
  ["ev-franchise-1928", "src-parliament-franchise-1928", "The Equal Franchise Act 1928 gave women the parliamentary vote on the same terms as men.", "Equal Franchise Act 1928"],
  ["ev-abolition", "src-parliament-abolition", "The British slave trade was abolished by an Act receiving Royal Assent in 1807; abolition of slavery in the British colonies followed through legislation in 1833.", "Abolition of slave trade"],
  ["ev-industrial", "src-na-industrial", "The Industrial Revolution transformed Britain and changed living and working conditions; nineteenth-century reforms responded to conditions in factories and industrial society.", "Empire and Industry overview"],
  ["ev-first-war", "src-na-first-world-war", "The First World War ran from 1914 to 1918 and generated extensive records across British government and armed-service departments.", "First World War overview"],
  ["ev-second-war", "src-na-second-world-war", "The Second World War ran from 1939 to 1945; British government, armed forces and home-front activity are extensively documented, including VE Day on 8 May 1945.", "Second World War collection"],
  ["ev-churchill", "src-govuk-churchill", "Winston Churchill served as Prime Minister from 1940 to 1945 and again from 1951 to 1955, and led Britain during the Second World War.", "Winston Churchill biography"],
  ["ev-attlee", "src-govuk-attlee", "Clement Attlee served as Prime Minister from 1945 to 1951; his government created the National Health Service and expanded the post-war welfare state and public sector.", "Clement Attlee biography"],
  ["ev-union-flag", "src-govuk-union-flag", "The Union Flag is the national flag of the United Kingdom; the first Union Flag dates from 1606 and the present design dates from 1801.", "Union Flag guidance"]
];
const extensionEvidence = evidenceRows.map(([id,sourceId,evidenceText,locator]) => Object.freeze({ id, sourceId, evidenceText, locator, retrievedAt: RETRIEVED_AT }));

const conceptRows = [
  ["constitution-uncodified", "government", "constitution-uncodified", "UK Constitution", 0.92, 0.58, 4, null, "ev-constitution"],
  ["parliamentary-sovereignty", "government", "parliamentary-sovereignty", "Parliamentary Sovereignty", 0.94, 0.64, 4, null, "ev-sovereignty"],
  ["constitutional-monarchy", "government", "constitutional-monarchy", "Constitutional Monarchy", 0.86, 0.52, 3, null, "ev-crown"],
  ["royal-assent", "government", "royal-assent", "Royal Assent", 0.8, 0.45, 3, null, "ev-royal-assent"],
  ["prime-minister-cabinet", "government", "prime-minister-cabinet", "Prime Minister and Cabinet", 0.92, 0.52, 4, null, "ev-pm-cabinet"],
  ["official-opposition", "government", "official-opposition", "Official Opposition", 0.78, 0.48, 3, null, "ev-opposition"],
  ["electoral-register", "government", "electoral-register", "Electoral Registration", 0.72, 0.4, 3, null, "ev-register"],
  ["voting-age-general-election", "government", "voting-age-general-election", "Voting Age and Election Types", 0.84, 0.46, 3, null, "ev-voting-age"],
  ["by-elections", "government", "by-elections", "Parliamentary By-elections", 0.62, 0.42, 3, null, "ev-byelection"],
  ["local-government", "government", "local-government", "Local Government", 0.75, 0.48, 4, null, "ev-local-government"],
  ["jury-service", "rights", "jury-service", "Jury Service", 0.72, 0.42, 3, null, "ev-jury"],
  ["fundamental-values", "rights", "fundamental-values", "Shared Civic Values", 0.92, 0.44, 3, null, "ev-values"],
  ["freedom-religion-belief", "rights", "freedom-religion-belief", "Freedom of Religion or Belief", 0.82, 0.46, 3, null, "ev-forb"],
  ["norman-conquest", "history", "norman-conquest", "Norman Conquest", 0.84, 0.46, 3, null, "ev-norman"],
  ["domesday-book", "history", "domesday-book", "Domesday Book", 0.72, 0.44, 3, null, "ev-domesday"],
  ["tudor-church", "history", "tudor-church", "Henry VIII and the Church of England", 0.82, 0.52, 4, null, "ev-tudors"],
  ["english-civil-war", "history", "english-civil-war", "English Civil War and Restoration", 0.88, 0.6, 4, null, "ev-civil-war"],
  ["reform-act-1832", "history", "reform-act-1832", "Great Reform Act 1832", 0.76, 0.56, 4, null, "ev-reform-1832"],
  ["equal-franchise-1928", "history", "equal-franchise-1928", "Equal Franchise Act 1928", 0.84, 0.46, 3, null, "ev-franchise-1928"],
  ["abolition-1807", "history", "abolition-1807", "Abolition of the Slave Trade", 0.78, 0.54, 4, null, "ev-abolition"],
  ["industrial-revolution", "history", "industrial-revolution", "Industrial Revolution and Reform", 0.82, 0.52, 4, null, "ev-industrial"],
  ["first-world-war", "history", "first-world-war", "First World War", 0.72, 0.44, 3, null, "ev-first-war"],
  ["second-world-war", "history", "second-world-war", "Second World War", 0.82, 0.46, 3, null, "ev-second-war"],
  ["churchill-war-leadership", "history", "churchill-war-leadership", "Winston Churchill", 0.78, 0.42, 3, null, "ev-churchill"],
  ["attlee-postwar", "history", "attlee-postwar", "Clement Attlee and the Post-war Settlement", 0.74, 0.5, 4, null, "ev-attlee"],
  ["union-flag", "culture", "union-flag", "Union Flag", 0.62, 0.34, 3, null, "ev-union-flag"]
];
const extensionConcepts = conceptRows.map(([id,domainId,key,title,importance,baseDifficulty,studyMinutes,misconceptionCode]) => Object.freeze({
  ...createConcept({ id, domainId, key, title, importance, baseDifficulty, status: 'approved' }), studyMinutes, misconceptionCode
}));

const factCanonical = new Map([
  ["constitution-uncodified", "The UK constitution is uncodified: its constitutional rules come from multiple sources rather than one single constitutional document."],
  ["parliamentary-sovereignty", "Parliamentary sovereignty means Parliament is the UK's supreme legal authority and future Parliaments can change earlier laws."],
  ["constitutional-monarchy", "The UK is a constitutional monarchy: the Monarch performs constitutional functions while elected institutions exercise political and legislative power."],
  ["royal-assent", "A Bill must complete its parliamentary stages and receive Royal Assent before becoming an Act of Parliament."],
  ["prime-minister-cabinet", "The Prime Minister heads the Government, chooses ministers, and senior ministers form the Cabinet."],
  ["official-opposition", "The Official Opposition is the largest party not in government and scrutinises the Government through its leader and Shadow Cabinet."],
  ["electoral-register", "People must be registered to vote before they can vote, and registration details should be kept current."],
  ["voting-age-general-election", "The voting age for UK Parliamentary general elections is 18 across the UK, although some devolved and local elections use a lower age."],
  ["by-elections", "A parliamentary by-election fills a House of Commons seat that becomes vacant between general elections."],
  ["local-government", "Local councils make and carry out decisions about local services, with structures that can be two-tier or unitary."],
  ["jury-service", "Jury service is a civic duty governed by law; in England and Wales a criminal trial jury normally has 12 people."],
  ["fundamental-values", "The UK's civic-value framework emphasises democracy, rule of law, individual liberty, mutual respect and tolerance."],
  ["freedom-religion-belief", "Freedom of religion or belief protects the right to hold, change, practise or have no religion or belief without coercion or discrimination."],
  ["norman-conquest", "The Norman Conquest took place in 1066 under William the Conqueror and transformed landholding and royal control in England."],
  ["domesday-book", "Domesday Book was a late-eleventh-century survey of landholding and value, ordered by William the Conqueror."],
  ["tudor-church", "In 1534 Henry VIII became Supreme Head of the Church of England, and monasteries were dissolved during the following years."],
  ["english-civil-war", "The English Civil War began in 1642 amid conflict between Charles I and Parliament; Charles I was executed in 1649 and monarchy returned in 1660."],
  ["reform-act-1832", "The 1832 Reform Act redistributed seats and broadened the franchise but did not establish universal voting rights."],
  ["equal-franchise-1928", "The Equal Franchise Act 1928 put women and men on equal terms for the parliamentary vote."],
  ["abolition-1807", "Parliament abolished the British slave trade in 1807; slavery in British colonies was addressed later by the 1833 abolition legislation."],
  ["industrial-revolution", "The Industrial Revolution transformed British production and society and led to major changes in living and working conditions."],
  ["first-world-war", "The First World War lasted from 1914 to 1918 and involved extensive British military and government mobilisation."],
  ["second-world-war", "The Second World War lasted from 1939 to 1945; VE Day marked victory in Europe on 8 May 1945."],
  ["churchill-war-leadership", "Winston Churchill served as Prime Minister from 1940 to 1945 and led Britain during the Second World War."],
  ["attlee-postwar", "Clement Attlee was Prime Minister from 1945 to 1951; his government created the NHS and expanded the post-war welfare state."],
  ["union-flag", "The Union Flag is the UK's national flag; its first form dates to 1606 and the present design to 1801."]
]);
const evidenceByConcept = new Map(conceptRows.map(([id,,,,,,,, evidenceId]) => [id, evidenceId]));
const dynamicConcepts = new Set(['electoral-register','voting-age-general-election','by-elections','local-government','jury-service','fundamental-values','freedom-religion-belief','union-flag']);
const extensionFacts = extensionConcepts.map((concept) => createFact({
  id: `fact-${concept.id}`, conceptId: concept.id, canonicalValue: factCanonical.get(concept.id),
  dynamic: dynamicConcepts.has(concept.id), verificationStatus: 'approved', confidence: 1, evidenceIds: [evidenceByConcept.get(concept.id)]
}));

const option = (id,text) => Object.freeze({ id, text });
const questionRows = {
  "constitution-uncodified": [
    ["Which statement best describes the UK constitution?", [["a", "It is contained in one supreme written document"], ["b", "It is uncodified and draws on statutes, conventions, judicial decisions and treaties"], ["c", "It consists only of court judgments"], ["d", "It is rewritten after every general election"]], "b"],
    ["What does 'uncodified constitution' mean in the UK context?", [["a", "There are no constitutional rules"], ["b", "All constitutional rules are secret"], ["c", "The rules are not gathered into one single constitutional document"], ["d", "Only Parliament may read constitutional rules"]], "c"],
    ["Which is one recognised source of the UK constitution?", [["a", "A single constitutional charter"], ["b", "Statutes passed by Parliament"], ["c", "Only local council standing orders"], ["d", "Only party manifestos"]], "b"]
  ],
  "parliamentary-sovereignty": [
    ["What is meant by parliamentary sovereignty?", [["a", "Parliament is the supreme legal authority in the UK"], ["b", "The courts can permanently prevent Parliament changing any law"], ["c", "The Monarch makes laws without Parliament"], ["d", "Local councils can override Acts of Parliament"]], "a"],
    ["Which statement follows from parliamentary sovereignty?", [["a", "A Parliament can bind every future Parliament forever"], ["b", "Future Parliaments can change laws passed by earlier Parliaments"], ["c", "Courts routinely cancel Acts of Parliament"], ["d", "Only referendums can create UK law"]], "b"],
    ["Under the traditional principle of parliamentary sovereignty, what can Parliament do?", [["a", "Create or end laws"], ["b", "Exercise only ceremonial functions"], ["c", "Decide individual criminal verdicts"], ["d", "Directly elect judges"]], "a"]
  ],
  "constitutional-monarchy": [
    ["Which statement best describes the UK's monarchy?", [["a", "The Monarch personally writes government policy"], ["b", "It is a constitutional monarchy"], ["c", "The Monarch is elected every five years"], ["d", "The Monarch is head of the Civil Service only"]], "b"],
    ["Which is a constitutional role of the Monarch connected with Parliament?", [["a", "Approving Bills through Royal Assent"], ["b", "Voting as an MP in the Commons"], ["c", "Chairing local councils"], ["d", "Choosing judges in every court case"]], "a"],
    ["Which three elements form Parliament?", [["a", "Commons, Lords and the Crown"], ["b", "Commons, Cabinet and Supreme Court"], ["c", "Lords, local councils and Cabinet"], ["d", "Crown, police and Civil Service"]], "a"]
  ],
  "royal-assent": [
    ["What must normally happen after a Bill completes its stages in both Houses before it becomes an Act?", [["a", "A local referendum"], ["b", "Royal Assent"], ["c", "A Supreme Court retrial"], ["d", "A Cabinet election"]], "b"],
    ["Royal Assent is best described as what?", [["a", "The Monarch's formal agreement to make a Bill an Act"], ["b", "The House of Commons electing the Prime Minister"], ["c", "The courts approving a budget"], ["d", "A council passing a by-law"]], "a"],
    ["After Royal Assent, a Bill becomes what?", [["a", "A manifesto"], ["b", "An Act of Parliament"], ["c", "A select committee"], ["d", "A constituency"]], "b"]
  ],
  "prime-minister-cabinet": [
    ["What is the Prime Minister's constitutional role?", [["a", "Head of the UK Government"], ["b", "Speaker of the House of Lords"], ["c", "Head of the Supreme Court"], ["d", "Leader of every local council"]], "a"],
    ["Who normally chooses the other members of the Government?", [["a", "The Prime Minister"], ["b", "The Electoral Commission"], ["c", "The Supreme Court"], ["d", "The Speaker of the House of Commons"]], "a"],
    ["What is the Cabinet?", [["a", "A group of senior government ministers"], ["b", "All MPs in Parliament"], ["c", "All judges of the Supreme Court"], ["d", "A committee of local councillors"]], "a"]
  ],
  "official-opposition": [
    ["Which party becomes the Official Opposition?", [["a", "The largest party not in government"], ["b", "The smallest party in Parliament"], ["c", "Every independent MP together"], ["d", "The governing party"]], "a"],
    ["What is a central role of the Official Opposition?", [["a", "Scrutinising and challenging the Government"], ["b", "Administering the courts"], ["c", "Running the Civil Service"], ["d", "Granting Royal Assent"]], "a"],
    ["What does the Shadow Cabinet mainly do?", [["a", "Follows and challenges the work of government departments"], ["b", "Runs local elections"], ["c", "Appoints members of the House of Lords"], ["d", "Controls the armed forces"]], "a"]
  ],
  "electoral-register": [
    ["What must you do before you can vote in an election for which you are eligible?", [["a", "Be registered to vote"], ["b", "Join a political party"], ["c", "Own property"], ["d", "Apply for jury service"]], "a"],
    ["When should a voter normally update their electoral registration?", [["a", "After moving home"], ["b", "After every television debate"], ["c", "Only after a general election"], ["d", "Only when changing political party"]], "a"],
    ["Which statement about electoral registration is correct?", [["a", "You need to register before every single election regardless of changes"], ["b", "Registration is linked to your address and should be updated when relevant details change"], ["c", "Only MPs appear on the electoral register"], ["d", "Registration automatically makes you eligible for every UK election"]], "b"]
  ],
  "voting-age-general-election": [
    ["What is the minimum voting age for a UK Parliamentary general election?", [["a", "16"], ["b", "17"], ["c", "18"], ["d", "21"]], "c"],
    ["Which statement about voting age is correct?", [["a", "Every election in every UK nation has the same voting age"], ["b", "UK Parliamentary general elections use age 18, while some devolved or local elections allow voting at 16"], ["c", "General elections allow voting at 16 everywhere"], ["d", "Only local elections allow voting at 21"]], "b"],
    ["A 16-year-old in Scotland may be able to vote in which type of election before being old enough for a UK general election?", [["a", "Scottish Parliament election"], ["b", "UK Parliamentary general election"], ["c", "House of Lords election"], ["d", "Prime Minister election"]], "a"]
  ],
  "by-elections": [
    ["Why is a UK Parliamentary by-election held?", [["a", "To fill a Commons seat that becomes vacant between general elections"], ["b", "To elect the Prime Minister directly"], ["c", "To appoint members of the House of Lords"], ["d", "To approve the annual Budget"]], "a"],
    ["When can a parliamentary by-election occur?", [["a", "Only on the same day as a general election"], ["b", "Between general elections after a Commons seat becomes vacant"], ["c", "Every year in every constituency"], ["d", "Only after a change of monarch"]], "b"],
    ["Which body is the seat in when a UK Parliamentary by-election is required?", [["a", "House of Commons"], ["b", "House of Lords"], ["c", "Supreme Court"], ["d", "Cabinet"]], "a"]
  ],
  "local-government": [
    ["What is a main role of local councils?", [["a", "Making and carrying out decisions on local services"], ["b", "Passing all UK Acts of Parliament"], ["c", "Appointing the Monarch"], ["d", "Running the Supreme Court"]], "a"],
    ["What is a unitary authority?", [["a", "A single tier of local government providing local-government functions in its area"], ["b", "A committee of the House of Lords"], ["c", "A national court"], ["d", "A political party"]], "a"],
    ["Which is an example of a service commonly associated with local government?", [["a", "Waste collection"], ["b", "Royal Assent"], ["c", "Foreign policy"], ["d", "Declaring war"]], "a"]
  ],
  "jury-service": [
    ["If you receive a jury summons, what should you do?", [["a", "Ignore it unless you want to attend"], ["b", "Respond as required by the summons"], ["c", "Send it to your MP"], ["d", "Register with a political party"]], "b"],
    ["How many people normally sit on a criminal-trial jury in England and Wales?", [["a", "6"], ["b", "8"], ["c", "10"], ["d", "12"]], "d"],
    ["Which statement about jury service is correct?", [["a", "Rules are identical throughout all four UK nations"], ["b", "England and Wales have their own rules, while Scotland and Northern Ireland use different arrangements"], ["c", "Only judges can be jurors"], ["d", "Jury service is a local-election role"]], "b"]
  ],
  "fundamental-values": [
    ["Which is included among the UK's stated civic values?", [["a", "Rule of law"], ["b", "Rule by one political party"], ["c", "Compulsory religion"], ["d", "Government free from scrutiny"]], "a"],
    ["Which set best matches the civic values described by the UK Government?", [["a", "Democracy, rule of law, individual liberty, mutual respect and tolerance"], ["b", "Hereditary voting, censorship and compulsory worship"], ["c", "Military rule, one-party government and no opposition"], ["d", "Property ownership, nobility and compulsory service"]], "a"],
    ["Mutual respect and tolerance in civic life most directly supports what?", [["a", "Living with people of different faiths and beliefs"], ["b", "Banning political disagreement"], ["c", "Removing freedom of belief"], ["d", "Making Parliament unnecessary"]], "a"]
  ],
  "freedom-religion-belief": [
    ["Which freedom is protected by freedom of religion or belief?", [["a", "The freedom to change your religion or belief"], ["b", "The power to force someone else to adopt a belief"], ["c", "The right to discriminate against people with no religion"], ["d", "The right to ban criticism of a religion"]], "a"],
    ["Freedom of religion or belief also protects which choice?", [["a", "Having no religious belief"], ["b", "Only belonging to an established church"], ["c", "Only practising in private"], ["d", "Only following the majority faith"]], "a"],
    ["Which action conflicts with freedom of religion or belief?", [["a", "Coercing someone to change their belief"], ["b", "Respecting a person's decision to hold no religion"], ["c", "Allowing people to practise their faith lawfully"], ["d", "Protecting people from discrimination"]], "a"]
  ],
  "norman-conquest": [
    ["In which year did the Norman Conquest of England take place?", [["a", "1066"], ["b", "1215"], ["c", "1485"], ["d", "1689"]], "a"],
    ["Who is associated with the Norman Conquest of England?", [["a", "William the Conqueror"], ["b", "Henry VIII"], ["c", "Oliver Cromwell"], ["d", "Clement Attlee"]], "a"],
    ["Which later record helps show how landholding changed after the Norman Conquest?", [["a", "Domesday Book"], ["b", "Bill of Rights"], ["c", "Representation of the People Act"], ["d", "NHS Constitution"]], "a"]
  ],
  "domesday-book": [
    ["What was Domesday Book primarily a survey of?", [["a", "Landholding and the value of property"], ["b", "Votes cast in Parliament"], ["c", "Religious beliefs of every resident"], ["d", "Military medals"]], "a"],
    ["Who ordered the survey that became Domesday Book?", [["a", "William the Conqueror"], ["b", "Charles I"], ["c", "Queen Victoria"], ["d", "Winston Churchill"]], "a"],
    ["Which statement about Domesday Book is correct?", [["a", "It was a modern population census"], ["b", "It was undertaken in 1086 after being ordered in 1085"], ["c", "It recorded the 1832 electorate"], ["d", "It was written after the First World War"]], "b"]
  ],
  "tudor-church": [
    ["What major religious-political change is associated with Henry VIII in 1534?", [["a", "He made himself Supreme Head of the Church of England"], ["b", "He restored rule by Charles II"], ["c", "He created the NHS"], ["d", "He passed the Equal Franchise Act"]], "a"],
    ["Which Tudor ruler is associated with the break from papal authority in England?", [["a", "Henry VIII"], ["b", "William I"], ["c", "Charles I"], ["d", "George VI"]], "a"],
    ["What happened to many monasteries and convents under Henry VIII between 1536 and 1539?", [["a", "They were dissolved"], ["b", "They became local councils"], ["c", "They were converted into Parliament"], ["d", "They elected the Prime Minister"]], "a"]
  ],
  "english-civil-war": [
    ["The English Civil War beginning in 1642 was principally a conflict involving whom?", [["a", "Charles I and Parliament"], ["b", "William the Conqueror and Harold"], ["c", "Churchill and Attlee"], ["d", "The Commons and the Supreme Court"]], "a"],
    ["What happened to Charles I in 1649?", [["a", "He was executed"], ["b", "He signed Magna Carta"], ["c", "He became Prime Minister"], ["d", "He founded the NHS"]], "a"],
    ["What happened in 1660 after the period without a king?", [["a", "The monarchy was restored under Charles II"], ["b", "The Norman Conquest began"], ["c", "The Bill of Rights was repealed"], ["d", "Women gained equal voting rights"]], "a"]
  ],
  "reform-act-1832": [
    ["What was one effect of the Reform Act 1832?", [["a", "It redistributed parliamentary seats and broadened the franchise"], ["b", "It gave all adults the vote"], ["c", "It created the NHS"], ["d", "It abolished the House of Lords"]], "a"],
    ["Why was the 1832 Reform Act still limited?", [["a", "Property qualifications meant most working men still could not vote"], ["b", "It allowed only women to vote"], ["c", "It abolished general elections"], ["d", "It transferred all power to local councils"]], "a"],
    ["Which problem was the 1832 Reform Act intended partly to address?", [["a", "Unequal representation and 'rotten boroughs'"], ["b", "The absence of a Supreme Court"], ["c", "The Second World War"], ["d", "Bank holidays"]], "a"]
  ],
  "equal-franchise-1928": [
    ["What did the Equal Franchise Act 1928 achieve?", [["a", "Women gained the parliamentary vote on equal terms with men"], ["b", "It created the first elected House of Lords"], ["c", "It reduced the general-election voting age to 16"], ["d", "It abolished Parliament"]], "a"],
    ["In which year did women gain equal parliamentary voting terms with men?", [["a", "1918"], ["b", "1928"], ["c", "1945"], ["d", "1969"]], "b"],
    ["Why is 1928 an important date in UK voting history?", [["a", "Equal parliamentary franchise for women and men was established"], ["b", "The first Prime Minister was appointed"], ["c", "The Civil War began"], ["d", "The Union Flag was created"]], "a"]
  ],
  "abolition-1807": [
    ["What did the 1807 Act abolish?", [["a", "The British slave trade"], ["b", "All slavery everywhere immediately"], ["c", "The House of Lords"], ["d", "The monarchy"]], "a"],
    ["Which came later than the 1807 abolition of the slave trade?", [["a", "Legislation abolishing slavery in British colonies in 1833"], ["b", "Magna Carta"], ["c", "The Norman Conquest"], ["d", "The Bill of Rights 1689"]], "a"],
    ["Which campaigner is closely associated with parliamentary efforts to abolish the slave trade?", [["a", "William Wilberforce"], ["b", "Clement Attlee"], ["c", "William the Conqueror"], ["d", "Charles I"]], "a"]
  ],
  "industrial-revolution": [
    ["What broad change is associated with the Industrial Revolution in Britain?", [["a", "Expansion of industrial production and major changes in work and living conditions"], ["b", "The Norman takeover of England"], ["c", "The end of Parliament"], ["d", "Creation of the Union Flag in 1606"]], "a"],
    ["Why did factory reform become an issue during industrialisation?", [["a", "Working conditions, including child labour, raised major social concerns"], ["b", "Parliament stopped making laws"], ["c", "The monarchy became elected"], ["d", "Local councils ran foreign policy"]], "a"],
    ["Which nineteenth-century law is associated with regulating child factory work?", [["a", "Factory Act 1833"], ["b", "Bill of Rights 1689"], ["c", "Equal Franchise Act 1928"], ["d", "Human Rights Act 1998"]], "a"]
  ],
  "first-world-war": [
    ["What are the dates of the First World War?", [["a", "1914–1918"], ["b", "1939–1945"], ["c", "1642–1651"], ["d", "1066–1086"]], "a"],
    ["Which British institutions generated extensive official records during the First World War?", [["a", "Government departments and armed services"], ["b", "Only local libraries"], ["c", "Only the House of Lords"], ["d", "Only private companies"]], "a"],
    ["The First World War belongs to which period?", [["a", "Early twentieth century"], ["b", "Norman England"], ["c", "Tudor England"], ["d", "Post-1945 Britain"]], "a"]
  ],
  "second-world-war": [
    ["What are the dates of the Second World War?", [["a", "1939–1945"], ["b", "1914–1918"], ["c", "1688–1689"], ["d", "1807–1833"]], "a"],
    ["What does VE Day commemorate?", [["a", "Victory in Europe in the Second World War"], ["b", "The Norman Conquest"], ["c", "The 1832 Reform Act"], ["d", "The creation of the NHS"]], "a"],
    ["Which date is associated with VE Day in 1945?", [["a", "8 May"], ["b", "1 January"], ["c", "25 March"], ["d", "2 July"]], "a"]
  ],
  "churchill-war-leadership": [
    ["Who became Prime Minister in 1940 and led Britain during much of the Second World War?", [["a", "Winston Churchill"], ["b", "Clement Attlee"], ["c", "Henry VIII"], ["d", "William Wilberforce"]], "a"],
    ["Which pair gives Winston Churchill's two periods as Prime Minister?", [["a", "1940–1945 and 1951–1955"], ["b", "1914–1918 and 1939–1945"], ["c", "1945–1951 and 1964–1970"], ["d", "1832–1837 and 1841–1846"]], "a"],
    ["Winston Churchill is especially associated with which event?", [["a", "British leadership during the Second World War"], ["b", "The Norman Conquest"], ["c", "The dissolution of the monasteries"], ["d", "The Equal Franchise Act 1928"]], "a"]
  ],
  "attlee-postwar": [
    ["Which Prime Minister's government created the NHS after the Second World War?", [["a", "Clement Attlee"], ["b", "Winston Churchill"], ["c", "Henry VIII"], ["d", "Charles I"]], "a"],
    ["When was Clement Attlee Prime Minister?", [["a", "1945–1951"], ["b", "1940–1945"], ["c", "1951–1955"], ["d", "1918–1928"]], "a"],
    ["Which policy development is closely associated with Attlee's government?", [["a", "Creation of the NHS and expansion of the welfare state"], ["b", "The Norman Conquest"], ["c", "Royal Assent"], ["d", "The 1832 Reform Act"]], "a"]
  ],
  "union-flag": [
    ["What is the national flag of the United Kingdom called?", [["a", "The Union Flag"], ["b", "The Commonwealth Banner"], ["c", "The Parliamentary Standard"], ["d", "The Royal Assent Flag"]], "a"],
    ["When does the present design of the Union Flag date from?", [["a", "1801"], ["b", "1066"], ["c", "1215"], ["d", "1948"]], "a"],
    ["Which statement about the Union Flag is correct?", [["a", "The first Union Flag dates from 1606 and the current design from 1801"], ["b", "It was first created in 1945"], ["c", "It represents only England"], ["d", "It is the flag of the House of Commons only"]], "a"]
  ]
};

const difficultyByConcept = new Map([["constitution-uncodified", 0.56], ["parliamentary-sovereignty", 0.62], ["constitutional-monarchy", 0.48], ["royal-assent", 0.42], ["prime-minister-cabinet", 0.5], ["official-opposition", 0.46], ["electoral-register", 0.38], ["voting-age-general-election", 0.44], ["by-elections", 0.4], ["local-government", 0.46], ["jury-service", 0.4], ["fundamental-values", 0.42], ["freedom-religion-belief", 0.44], ["norman-conquest", 0.44], ["domesday-book", 0.42], ["tudor-church", 0.5], ["english-civil-war", 0.58], ["reform-act-1832", 0.54], ["equal-franchise-1928", 0.44], ["abolition-1807", 0.52], ["industrial-revolution", 0.5], ["first-world-war", 0.42], ["second-world-war", 0.44], ["churchill-war-leadership", 0.4], ["attlee-postwar", 0.46], ["union-flag", 0.32]]);
const extensionQuestions = Object.freeze(extensionConcepts.flatMap((concept) => {
  const rows = questionRows[concept.id];
  const explanation = factCanonical.get(concept.id);
  const factId = `fact-${concept.id}`;
  return rows.map(([stem, options, correctOptionId], index) => Object.freeze({
    id: `${concept.id}-verified-q${index + 1}`, conceptId: concept.id, factId, packVersion: UK_PACK_V2_MANIFEST.version,
    questionType: 'multiple_choice', stem, options: options.map(([id,text]) => option(id,text)), correctOptionId,
    difficulty: Math.min(1, difficultyByConcept.get(concept.id) + index * 0.04),
    variantId: `${concept.id}-verified-v${index + 1}`, explanation, misconceptionCode: concept.misconceptionCode ?? null,
    status: 'approved', provenanceStatus: 'verified'
  }));
}));

const remapBaseSources = UK_PACK_V1.sources.map((source) => Object.freeze({ ...source, packId: UK_PACK_V2_MANIFEST.id }));
export const UK_PACK_V2 = Object.freeze({
  manifest: UK_PACK_V2_MANIFEST,
  sources: Object.freeze([...remapBaseSources, ...extensionSources]),
  evidence: Object.freeze([...UK_PACK_V1.evidence, ...extensionEvidence]),
  concepts: Object.freeze([...UK_PACK_V1.concepts, ...extensionConcepts]),
  facts: Object.freeze([...UK_PACK_V1.facts, ...extensionFacts]),
  questions: Object.freeze([...UK_PACK_V1.questions, ...extensionQuestions])
});

export function validateUkPackV2() {
  const errors = [];
  const base = validateUkPackV1();
  if (!base.ok) errors.push(...base.errors.map((e) => `base:${e}`));
  const idsUnique = (rows) => new Set(rows.map((x) => x.id)).size === rows.length;
  for (const [name,rows] of [['sources',UK_PACK_V2.sources],['evidence',UK_PACK_V2.evidence],['concepts',UK_PACK_V2.concepts],['facts',UK_PACK_V2.facts],['questions',UK_PACK_V2.questions]]) {
    if (!idsUnique(rows)) errors.push(`duplicate_${name}_id`);
  }
  for (const source of UK_PACK_V2.sources) {
    let host; try { host = new URL(source.url).host; } catch { errors.push(`invalid_source_url:${source.id}`); continue; }
    if (!OFFICIAL_HOSTS.has(host)) errors.push(`unapproved_source_host:${source.id}:${host}`);
    if (source.verificationStatus !== 'approved') errors.push(`source_not_approved:${source.id}`);
  }
  const evidenceById = new Map(UK_PACK_V2.evidence.map((e) => [e.id,e]));
  const sourcesById = new Map(UK_PACK_V2.sources.map((s) => [s.id,s]));
  for (const evidence of UK_PACK_V2.evidence) {
    if (!sourcesById.has(evidence.sourceId)) errors.push(`evidence_source_missing:${evidence.id}`);
  }
  const factsById = new Map(UK_PACK_V2.facts.map((f) => [f.id,f]));
  for (const fact of UK_PACK_V2.facts) {
    if (fact.verificationStatus !== 'approved' || fact.confidence !== 1 || fact.evidenceIds.length === 0) errors.push(`fact_not_publishable:${fact.id}`);
    for (const evidenceId of fact.evidenceIds) {
      const ev = evidenceById.get(evidenceId);
      if (!ev) errors.push(`fact_evidence_missing:${fact.id}:${evidenceId}`);
      else if (!sourcesById.has(ev.sourceId)) errors.push(`fact_source_missing:${fact.id}:${ev.sourceId}`);
    }
  }
  const stems = new Set();
  for (const question of UK_PACK_V2.questions) {
    const validation = validateQuestionProvenance({ question, factsById });
    if (!validation.ok) errors.push(`question_provenance:${question.id}:${validation.reason}`);
    if (!Array.isArray(question.options) || question.options.length !== 4) errors.push(`question_options:${question.id}`);
    if (!question.options.some((o) => o.id === question.correctOptionId)) errors.push(`question_correct_option:${question.id}`);
    if (stems.has(question.stem)) errors.push(`duplicate_question_stem:${question.id}`);
    stems.add(question.stem);
  }
  if (UK_PACK_V2.concepts.length < 35) errors.push('coverage_concept_floor');
  if (UK_PACK_V2.questions.length < 100) errors.push('coverage_question_floor');
  if (UK_PACK_V2.manifest.coverage.examComplete || UK_PACK_V2.manifest.coverage.activationAllowed) errors.push('coverage_gate_must_remain_closed');
  return Object.freeze({
    ok: errors.length === 0, errors: Object.freeze(errors),
    counts: Object.freeze({ sources: UK_PACK_V2.sources.length, evidence: UK_PACK_V2.evidence.length, concepts: UK_PACK_V2.concepts.length, facts: UK_PACK_V2.facts.length, questions: UK_PACK_V2.questions.length })
  });
}
