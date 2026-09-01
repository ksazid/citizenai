export const citizenAiTokens = Object.freeze({
  color: Object.freeze({
    canvas: '#F7FAFC',
    surface: '#FFFFFF',
    surfaceSubtle: '#EEF5FF',
    textPrimary: '#102A43',
    textSecondary: '#627D98',
    primary: '#2563EB',
    primaryStrong: '#1D4ED8',
    accent: '#0F9F9A',
    border: '#D9E2EC',
    success: '#15803D',
    warning: '#B7791F',
    danger: '#C53030'
  }),
  radius: Object.freeze({ sm: 10, md: 16, lg: 24, pill: 999 }),
  spacing: Object.freeze({ xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 }),
  type: Object.freeze({
    display: Object.freeze({ size: 40, lineHeight: 44, weight: 700 }),
    title: Object.freeze({ size: 28, lineHeight: 34, weight: 700 }),
    heading: Object.freeze({ size: 20, lineHeight: 26, weight: 650 }),
    body: Object.freeze({ size: 16, lineHeight: 24, weight: 400 }),
    caption: Object.freeze({ size: 13, lineHeight: 18, weight: 500 })
  }),
  motion: Object.freeze({ fastMs: 160, standardMs: 240, emphasisMs: 360 })
});

export const citizenAiUiPrinciples = Object.freeze([
  'Readiness is the primary visual hierarchy.',
  'One dominant action per screen.',
  'Use whitespace before adding containers.',
  'Use restrained blue/teal accents; never rely on color alone.',
  'Avoid childish gamification, excessive gradients, and decorative badges.',
  'Motion communicates state change, never decoration.'
]);
