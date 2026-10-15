import React, { useState } from 'react';
import { TimerThemeConfig, DEFAULT_THEME_CONFIG } from '../types/timer';
import { THEME_PRESETS, BACKGROUND_STYLES } from '../data/themes';
import { Palette, X, RotateCcw, Check, Eye } from 'lucide-react';

interface ThemeModalProps {
  isOpen: boolean;
  onClose: () => void;
  themeConfig: TimerThemeConfig;
  onSaveTheme: (config: Partial<TimerThemeConfig>) => void;
}

const QUICK_COLORS = [
  { name: 'Emerald', hex: '#10b981' },
  { name: 'Neon Lime', hex: '#00ff66' },
  { name: 'Amber', hex: '#f59e0b' },
  { name: 'Vivid Gold', hex: '#eab308' },
  { name: 'Crimson Red', hex: '#ef4444' },
  { name: 'Laser Red', hex: '#ff2a2a' },
  { name: 'Cyan Blue', hex: '#06b6d4' },
  { name: 'Sky Blue', hex: '#38bdf8' },
  { name: 'Pure White', hex: '#ffffff' },
  { name: 'Rose Red', hex: '#f43f5e' },
  { name: 'Velvet Purple', hex: '#a855f7' },
  { name: 'Warm Orange', hex: '#f97316' },
];

export const ThemeModal: React.FC<ThemeModalProps> = ({
  isOpen,
  onClose,
  themeConfig,
  onSaveTheme,
}) => {
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
  let currentPreviewStatus = 'COUNTDOWN';

  if (previewPhase === 'amber') {
    currentPreviewColor = config.warning1Color;
    currentPreviewText = '01:00';
    currentPreviewStatus = `${config.warning1Seconds}s WARNING`;
  } else if (previewPhase === 'red') {
    currentPreviewColor = config.warning2Color;
    currentPreviewText = '00:30';
    currentPreviewStatus = `${config.warning2Seconds}s WARNING`;
  } else if (previewPhase === 'timeup') {
    currentPreviewColor = config.timeUpColor;
    currentPreviewText = config.timeUpText || 'Time-up';
    currentPreviewStatus = "TIME'S UP";
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl text-slate-100 my-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <Palette className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-base font-semibold text-white">Custom Theme & Stage Colors</h2>
              <p className="text-xs text-slate-400">
                Customize colors, fonts, background, and thresholds for your church stage screen.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Live Preview Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-emerald-400" />
                Live Stage Screen Simulation
              </span>

              {/* Preview State Selector Tabs */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[11px]">
                <button
                  type="button"
                  onClick={() => setPreviewPhase('green')}
                  className={`px-2 py-0.5 rounded font-medium transition-colors ${
                    previewPhase === 'green' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Countdown
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewPhase('amber')}
                  className={`px-2 py-0.5 rounded font-medium transition-colors ${
                    previewPhase === 'amber' ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  1 Min (Amber)
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewPhase('red')}
                  className={`px-2 py-0.5 rounded font-medium transition-colors ${
                    previewPhase === 'red' ? 'bg-red-950 text-red-300 border border-red-800' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  30s (Red)
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewPhase('timeup')}
                  className={`px-2 py-0.5 rounded font-medium transition-colors ${
                    previewPhase === 'timeup' ? 'bg-red-950 text-red-300 border border-red-800' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Time-up
                </button>
              </div>
            </div>

            {/* Simulated Stage Display */}
            <div
              className={`p-6 rounded-xl border border-slate-800 text-center flex flex-col items-center justify-center min-h-[160px] relative transition-colors ${
                BACKGROUND_STYLES[config.backgroundStyle] || 'bg-black text-white'
              }`}
            >
              <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-1">
                The Sermon / Word · {currentPreviewStatus}
              </div>
              <div
                className="text-5xl sm:text-6xl font-extrabold tracking-tight font-mono transition-colors duration-200"
                style={{
                  color: currentPreviewColor,
                  fontFamily: config.fontFamily === 'digital' ? "'Courier New', monospace" : config.fontFamily === 'sans' ? "'Plus Jakarta Sans', sans-serif" : "'JetBrains Mono', monospace",
                  filter: `drop-shadow(0 0 25px ${currentPreviewColor}55)`,
                }}
              >
                {currentPreviewText}
              </div>
              {config.showClock && (
                <div className="text-[10px] text-slate-500 font-mono mt-2">
                  Sanctuary Clock: 10:45 AM
                </div>
              )}
            </div>
          </div>

          {/* Preset Themes List */}
          <div className="space-y-2.5">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Curated Church Theme Presets
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
                        ? 'bg-slate-800/90 border-emerald-500/80 shadow-sm'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-white">{preset.name}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{preset.description}</p>
                      {/* Color dots preview */}
                      <div className="flex items-center gap-1.5 mt-2">
                        <span className="w-3 h-3 rounded-full border border-black/50" style={{ backgroundColor: preset.config.countdownColor }} title="Countdown" />
                        <span className="w-3 h-3 rounded-full border border-black/50" style={{ backgroundColor: preset.config.warning1Color }} title="1 min" />
                        <span className="w-3 h-3 rounded-full border border-black/50" style={{ backgroundColor: preset.config.warning2Color }} title="30s" />
                        <span className="w-3 h-3 rounded-full border border-black/50" style={{ backgroundColor: preset.config.timeUpColor }} title="Time-up" />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color Customization Section */}
          <div className="space-y-4 pt-2 border-t border-slate-800">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
              Stage Color Customizers
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Countdown Color */}
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-200">1. Countdown Color</span>
                  <span className="text-[10px] text-slate-400 font-mono">{config.countdownColor}</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={config.countdownColor}
                    onChange={(e) => setConfig({ ...config, countdownColor: e.target.value, themeId: 'custom' })}
                    className="w-8 h-8 rounded border border-slate-700 bg-transparent cursor-pointer shrink-0"
                  />
                  <div className="flex flex-wrap gap-1 flex-1">
                    {QUICK_COLORS.slice(0, 6).map((c) => (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => setConfig({ ...config, countdownColor: c.hex, themeId: 'custom' })}
                        className="w-5 h-5 rounded-md border border-slate-700 hover:scale-110 transition-transform"
                        style={{ backgroundColor: c.hex }}
                        title={c.name}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Warning 1 Color (1 min) */}
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-200">2. First Warning ({config.warning1Seconds}s)</span>
                  <span className="text-[10px] text-slate-400 font-mono">{config.warning1Color}</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={config.warning1Color}
                    onChange={(e) => setConfig({ ...config, warning1Color: e.target.value, themeId: 'custom' })}
                    className="w-8 h-8 rounded border border-slate-700 bg-transparent cursor-pointer shrink-0"
                  />
                  <div className="flex flex-wrap gap-1 flex-1">
                    {QUICK_COLORS.slice(2, 8).map((c) => (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => setConfig({ ...config, warning1Color: c.hex, themeId: 'custom' })}
                        className="w-5 h-5 rounded-md border border-slate-700 hover:scale-110 transition-transform"
                        style={{ backgroundColor: c.hex }}
                        title={c.name}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Warning 2 Color (30s) */}
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-200">3. Final Warning ({config.warning2Seconds}s)</span>
                  <span className="text-[10px] text-slate-400 font-mono">{config.warning2Color}</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={config.warning2Color}
                    onChange={(e) => setConfig({ ...config, warning2Color: e.target.value, themeId: 'custom' })}
                    className="w-8 h-8 rounded border border-slate-700 bg-transparent cursor-pointer shrink-0"
                  />
                  <div className="flex flex-wrap gap-1 flex-1">
                    {QUICK_COLORS.slice(4, 10).map((c) => (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => setConfig({ ...config, warning2Color: c.hex, themeId: 'custom' })}
                        className="w-5 h-5 rounded-md border border-slate-700 hover:scale-110 transition-transform"
                        style={{ backgroundColor: c.hex }}
                        title={c.name}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Time-up Color */}
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-200">4. Time-up Color</span>
                  <span className="text-[10px] text-slate-400 font-mono">{config.timeUpColor}</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={config.timeUpColor}
                    onChange={(e) => setConfig({ ...config, timeUpColor: e.target.value, themeId: 'custom' })}
                    className="w-8 h-8 rounded border border-slate-700 bg-transparent cursor-pointer shrink-0"
                  />
                  <div className="flex flex-wrap gap-1 flex-1">
                    {QUICK_COLORS.slice(4, 10).map((c) => (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => setConfig({ ...config, timeUpColor: c.hex, themeId: 'custom' })}
                        className="w-5 h-5 rounded-md border border-slate-700 hover:scale-110 transition-transform"
                        style={{ backgroundColor: c.hex }}
                        title={c.name}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Advanced Display Settings: Background, Font, Text, Thresholds */}
          <div className="space-y-4 pt-2 border-t border-slate-800">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
              Stage Display & Text Options
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-300">Stage Background Backdrop</label>
                <select
                  value={config.backgroundStyle}
                  onChange={(e) => setConfig({ ...config, backgroundStyle: e.target.value as TimerThemeConfig['backgroundStyle'], themeId: 'custom' })}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="pitch-black">Pitch Black (#000000 - Best for Stage/LED)</option>
                  <option value="midnight-navy">Midnight Navy (#030712 - Contemporary)</option>
                  <option value="deep-slate">Deep Slate (#090D16 - Studio AV)</option>
                  <option value="charcoal-bronze">Charcoal Bronze (#0C0A09 - Traditional)</option>
                  <option value="dark-purple">Velvet Purple (#0B0416 - Worship)</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-300">Digit Typography Style</label>
                <select
                  value={config.fontFamily}
                  onChange={(e) => setConfig({ ...config, fontFamily: e.target.value as TimerThemeConfig['fontFamily'], themeId: 'custom' })}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="mono">Modern Tabular Monospace (JetBrains Mono)</option>
                  <option value="sans">Clean Bold Sans-Serif (Plus Jakarta Sans)</option>
                  <option value="digital">Retro 7-Segment Digital Font</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-300">Time-Up Message Display</label>
                <input
                  type="text"
                  value={config.timeUpText}
                  onChange={(e) => setConfig({ ...config, timeUpText: e.target.value, themeId: 'custom' })}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  placeholder="e.g. Time-up"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-300">Warning 1 (sec)</label>
                  <input
                    type="number"
                    min="10"
                    max="600"
                    value={config.warning1Seconds}
                    onChange={(e) => setConfig({ ...config, warning1Seconds: Math.max(10, parseInt(e.target.value, 10) || 60), themeId: 'custom' })}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-300">Warning 2 (sec)</label>
                  <input
                    type="number"
                    min="5"
                    max="300"
                    value={config.warning2Seconds}
                    onChange={(e) => setConfig({ ...config, warning2Seconds: Math.max(5, parseInt(e.target.value, 10) || 30), themeId: 'custom' })}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Stage elements toggles */}
            <div className="flex flex-wrap gap-4 pt-1 text-xs text-slate-300">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.showClock}
                  onChange={(e) => setConfig({ ...config, showClock: e.target.checked })}
                  className="rounded border-slate-700 text-emerald-500"
                />
                <span>Display Sanctuary Wall Clock on Stage</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
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
        <div className="px-6 py-3.5 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Church Default</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveAndApply}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-md transition-colors flex items-center gap-1.5"
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
