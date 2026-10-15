import { TimerThemeConfig, DEFAULT_THEME_CONFIG } from '../types/timer';

export interface ThemePresetOption {
  id: string;
  name: string;
  description: string;
  config: TimerThemeConfig;
}

export const THEME_PRESETS: ThemePresetOption[] = [
  {
    id: 'classic',
    name: 'Classic Sanctuary',
    description: 'The standard requested church scheme: Green → Amber (1m) → Red (30s) → Time-up Red',
    config: {
      ...DEFAULT_THEME_CONFIG,
      themeId: 'classic',
      themeName: 'Classic Sanctuary',
      backgroundStyle: 'pitch-black',
      countdownColor: '#10b981', // green
      warning1Color: '#f59e0b',  // amber
      warning2Color: '#ef4444',  // red
      timeUpColor: '#ef4444',    // red
      timeUpText: 'Time-up',
      fontFamily: 'mono',
    },
  },
  {
    id: 'neon-stage',
    name: 'Neon Stage Pro',
    description: 'High luminous intensity for large LED sanctuary video walls and bright daytime services',
    config: {
      ...DEFAULT_THEME_CONFIG,
      themeId: 'neon-stage',
      themeName: 'Neon Stage Pro',
      backgroundStyle: 'pitch-black',
      countdownColor: '#00ff66', // cyber lime
      warning1Color: '#ffb703',  // vivid amber gold
      warning2Color: '#ff2a2a',  // bright laser red
      timeUpColor: '#ff2a2a',
      timeUpText: "TIME'S UP",
      fontFamily: 'mono',
    },
  },
  {
    id: 'midnight-navy',
    name: 'Midnight Navy & Cyan',
    description: 'Contemporary sleek aesthetic with modern cool blue and radiant warm alert tones',
    config: {
      ...DEFAULT_THEME_CONFIG,
      themeId: 'midnight-navy',
      themeName: 'Midnight Navy & Cyan',
      backgroundStyle: 'midnight-navy',
      countdownColor: '#06b6d4', // cyan
      warning1Color: '#f59e0b',  // amber
      warning2Color: '#f43f5e',  // rose red
      timeUpColor: '#f43f5e',
      timeUpText: 'Time-up',
      fontFamily: 'sans',
    },
  },
  {
    id: 'cathedral-gold',
    name: 'Cathedral Bronze & Gold',
    description: 'Warm, reverent liturgical atmosphere with ivory countdown and regal amber gold',
    config: {
      ...DEFAULT_THEME_CONFIG,
      themeId: 'cathedral-gold',
      themeName: 'Cathedral Bronze & Gold',
      backgroundStyle: 'charcoal-bronze',
      countdownColor: '#f8fafc', // crisp ivory
      warning1Color: '#eab308',  // gold
      warning2Color: '#dc2626',  // crimson
      timeUpColor: '#dc2626',
      timeUpText: 'Time-up',
      fontFamily: 'mono',
    },
  },
  {
    id: 'royal-worship',
    name: 'Royal Worship Purple',
    description: 'Deep worship night ambiance with vibrant mint green and glowing sunset amber',
    config: {
      ...DEFAULT_THEME_CONFIG,
      themeId: 'royal-worship',
      themeName: 'Royal Worship Purple',
      backgroundStyle: 'dark-purple',
      countdownColor: '#34d399', // mint
      warning1Color: '#f97316',  // sunset orange
      warning2Color: '#e11d48',  // ruby rose
      timeUpColor: '#e11d48',
      timeUpText: 'Time-up',
      fontFamily: 'sans',
    },
  },
  {
    id: 'digital-retro',
    name: 'Retro 7-Segment Digital',
    description: 'Vintage high-visibility digital pulpit clock style with digital typography',
    config: {
      ...DEFAULT_THEME_CONFIG,
      themeId: 'digital-retro',
      themeName: 'Retro 7-Segment Digital',
      backgroundStyle: 'pitch-black',
      countdownColor: '#22c55e',
      warning1Color: '#eab308',
      warning2Color: '#ef4444',
      timeUpColor: '#ef4444',
      timeUpText: 'TIME-UP',
      fontFamily: 'digital',
    },
  },
];

export const BACKGROUND_STYLES = {
  'pitch-black': 'bg-black text-white',
  'midnight-navy': 'bg-[#030712] text-white',
  'deep-slate': 'bg-[#090d16] text-white',
  'charcoal-bronze': 'bg-[#0c0a09] text-white',
  'dark-purple': 'bg-[#0b0416] text-white',
};
