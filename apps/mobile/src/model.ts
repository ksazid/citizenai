export const SCREEN_IDS = [
  'welcome',
  'test-setup',
  'diagnostic',
  'diagnostic-result',
  'home',
  'today-plan',
  'learn-concept',
  'compare-concepts',
  'recall',
  'question',
  'answer-explanation',
  'session-complete',
  'progress-overview',
  'domain-detail',
  'concept-detail',
  'mock-intro',
  'mock-question',
  'mock-review',
  'mock-result',
  'pass-ready',
  'maintenance-review',
  'exam-countdown',
  'exam-day',
  'exam-result',
  'passed',
  'failed',
  'profile',
  'source-info'
] as const;

export type ScreenId = (typeof SCREEN_IDS)[number];
export type TabId = 'home' | 'learn' | 'progress' | 'profile';

export const TAB_TARGETS: Record<TabId, ScreenId> = {
  home: 'home',
  learn: 'today-plan',
  progress: 'progress-overview',
  profile: 'profile'
};

export type Navigator = (screen: ScreenId) => void;

export const studyItems = [
  { title: 'Parliament vs Government', meta: '4 min · Compare', screen: 'compare-concepts' as ScreenId },
  { title: 'Magna Carta', meta: '3 min · Recall', screen: 'recall' as ScreenId },
  { title: 'UK Elections', meta: '4 min · Learn', screen: 'learn-concept' as ScreenId },
  { title: 'Quick recall', meta: '3 min · Practice', screen: 'question' as ScreenId }
];

export const domains = [
  { name: 'Government', score: 61, weak: 4 },
  { name: 'History', score: 68, weak: 3 },
  { name: 'Rights', score: 82, weak: 1 },
  { name: 'Culture', score: 91, weak: 0 }
];
