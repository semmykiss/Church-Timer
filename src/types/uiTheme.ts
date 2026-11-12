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

// Modern glassmorphism design system: soft gradient canvases, translucent
// blurred cards, hairline borders, and luminous accent pills.
export const UI_THEMES: Record<UIThemePreset, UIThemeDefinition> = {
  'dark': {
    id: 'dark',
    name: 'Studio Dark',
    mode: 'dark',
    accent: 'emerald',
    description: 'Deep obsidian glass for dark control rooms and AV booths',
    bgClass: 'bg-gradient-to-b from-slate-950 via-[#0b1120] to-slate-950 text-slate-100',
    cardClass: 'bg-slate-900/50 backdrop-blur-xl border border-slate-800/60 shadow-xl shadow-black/30',
    surfaceClass: 'bg-white/[0.03] backdrop-blur-md border border-white/[0.06]',
    borderClass: 'border-white/10',
    textPrimaryClass: 'text-white',
    textSecondaryClass: 'text-slate-300',
    textMutedClass: 'text-slate-400',
    accentBgClass: 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-lg shadow-emerald-500/25',
    accentTextClass: 'text-emerald-400',
    accentBorderClass: 'border-emerald-500/40',
  },
  'light': {
    id: 'light',
    name: 'Daylight Crisp',
    mode: 'light',
    accent: 'emerald',
    description: 'Clean airy glass layout for daytime and well-lit sanctuaries',
    bgClass: 'bg-gradient-to-b from-slate-100 via-white to-slate-100 text-slate-900',
    cardClass: 'bg-white/70 backdrop-blur-xl border border-slate-200/80 shadow-xl shadow-slate-900/5',
    surfaceClass: 'bg-slate-900/[0.03] backdrop-blur-md border border-slate-900/[0.06]',
    borderClass: 'border-slate-200',
    textPrimaryClass: 'text-slate-900',
    textSecondaryClass: 'text-slate-700',
    textMutedClass: 'text-slate-500',
    accentBgClass: 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-lg shadow-emerald-500/25',
    accentTextClass: 'text-emerald-600',
    accentBorderClass: 'border-emerald-600/30',
  },
  'midnight-navy': {
    id: 'midnight-navy',
    name: 'Midnight Navy',
    mode: 'dark',
    accent: 'cyan',
    description: 'Deep marine navy glass with electric sapphire and cyan accents',
    bgClass: 'bg-gradient-to-b from-[#020814] via-[#061024] to-[#020814] text-blue-50',
    cardClass: 'bg-[#0a1a36]/50 backdrop-blur-xl border border-cyan-900/30 shadow-xl shadow-black/30',
    surfaceClass: 'bg-white/[0.03] backdrop-blur-md border border-cyan-400/10',
    borderClass: 'border-cyan-400/15',
    textPrimaryClass: 'text-white',
    textSecondaryClass: 'text-blue-100',
    textMutedClass: 'text-blue-300/70',
    accentBgClass: 'bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-400 hover:to-sky-400 text-slate-950 shadow-lg shadow-cyan-500/25',
    accentTextClass: 'text-cyan-300',
    accentBorderClass: 'border-cyan-400/40',
  },
  'emerald-sanctuary': {
    id: 'emerald-sanctuary',
    name: 'Sanctuary Forest',
    mode: 'dark',
    accent: 'emerald',
    description: 'Reverent dark pine glass with emerald sanctuary tones',
    bgClass: 'bg-gradient-to-b from-[#02100a] via-[#042014] to-[#02100a] text-emerald-50',
    cardClass: 'bg-[#07281a]/50 backdrop-blur-xl border border-emerald-800/30 shadow-xl shadow-black/30',
    surfaceClass: 'bg-white/[0.03] backdrop-blur-md border border-emerald-400/10',
    borderClass: 'border-emerald-400/15',
    textPrimaryClass: 'text-white',
    textSecondaryClass: 'text-emerald-100',
    textMutedClass: 'text-emerald-300/70',
    accentBgClass: 'bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-emerald-950 shadow-lg shadow-emerald-500/25',
    accentTextClass: 'text-emerald-300',
    accentBorderClass: 'border-emerald-400/40',
  },
  'royal-purple': {
    id: 'royal-purple',
    name: 'Royal Worship',
    mode: 'dark',
    accent: 'purple',
    description: 'Majestic liturgical glass in velvet purple and lavender',
    bgClass: 'bg-gradient-to-b from-[#0a0416] via-[#160a2e] to-[#0a0416] text-purple-50',
    cardClass: 'bg-[#1d0d3a]/50 backdrop-blur-xl border border-purple-800/40 shadow-xl shadow-black/30',
    surfaceClass: 'bg-white/[0.03] backdrop-blur-md border border-purple-400/10',
    borderClass: 'border-purple-400/15',
    textPrimaryClass: 'text-white',
    textSecondaryClass: 'text-purple-100',
    textMutedClass: 'text-purple-300/70',
    accentBgClass: 'bg-gradient-to-r from-purple-500 to-fuchsia-500 hover:from-purple-400 hover:to-fuchsia-400 text-white shadow-lg shadow-purple-500/25',
    accentTextClass: 'text-purple-300',
    accentBorderClass: 'border-purple-400/40',
  },
  'warm-amber': {
    id: 'warm-amber',
    name: 'Cathedral Amber',
    mode: 'dark',
    accent: 'amber',
    description: 'Warm candlelit glass in rich amber and bronze',
    bgClass: 'bg-gradient-to-b from-[#0f0a03] via-[#1e1508] to-[#0f0a03] text-amber-50',
    cardClass: 'bg-[#2a1e0a]/50 backdrop-blur-xl border border-amber-800/40 shadow-xl shadow-black/30',
    surfaceClass: 'bg-white/[0.03] backdrop-blur-md border border-amber-400/10',
    borderClass: 'border-amber-400/15',
    textPrimaryClass: 'text-white',
    textSecondaryClass: 'text-amber-100',
    textMutedClass: 'text-amber-300/70',
    accentBgClass: 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-amber-950 shadow-lg shadow-amber-500/25',
    accentTextClass: 'text-amber-300',
    accentBorderClass: 'border-amber-400/40',
  },
};
