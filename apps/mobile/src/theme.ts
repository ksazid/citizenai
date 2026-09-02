export const theme = {
  color: {
    background: '#FBFCFF',
    surface: '#FFFFFF',
    surfaceMuted: '#F5F7FB',
    surfaceBlue: '#F2F7FF',
    text: '#071B57',
    textMuted: '#66769A',
    textSoft: '#8792AA',
    border: '#E2E9F4',
    borderStrong: '#D6E1F1',
    primary: '#1F5BE8',
    primaryDark: '#123FC9',
    primarySoft: '#EAF1FF',
    primaryPale: '#F5F8FF',
    teal: '#16A3A1',
    tealDark: '#0C8E8C',
    tealSoft: '#E9F8F7',
    success: '#119B91',
    successSoft: '#E9F8F5',
    warning: '#A96A15',
    warningSoft: '#FFF5E8',
    danger: '#B42318',
    dangerSoft: '#FDECEC',
    white: '#FFFFFF',
    shadow: '#0B1E54',
    navInactive: '#8792AA'
  },
  radius: { sm: 12, md: 16, lg: 20, xl: 24, pill: 999 },
  space: { xs: 6, sm: 10, md: 16, lg: 20, xl: 24, xxl: 32, xxxl: 40 },
  type: {
    display: 42,
    h1: 32,
    h2: 25,
    h3: 20,
    body: 16,
    small: 14,
    micro: 12
  },
  shadow: {
    card: {
      shadowColor: '#0B1E54',
      shadowOpacity: 0.08,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 8 },
      elevation: 3
    },
    soft: {
      shadowColor: '#0B1E54',
      shadowOpacity: 0.05,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 5 },
      elevation: 2
    }
  }
} as const;

export const readinessTone = (score: number) => {
  if (score >= 85) return { label: 'Pass Ready', fg: theme.color.success, bg: theme.color.successSoft };
  if (score >= 75) return { label: 'Nearly Ready', fg: theme.color.teal, bg: theme.color.tealSoft };
  if (score >= 60) return { label: 'Building', fg: theme.color.primary, bg: theme.color.primarySoft };
  return { label: 'Not Ready', fg: theme.color.warning, bg: theme.color.warningSoft };
};
