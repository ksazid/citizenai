export const theme = {
  color: {
    background: '#F4F7FC',
    backgroundTop: '#EEF4FF',
    surface: '#FFFFFF',
    surfaceMuted: '#F3F6FB',
    surfaceBlue: '#F3F7FF',
    glass: 'rgba(255,255,255,0.76)',
    glassStrong: 'rgba(255,255,255,0.9)',
    glassBorder: 'rgba(255,255,255,0.82)',
    text: '#071B57',
    textMuted: '#66769A',
    textSoft: '#8792AA',
    border: '#E1E8F3',
    borderStrong: '#D3DDEA',
    primary: '#1F5BE8',
    primaryDark: '#0A2E7D',
    primarySoft: '#EAF1FF',
    primaryPale: '#F5F8FF',
    teal: '#16A3A1',
    tealDark: '#0C8E8C',
    tealSoft: '#E9F8F7',
    success: '#119B75',
    successSoft: '#E9F8F2',
    warning: '#A96A15',
    warningSoft: '#FFF5E8',
    danger: '#B42318',
    dangerSoft: '#FDECEC',
    white: '#FFFFFF',
    shadow: '#0B1E54',
    navInactive: '#7D89A2'
  },
  radius: { sm: 12, md: 18, lg: 22, xl: 28, pill: 999 },
  space: { xs: 6, sm: 10, md: 16, lg: 20, xl: 24, xxl: 32, xxxl: 40 },
  type: {
    display: 42,
    h1: 32,
    h2: 25,
    h3: 20,
    body: 17,
    small: 14,
    micro: 12
  },
  shadow: {
    card: {
      shadowColor: '#0B1E54',
      shadowOpacity: 0.07,
      shadowRadius: 22,
      shadowOffset: { width: 0, height: 10 },
      elevation: 4
    },
    soft: {
      shadowColor: '#0B1E54',
      shadowOpacity: 0.06,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 7 },
      elevation: 3
    },
    floating: {
      shadowColor: '#071B57',
      shadowOpacity: 0.16,
      shadowRadius: 28,
      shadowOffset: { width: 0, height: 14 },
      elevation: 10
    }
  },
  motion: {
    pressScale: 0.985,
    fastMs: 140,
    standardMs: 220
  }
} as const;

export const readinessTone = (score: number) => {
  if (score >= 85) return { label: 'Pass Ready', fg: theme.color.success, bg: theme.color.successSoft };
  if (score >= 75) return { label: 'Nearly Ready', fg: theme.color.teal, bg: theme.color.tealSoft };
  if (score >= 60) return { label: 'Building', fg: theme.color.primary, bg: theme.color.primarySoft };
  return { label: 'Not Ready', fg: theme.color.warning, bg: theme.color.warningSoft };
};
