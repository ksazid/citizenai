export const theme = {
  color: {
    background: '#F7F8FC',
    surface: '#FFFFFF',
    surfaceMuted: '#F0F3F9',
    text: '#101828',
    textMuted: '#667085',
    border: '#E4E7EC',
    primary: '#3157D5',
    primarySoft: '#EAF0FF',
    teal: '#0F8B8D',
    tealSoft: '#E7F7F5',
    success: '#16835B',
    successSoft: '#E8F7F0',
    warning: '#A46817',
    warningSoft: '#FFF4E5',
    danger: '#B42318',
    dangerSoft: '#FDECEC',
    white: '#FFFFFF',
    shadow: '#101828'
  },
  radius: { sm: 12, md: 18, lg: 24, pill: 999 },
  space: { xs: 6, sm: 10, md: 16, lg: 24, xl: 32, xxl: 44 },
  type: {
    display: 36,
    h1: 30,
    h2: 22,
    h3: 18,
    body: 16,
    small: 13,
    micro: 11
  }
} as const;

export const readinessTone = (score: number) => {
  if (score >= 85) return { label: 'Pass Ready', fg: theme.color.success, bg: theme.color.successSoft };
  if (score >= 75) return { label: 'Nearly Ready', fg: theme.color.teal, bg: theme.color.tealSoft };
  if (score >= 60) return { label: 'Building', fg: theme.color.primary, bg: theme.color.primarySoft };
  return { label: 'Not Ready', fg: theme.color.warning, bg: theme.color.warningSoft };
};
