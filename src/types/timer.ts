export interface StageMessage {
  id: string;
  text: string;
  active: boolean;
  flash: boolean;
  createdAt: number;
}

export interface ChurchPreset {
  id: string;
  title: string;
  speaker?: string;
  durationMinutes: number;
  durationSeconds?: number;
  category: 'worship' | 'word' | 'prayer' | 'announcements' | 'offering' | 'custom';
}

export interface ChurchServiceTemplate {
  id: string;
  name: string;
  description: string;
  items: ChurchPreset[];
}

export interface TimerThemeConfig {
  themeId: string;
  themeName: string;
  backgroundStyle: 'pitch-black' | 'midnight-navy' | 'deep-slate' | 'charcoal-bronze' | 'dark-purple';
  countdownColor: string; // e.g. '#10b981'
  warning1Color: string;  // e.g. '#f59e0b'
  warning2Color: string;  // e.g. '#ef4444'
  timeUpColor: string;    // e.g. '#ef4444'
  timeUpText: string;     // e.g. 'Time-up'
  warning1Seconds: number; // default 60
  warning2Seconds: number; // default 30
  showClock: boolean;
  showSpeaker: boolean;
  fontFamily: 'mono' | 'sans' | 'digital';
}

export const DEFAULT_THEME_CONFIG: TimerThemeConfig = {
  themeId: 'classic',
  themeName: 'Classic Sanctuary',
  backgroundStyle: 'pitch-black',
  countdownColor: '#10b981', // green
  warning1Color: '#f59e0b',  // amber
  warning2Color: '#ef4444',  // red
  timeUpColor: '#ef4444',    // red
  timeUpText: 'Time-up',
  warning1Seconds: 60,
  warning2Seconds: 30,
  showClock: true,
  showSpeaker: true,
  fontFamily: 'mono',
};

export interface TimerState {
  roomId: string;
  title: string;
  speaker: string;
  totalDurationSeconds: number;
  remainingSeconds: number;
  isRunning: boolean;
  endsAt: number | null; // epoch timestamp ms
  lastUpdatedAt: number; // epoch timestamp ms
  stageMessage: StageMessage | null;
  isBlackout: boolean;
  overtimeEnabled: boolean;
  soundAlertsEnabled: boolean;
  clockModeEnabled: boolean; // if true when stopped, shows real-time clock
  themeConfig: TimerThemeConfig;
  version: number;
}

export type TimerAction =
  | { type: 'START' }
  | { type: 'PAUSE' }
  | { type: 'RESET' }
  | { type: 'SET_DURATION'; totalSeconds: number; title?: string; speaker?: string }
  | { type: 'ADJUST_TIME'; deltaSeconds: number }
  | { type: 'SET_TITLE'; title: string; speaker?: string }
  | { type: 'SEND_STAGE_MESSAGE'; text: string; flash?: boolean }
  | { type: 'CLEAR_STAGE_MESSAGE' }
  | { type: 'TOGGLE_BLACKOUT'; isBlackout?: boolean }
  | { type: 'TOGGLE_SOUND'; enabled?: boolean }
  | { type: 'TOGGLE_OVERTIME'; enabled?: boolean }
  | { type: 'LOAD_PRESET'; preset: ChurchPreset }
  | { type: 'UPDATE_THEME'; themeConfig: Partial<TimerThemeConfig> };

export type TimerColorStatus = 'green' | 'amber' | 'red' | 'time-up';

export function getTimerColorStatus(
  remainingSeconds: number,
  warning1Seconds: number = 60,
  warning2Seconds: number = 30
): TimerColorStatus {
  if (remainingSeconds <= 0) {
    return 'time-up';
  }
  if (remainingSeconds <= warning2Seconds) {
    return 'red';
  }
  if (remainingSeconds <= warning1Seconds) {
    return 'amber';
  }
  return 'green';
}

export function getActiveTimerColor(
  status: TimerColorStatus,
  theme: TimerThemeConfig = DEFAULT_THEME_CONFIG
): string {
  switch (status) {
    case 'time-up':
      return theme.timeUpColor;
    case 'red':
      return theme.warning2Color;
    case 'amber':
      return theme.warning1Color;
    case 'green':
    default:
      return theme.countdownColor;
  }
}
