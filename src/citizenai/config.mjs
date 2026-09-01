export const citizenAiConfig = Object.freeze({
  product: 'CitizenAI',
  market: 'GB',
  exam: Object.freeze({
    name: 'Life in the UK Test',
    questionCount: 24,
    durationMinutes: 45,
    passMark: 0.75
  }),
  governance: Object.freeze({
    pesMode: 'lite-single-worker',
    multiAgentEnabled: false,
    humanContentApprovalRequired: true,
    humanReleaseApprovalRequired: true
  }),
  productRules: Object.freeze([
    'Am I ready?',
    'What should I study now?',
    'Why did I get this wrong?'
  ])
});
