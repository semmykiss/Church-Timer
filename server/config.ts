import { TimerThemeConfig, ChurchLogoConfig, NdiConfig } from './types';

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

// Recommended amber/red warning thresholds per session duration.
// Longer segments get proportionally earlier warnings so speakers can wrap up naturally.
export function recommendedThresholds(totalSeconds: number): {
  warning1Seconds: number;
  warning2Seconds: number;
} {
  if (totalSeconds <= 5 * 60) return { warning1Seconds: 60, warning2Seconds: 30 };    // 1-5 min
  if (totalSeconds <= 15 * 60) return { warning1Seconds: 120, warning2Seconds: 60 };  // 5-15 min
  if (totalSeconds <= 30 * 60) return { warning1Seconds: 180, warning2Seconds: 60 };  // 15-30 min
  if (totalSeconds <= 60 * 60) return { warning1Seconds: 300, warning2Seconds: 120 }; // 30-60 min
  return { warning1Seconds: 600, warning2Seconds: 300 };                              // 60+ min
}
