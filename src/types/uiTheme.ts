export type UIThemeMode = 'dark' | 'light';
export type UIAccentColor = 'emerald' | 'blue' | 'purple' | 'amber' | 'cyan';

export type UIThemePreset =
  | 'dark'
  | 'light'
  | 'midnight-navy'
  | 'emerald-sanctuary'
  | 'royal-purple'
  | 'warm-amber';

export interface UIThemeDefinition {
  id: UIThemePreset;
  name: string;
  mode: UIThemeMode;
  accent: UIAccentColor;
  description: string;
  bgClass: string;
  cardClass: string;
  surfaceClass: string;
  borderClass: string;
  textPrimaryClass: string;
  textSecondaryClass: string;
  textMutedClass: string;
  accentBgClass: string;
  accentTextClass: string;
  accentBorderClass: string;
}

export const UI_THEMES: Record<UIThemePreset, UIThemeDefinition> = {
  'dark': {
    id: 'dark',
    name: 'Studio Dark',
    mode: 'dark',
    accent: 'emerald',
    description: 'Deep obsidian for dark control rooms and AV booths',
    bgClass: 'bg-slate-950 text-slate-100',
    cardClass: 'bg-slate-900 border-slate-800',
    surfaceClass: 'bg-slate-950/80 border-slate-800/80',
    borderClass: 'border-slate-800',
    textPrimaryClass: 'text-white',
    textSecondaryClass: 'text-slate-300',
    textMutedClass: 'text-slate-400',
    accentBgClass: 'bg-emerald-600 hover:bg-emerald-500 text-white',
    accentTextClass: 'text-emerald-400',
    accentBorderClass: 'border-emerald-500/60',
  },
  'light': {
    id: 'light',
    name: 'Daylight Crisp',
    mode: 'light',
    accent: 'emerald',
    description: 'Clean bright layout optimized for daytime and well-lit sanctuaries',
    bgClass: 'bg-slate-50 text-slate-900',
    cardClass: 'bg-white border-slate-200 shadow-sm',
    surfaceClass: 'bg-slate-100/80 border-slate-200',
    borderClass: 'border-slate-200',
    textPrimaryClass: 'text-slate-900',
    textSecondaryClass: 'text-slate-700',
    textMutedClass: 'text-slate-500',
    accentBgClass: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    accentTextClass: 'text-emerald-600',
    accentBorderClass: 'border-emerald-600/40',
  },
  'midnight-navy': {
    id: 'midnight-navy',
    name: 'Midnight Navy',
    mode: 'dark',
    accent: 'cyan',
    description: 'Deep marine navy aesthetic with electric sapphire and cyan accents',
    bgClass: 'bg-[#030a16] text-blue-50',
    cardClass: 'bg-[#08152c] border-blue-900/60 shadow-lg',
    surfaceClass: 'bg-[#050f20] border-blue-900/40',
    borderClass: 'border-blue-900/60',
    textPrimaryClass: 'text-white',
    textSecondaryClass: 'text-blue-200',
    textMutedClass: 'text-blue-400/80',
    accentBgClass: 'bg-cyan-600 hover:bg-cyan-500 text-white',
    accentTextClass: 'text-cyan-400',
    accentBorderClass: 'border-cyan-500/60',
  },
  'emerald-sanctuary': {
    id: 'emerald-sanctuary',
    name: 'Sanctuary Forest',
    mode: 'dark',
    accent: 'emerald',
    description: 'Reverent dark pine and emerald sanctuary theme',
    bgClass: 'bg-[#03130c] text-emerald-50',
    cardClass: 'bg-[#072418] border-emerald-900/60 shadow-lg',
    surfaceClass: 'bg-[#051a11] border-emerald-900/40',
    borderClass: 'border-emerald-900/60',
    textPrimaryClass: 'text-white',
    textSecondaryClass: 'text-emerald-200',
    textMutedClass: 'text-emerald-400/80',
    accentBgClass: 'bg-emerald-600 hover:bg-emerald-500 text-white',
    accentTextClass: 'text-emerald-400',
    accentBorderClass: 'border-emerald-500/60',
  },
  'royal-purple': {
    id: 'royal-purple',
    name: 'Royal Worship',
    mode: 'dark',
    accent: 'purple',
    description: 'Majestic liturgical velvet purple and lavender tones',
    bgClass: 'bg-[#0c0418] text-purple-50',
    cardClass: 'bg-[#1a0a33] border-purple-900/60 shadow-lg',
    surfaceClass: 'bg-[#120724] border-purple-900/40',
    borderClass: 'border-purple-900/60',
    textPrimaryClass: 'text-white',
    textSecondaryClass: 'text-purple-200',
    textMutedClass: 'text-purple-400/80',
    accentBgClass: 'bg-purple-600 hover:bg-purple-500 text-white',
    accentTextClass: 'text-purple-400',
    accentBorderClass: 'border-purple-500/60',
  },
  'warm-amber': {
    id: 'warm-amber',
    name: 'Cathedral Amber',
    mode: 'dark',
    accent: 'amber',
    description: 'Warm reverent candlelight atmosphere with rich amber bronze',
    bgClass: 'bg-[#120d04] text-amber-50',
    cardClass: 'bg-[#241a08] border-amber-900/60 shadow-lg',
    surfaceClass: 'bg-[#1a1306] border-amber-900/40',
    borderClass: 'border-amber-900/60',
    textPrimaryClass: 'text-white',
    textSecondaryClass: 'text-amber-200',
    textMutedClass: 'text-amber-400/80',
    accentBgClass: 'bg-amber-600 hover:bg-amber-500 text-white',
    accentTextClass: 'text-amber-400',
    accentBorderClass: 'border-amber-500/60',
  },
};
