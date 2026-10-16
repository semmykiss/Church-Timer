import React, { useState } from 'react';
import { TimerThemeConfig, DEFAULT_THEME_CONFIG } from '../types/timer';
import { THEME_PRESETS, BACKGROUND_STYLES } from '../data/themes';
import { Palette, X, RotateCcw, Check, Eye, Sun, Moon, Layout } from 'lucide-react';
import { useUITheme } from '../context/ThemeContext';
import { UIThemePreset } from '../types/uiTheme';

interface ThemeModalProps {
  isOpen: boolean;
  onClose: () => void;
  themeConfig: TimerThemeConfig;
  onSaveTheme: (config: Partial<TimerThemeConfig>) => void;
}

const QUICK_COLORS = [
  { name: 'Emerald Green', hex: '#10b981' },
  { name: 'Neon Lime', hex: '#00ff66' },
  { name: 'Amber Gold', hex: '#f59e0b' },
  { name: 'Vivid Yellow', hex: '#eab308' },
  { name: 'Crimson Red', hex: '#ef4444' },
  { name: 'Laser Red', hex: '#ff2a2a' },
  { name: 'Cyan Blue', hex: '#06b6d4' },
  { name: 'Sky Blue', hex: '#38bdf8' },
  { name: 'Pure White', hex: '#ffffff' },
  { name: 'Rose Red', hex: '#f43f5e' },
  { name: 'Velvet Purple', hex: '#a855f7' },
  { name: 'Warm Orange', hex: '#f97316' },
];

const UI_THEME_OPTIONS: { id: UIThemePreset; name: string; desc: string; color: string }[] = [
  { id: 'dark', name: 'Studio Dark', desc: 'Obsidian charcoal for AV booths', color: '#0f172a' },
  { id: 'light', name: 'Daylight Light', desc: 'Clean bright layout for daytime sanctuary', color: '#f8fafc' },
  { id: 'midnight-navy', name: 'Midnight Navy', desc: 'Deep liturgical marine navy with cyan glow', color: '#08152c' },
  { id: 'emerald-sanctuary', name: 'Sanctuary Forest', desc: 'Reverent dark pine and emerald green', color: '#072418' },
  { id: 'royal-purple', name: 'Royal Worship', desc: 'Majestic liturgical purple & lavender', color: '#1a0a33' },
  { id: 'warm-amber', name: 'Cathedral Amber', desc: 'Warm reverent candlelight & bronze', color: '#241a08' },
];

export const ThemeModal: React.FC<ThemeModalProps> = ({
  isOpen,
  onClose,
  themeConfig,
  onSaveTheme,
}) => {
  const { currentTheme, theme: uiTheme, setTheme: setUITheme, toggleDarkLight } = useUITheme();

  const [config, setConfig] = useState<TimerThemeConfig>({
    ...DEFAULT_THEME_CONFIG,
    ...themeConfig,
  });

  const [previewPhase, setPreviewPhase] = useState<'green' | 'amber' | 'red' | 'timeup'>('green');

  if (!isOpen) return null;

  const handleApplyPreset = (presetConfig: TimerThemeConfig) => {
    setConfig({ ...presetConfig });
  };

  const handleSaveAndApply = () => {
    onSaveTheme(config);
    onClose();
  };

  const handleResetToDefault = () => {
    setConfig({ ...DEFAULT_THEME_CONFIG });
  };

  // Determine current preview color based on selected preview tab
  let currentPreviewColor = config.countdownColor;
  let currentPreviewText = '15:00';
  let currentPreviewStatus = 'COUNTDOWN (> 60s)';

  if (previewPhase === 'amber') {
    currentPreviewColor = config.warning1Color;
    currentPreviewText = '01:00';
    currentPreviewStatus = `${config.warning1Seconds}s WARNING (AMBER)`;
  } else if (previewPhase === 'red') {
    currentPreviewColor = config.warning2Color;
    currentPreviewText = '00:30';
    currentPreviewStatus = `${config.warning2Seconds}s WARNING (RED)`;
  } else if (previewPhase === 'timeup') {
    currentPreviewColor = config.timeUpColor;
    currentPreviewText = config.timeUpText || 'Time-up';
    currentPreviewStatus = "TIME'S UP (RED)";
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div
        className={`w-full max-w-2xl max-h-[92vh] rounded-2xl border shadow-2xl overflow-hidden flex flex-col my-auto transition-colors ${uiTheme.cardClass} ${uiTheme.borderClass}`}
      >
        {/* Modal Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${uiTheme.surfaceClass} ${uiTheme.borderClass}`}>
          <div className="flex items-center gap-2.5">
            <Palette className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className={`text-base font-bold ${uiTheme.textPrimaryClass}`}>Interface Theme & Stage Colors</h2>
              <p className={`text-xs ${uiTheme.textMutedClass}`}>
                Switch between Dark, Light, and Sanctuary themes, plus customize stage monitor colors.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors ${uiTheme.textMutedClass} hover:${uiTheme.textPrimaryClass} hover:bg-slate-500/10`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* SECTION 1: Console Interface Themes */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${uiTheme.textPrimaryClass}`}>
                <Layout className="w-4 h-4 text-emerald-400" />
                1. Director Console Interface Theme
              </label>
              <button
                type="button"
                onClick={toggleDarkLight}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${uiTheme.surfaceClass} ${uiTheme.borderClass} ${uiTheme.textPrimaryClass}`}
              >
                {uiTheme.mode === 'dark' ? (
                  <>
                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                    <span>Switch to Light Mode</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-3.5 h-3.5 text-slate-700" />
                    <span>Switch to Dark Mode</span>
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {UI_THEME_OPTIONS.map((item) => {
                const isSelected = currentTheme === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setUITheme(item.id)}
                    className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                      isSelected
                        ? 'border-emerald-500 ring-2 ring-emerald-500/40 shadow-md bg-emerald-500/10'
                        : `${uiTheme.surfaceClass} ${uiTheme.borderClass} hover:border-slate-500/50`
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-4 h-4 rounded-full border border-black/30 shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className={`text-xs font-bold truncate ${uiTheme.textPrimaryClass}`}>{item.name}</span>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                    </div>
                    <p className={`text-[11px] line-clamp-1 ${uiTheme.textMutedClass}`}>{item.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECTION 2: Live Stage Monitor Simulation */}
          <div className={`space-y-2.5 pt-4 border-t ${uiTheme.borderClass}`}>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${uiTheme.textPrimaryClass}`}>
                <Eye className="w-4 h-4 text-emerald-400" />
                2. Live Stage Display Preview
              </span>

              {/* Preview State Selector Tabs */}
              <div className="flex items-center gap-1 bg-black/40 p-1 rounded-lg border border-slate-700 text-[11px]">
                <button
                  type="button"
                  onClick={() => setPreviewPhase('green')}
                  className={`px-2 py-0.5 rounded font-bold transition-colors ${
                    previewPhase === 'green' ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Countdown
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewPhase('amber')}
                  className={`px-2 py-0.5 rounded font-bold transition-colors ${
                    previewPhase === 'amber' ? 'bg-amber-950 text-amber-300 border border-amber-700' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  1m Amber
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewPhase('red')}
                  className={`px-2 py-0.5 rounded font-bold transition-colors ${
                    previewPhase === 'red' ? 'bg-red-950 text-red-300 border border-red-700' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  30s Red
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewPhase('timeup')}
                  className={`px-2 py-0.5 rounded font-bold transition-colors ${
                    previewPhase === 'timeup' ? 'bg-red-950 text-red-300 border border-red-700' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Time-up
                </button>
              </div>
            </div>

            {/* Simulated Stage Display */}
            <div
              className={`p-6 rounded-xl border border-slate-800 text-center flex flex-col items-center justify-center min-h-[170px] relative transition-colors ${
                BACKGROUND_STYLES[config.backgroundStyle] || 'bg-black text-white'
              }`}
            >
              <div className="text-[11px] uppercase tracking-wider text-slate-400 font-bold mb-1">
                The Sermon / Word · {currentPreviewStatus}
              </div>
              <div
                className="text-5xl sm:text-7xl font-extrabold tracking-tight font-mono transition-colors duration-200"
                style={{
                  color: currentPreviewColor,
                  fontFamily: config.fontFamily === 'digital' ? "'Courier New', monospace" : config.fontFamily === 'sans' ? "'Plus Jakarta Sans', sans-serif" : "'JetBrains Mono', monospace",
                  filter: `drop-shadow(0 0 25px ${currentPreviewColor}66)`,
                }}
              >
                {currentPreviewText}
              </div>
              {config.showClock && (
                <div className="text-[11px] text-slate-400 font-mono mt-2">
                  Sanctuary Clock: 10:45:00 AM
                </div>
              )}
            </div>
          </div>

          {/* Preset Stage Themes */}
          <div className="space-y-2">
            <label className={`text-xs font-bold uppercase tracking-wider ${uiTheme.textSecondaryClass}`}>
              Curated Church Stage Schemes
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {THEME_PRESETS.map((preset) => {
                const isSelected = config.themeId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleApplyPreset(preset.config)}
                    className={`p-3 rounded-xl border text-left transition-all flex items-start justify-between gap-2 ${
                      isSelected
                        ? 'border-emerald-500 ring-2 ring-emerald-500/30 bg-emerald-500/10'
                        : `${uiTheme.surfaceClass} ${uiTheme.borderClass} hover:border-slate-500/50`
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${uiTheme.textPrimaryClass}`}>{preset.name}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                      </div>
                      <p className={`text-[11px] mt-0.5 line-clamp-1 ${uiTheme.textMutedClass}`}>{preset.description}</p>
                      {/* Color dots preview */}
                      <div className="flex items-center gap-1.5 mt-2">
                        <span className="w-3.5 h-3.5 rounded-full border border-black/40" style={{ backgroundColor: preset.config.countdownColor }} title="Countdown" />
                        <span className="w-3.5 h-3.5 rounded-full border border-black/40" style={{ backgroundColor: preset.config.warning1Color }} title="1 min" />
                        <span className="w-3.5 h-3.5 rounded-full border border-black/40" style={{ backgroundColor: preset.config.warning2Color }} title="30s" />
                        <span className="w-3.5 h-3.5 rounded-full border border-black/40" style={{ backgroundColor: preset.config.timeUpColor }} title="Time-up" />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECTION 3: Exact Stage Color Transitions Customizers */}
          <div className={`space-y-4 pt-3 border-t ${uiTheme.borderClass}`}>
            <label className={`text-xs font-bold uppercase tracking-wider block ${uiTheme.textPrimaryClass}`}>
              3. Customize Stage Alert Colors
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Countdown Color */}
              <div className={`p-3.5 border rounded-xl space-y-2 ${uiTheme.surfaceClass} ${uiTheme.borderClass}`}>
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${uiTheme.textPrimaryClass}`}>1. Normal Countdown (&gt; 60s)</span>
                  <span className="text-[10px] text-emerald-400 font-mono font-bold">{config.countdownColor}</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={config.countdownColor}
                    onChange={(e) => setConfig({ ...config, countdownColor: e.target.value, themeId: 'custom' })}
                    className="w-8 h-8 rounded border cursor-pointer shrink-0"
                  />
                  <div className="flex flex-wrap gap-1 flex-1">
                    {QUICK_COLORS.slice(0, 6).map((c) => (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => setConfig({ ...config, countdownColor: c.hex, themeId: 'custom' })}
                        className="w-5 h-5 rounded border hover:scale-110 transition-transform"
                        style={{ backgroundColor: c.hex }}
                        title={c.name}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Warning 1 Color (1 min) */}
              <div className={`p-3.5 border rounded-xl space-y-2 ${uiTheme.surfaceClass} ${uiTheme.borderClass}`}>
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${uiTheme.textPrimaryClass}`}>2. First Warning ({config.warning1Seconds}s)</span>
                  <span className="text-[10px] text-amber-400 font-mono font-bold">{config.warning1Color}</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={config.warning1Color}
                    onChange={(e) => setConfig({ ...config, warning1Color: e.target.value, themeId: 'custom' })}
                    className="w-8 h-8 rounded border cursor-pointer shrink-0"
                  />
                  <div className="flex flex-wrap gap-1 flex-1">
                    {QUICK_COLORS.slice(2, 8).map((c) => (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => setConfig({ ...config, warning1Color: c.hex, themeId: 'custom' })}
                        className="w-5 h-5 rounded border hover:scale-110 transition-transform"
                        style={{ backgroundColor: c.hex }}
                        title={c.name}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Warning 2 Color (30s) */}
              <div className={`p-3.5 border rounded-xl space-y-2 ${uiTheme.surfaceClass} ${uiTheme.borderClass}`}>
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${uiTheme.textPrimaryClass}`}>3. Final Warning ({config.warning2Seconds}s)</span>
                  <span className="text-[10px] text-red-400 font-mono font-bold">{config.warning2Color}</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={config.warning2Color}
                    onChange={(e) => setConfig({ ...config, warning2Color: e.target.value, themeId: 'custom' })}
                    className="w-8 h-8 rounded border cursor-pointer shrink-0"
                  />
                  <div className="flex flex-wrap gap-1 flex-1">
                    {QUICK_COLORS.slice(4, 10).map((c) => (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => setConfig({ ...config, warning2Color: c.hex, themeId: 'custom' })}
                        className="w-5 h-5 rounded border hover:scale-110 transition-transform"
                        style={{ backgroundColor: c.hex }}
                        title={c.name}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Time-up Color */}
              <div className={`p-3.5 border rounded-xl space-y-2 ${uiTheme.surfaceClass} ${uiTheme.borderClass}`}>
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${uiTheme.textPrimaryClass}`}>4. Time-up Display</span>
                  <span className="text-[10px] text-red-500 font-mono font-bold">{config.timeUpColor}</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={config.timeUpColor}
                    onChange={(e) => setConfig({ ...config, timeUpColor: e.target.value, themeId: 'custom' })}
                    className="w-8 h-8 rounded border cursor-pointer shrink-0"
                  />
                  <div className="flex flex-wrap gap-1 flex-1">
                    {QUICK_COLORS.slice(4, 10).map((c) => (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => setConfig({ ...config, timeUpColor: c.hex, themeId: 'custom' })}
                        className="w-5 h-5 rounded border hover:scale-110 transition-transform"
                        style={{ backgroundColor: c.hex }}
                        title={c.name}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Typography, Background & Timing options */}
          <div className={`space-y-4 pt-3 border-t ${uiTheme.borderClass}`}>
            <label className={`text-xs font-bold uppercase tracking-wider block ${uiTheme.textPrimaryClass}`}>
              Stage Monitor Backdrops & Settings
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={`text-xs font-semibold ${uiTheme.textSecondaryClass}`}>Backdrop Surface</label>
                <select
                  value={config.backgroundStyle}
                  onChange={(e) => setConfig({ ...config, backgroundStyle: e.target.value as TimerThemeConfig['backgroundStyle'], themeId: 'custom' })}
                  className={`w-full mt-1 border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500 ${uiTheme.surfaceClass} ${uiTheme.borderClass} ${uiTheme.textPrimaryClass}`}
                >
                  <option value="pitch-black">Pitch Black (#000000 - Best for Stage/LED)</option>
                  <option value="midnight-navy">Midnight Navy (#030712 - Contemporary)</option>
                  <option value="deep-slate">Deep Slate (#090D16 - Studio AV)</option>
                  <option value="charcoal-bronze">Charcoal Bronze (#0C0A09 - Traditional)</option>
                  <option value="dark-purple">Velvet Purple (#0B0416 - Worship)</option>
                </select>
              </div>

              <div>
                <label className={`text-xs font-semibold ${uiTheme.textSecondaryClass}`}>Digit Typography</label>
                <select
                  value={config.fontFamily}
                  onChange={(e) => setConfig({ ...config, fontFamily: e.target.value as TimerThemeConfig['fontFamily'], themeId: 'custom' })}
                  className={`w-full mt-1 border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500 ${uiTheme.surfaceClass} ${uiTheme.borderClass} ${uiTheme.textPrimaryClass}`}
                >
                  <option value="mono">Modern Tabular Monospace (JetBrains Mono)</option>
                  <option value="sans">Clean Bold Sans-Serif (Plus Jakarta Sans)</option>
                  <option value="digital">Retro 7-Segment Digital Font</option>
                </select>
              </div>

              <div>
                <label className={`text-xs font-semibold ${uiTheme.textSecondaryClass}`}>Time-up Text Label</label>
                <input
                  type="text"
                  value={config.timeUpText}
                  onChange={(e) => setConfig({ ...config, timeUpText: e.target.value, themeId: 'custom' })}
                  className={`w-full mt-1 border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500 ${uiTheme.surfaceClass} ${uiTheme.borderClass} ${uiTheme.textPrimaryClass}`}
                  placeholder="e.g. Time-up"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={`text-xs font-semibold ${uiTheme.textSecondaryClass}`}>Warning 1 (sec)</label>
                  <input
                    type="number"
                    min="10"
                    max="600"
                    value={config.warning1Seconds}
                    onChange={(e) => setConfig({ ...config, warning1Seconds: Math.max(10, parseInt(e.target.value, 10) || 60), themeId: 'custom' })}
                    className={`w-full mt-1 border rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-emerald-500 ${uiTheme.surfaceClass} ${uiTheme.borderClass} ${uiTheme.textPrimaryClass}`}
                  />
                </div>
                <div>
                  <label className={`text-xs font-semibold ${uiTheme.textSecondaryClass}`}>Warning 2 (sec)</label>
                  <input
                    type="number"
                    min="5"
                    max="300"
                    value={config.warning2Seconds}
                    onChange={(e) => setConfig({ ...config, warning2Seconds: Math.max(5, parseInt(e.target.value, 10) || 30), themeId: 'custom' })}
                    className={`w-full mt-1 border rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-emerald-500 ${uiTheme.surfaceClass} ${uiTheme.borderClass} ${uiTheme.textPrimaryClass}`}
                  />
                </div>
              </div>
            </div>

            {/* Stage elements toggles */}
            <div className={`flex flex-wrap gap-4 pt-1 text-xs ${uiTheme.textSecondaryClass}`}>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={config.showClock}
                  onChange={(e) => setConfig({ ...config, showClock: e.target.checked })}
                  className="rounded border-slate-700 text-emerald-500"
                />
                <span>Display Sanctuary Wall Clock on Stage</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={config.showSpeaker}
                  onChange={(e) => setConfig({ ...config, showSpeaker: e.target.checked })}
                  className="rounded border-slate-700 text-emerald-500"
                />
                <span>Show Current Program & Speaker Line</span>
              </label>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className={`px-6 py-3.5 border-t flex items-center justify-between ${uiTheme.surfaceClass} ${uiTheme.borderClass}`}>
          <button
            type="button"
            onClick={handleResetToDefault}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs transition-colors ${uiTheme.textMutedClass} hover:${uiTheme.textPrimaryClass}`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Church Default</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-colors ${uiTheme.borderClass} ${uiTheme.textSecondaryClass} hover:${uiTheme.textPrimaryClass}`}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveAndApply}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Apply Theme Across All Screens</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
