export interface StageMessage {
  id: string;
  text: string;
  active: boolean;
  flash: boolean;
  createdAt: number;
}

export interface TimerThemeConfig {
  themeId: string;
  themeName: string;
  backgroundStyle: 'pitch-black' | 'midnight-navy' | 'deep-slate' | 'charcoal-bronze' | 'dark-purple';
  countdownColor: string;
  warning1Color: string;
  warning2Color: string;
  timeUpColor: string;
  timeUpText: string;
  warning1Seconds: number;
  warning2Seconds: number;
  showClock: boolean;
  showSpeaker: boolean;
  fontFamily: 'mono' | 'sans' | 'digital';
}

export interface ChurchLogoConfig {
  enabled: boolean;
  presetId: 'cross' | 'dove' | 'shield' | 'cathedral' | 'custom';
  customDataUrl?: string;
  churchName: string;
  position: 'top-left' | 'top-right' | 'top-center' | 'bottom-left' | 'watermark';
  size: 'sm' | 'md' | 'lg' | 'xl';
  opacity: number;
  showOnStage: boolean;
  showOnController: boolean;
  showOnNdi: boolean;
}

export interface NdiConfig {
  enabled: boolean;
  layout: 'lower-third' | 'corner-bug' | 'fullscreen-hud' | 'clean-timer';
  background: 'transparent' | 'chroma-green' | 'chroma-blue' | 'chroma-magenta' | 'black';
  position: 'bottom-center' | 'bottom-left' | 'bottom-right' | 'top-right' | 'top-left';
  showSpeaker: boolean;
  showTitle: boolean;
  showLogo: boolean;
  showProgressBar: boolean;
  scale: number;
}

export interface ServerTimerState {
  roomId: string;
  title: string;
  speaker: string;
  totalDurationSeconds: number;
  remainingSeconds: number;
  isRunning: boolean;
  endsAt: number | null;
  lastUpdatedAt: number;
  stageMessage: StageMessage | null;
  isBlackout: boolean;
  overtimeEnabled: boolean;
  soundAlertsEnabled: boolean;
  clockModeEnabled: boolean;
  themeConfig: TimerThemeConfig;
  churchLogo: ChurchLogoConfig;
  ndiConfig: NdiConfig;
  version: number;
}

export interface Schedule {
  id: string;
  title: string;
  speaker?: string;
  durationMinutes: number;
  durationSeconds: number;
  category: 'word' | 'prayer' | 'worship' | 'custom' | 'event';
  createdAt: number;
}

export type RoomActionType =
  | 'START' | 'PAUSE' | 'RESET' | 'SET_DURATION' | 'ADJUST_TIME'
  | 'SET_TITLE' | 'LOAD_PRESET' | 'SEND_STAGE_MESSAGE' | 'CLEAR_STAGE_MESSAGE'
  | 'TOGGLE_BLACKOUT' | 'TOGGLE_SOUND' | 'TOGGLE_OVERTIME' | 'UPDATE_THEME'
  | 'UPDATE_CHURCH_LOGO' | 'UPDATE_NDI_CONFIG' | 'IMPORT_STATE' | 'SET_THRESHOLDS';

export interface RoomAction {
  type: RoomActionType;
  [key: string]: any;
}
