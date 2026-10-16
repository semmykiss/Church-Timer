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
  backgroundStyle: 'pitch-black' | 'midnight-navy' | 'deep-slate' | 'charcoal-bronze' | 'dark-purple' | 'transparent';
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
  warning1Seconds: 120,
  warning2Seconds: 60,
  showClock: true,
  showSpeaker: true,
  fontFamily: 'mono',
};

export type LogoPosition = 'top-left' | 'top-right' | 'top-center' | 'bottom-left' | 'watermark';
export type LogoSize = 'sm' | 'md' | 'lg' | 'xl';
export type LogoPreset = 'cross' | 'dove' | 'shield' | 'cathedral' | 'custom';

export interface ChurchLogoConfig {
  enabled: boolean;
  presetId: LogoPreset;
  customDataUrl?: string; // uploaded base64 data url
  churchName: string;
  position: LogoPosition;
  size: LogoSize;
  opacity: number; // 0.1 to 1.0
  showOnStage: boolean;
  showOnController: boolean;
  showOnNdi: boolean;
}

export const DEFAULT_CHURCH_LOGO: ChurchLogoConfig = {
  enabled: true,
  presetId: 'cross',
  churchName: 'Rccg Jesus Embassy',
  position: 'top-left',
  size: 'md',
  opacity: 0.9,
  showOnStage: true,
  showOnController: true,
  showOnNdi: true,
};

export interface NdiConfig {
  enabled: boolean;
  layout: 'lower-third' | 'corner-bug' | 'fullscreen-hud' | 'clean-timer';
  background: 'transparent' | 'chroma-green' | 'chroma-blue' | 'chroma-magenta' | 'black';
  position: 'bottom-center' | 'bottom-left' | 'bottom-right' | 'top-right' | 'top-left';
  showSpeaker: boolean;
  showTitle: boolean;
  showLogo: boolean;
  showProgressBar: boolean;
  scale: number; // 0.8 to 1.5
}

export const DEFAULT_NDI_CONFIG: NdiConfig = {
  enabled: true,
  layout: 'lower-third',
  background: 'transparent',
  position: 'bottom-center',
  showSpeaker: true,
  showTitle: true,
  showLogo: true,
  showProgressBar: true,
  scale: 1.0,
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
  churchLogo: ChurchLogoConfig;
  ndiConfig: NdiConfig;
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
  | { type: 'UPDATE_THEME'; themeConfig: Partial<TimerThemeConfig> }
  | { type: 'UPDATE_CHURCH_LOGO'; logo: Partial<ChurchLogoConfig> }
  | { type: 'UPDATE_NDI_CONFIG'; ndi: Partial<NdiConfig> }
  | { type: 'IMPORT_STATE'; state: Partial<TimerState> };

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
