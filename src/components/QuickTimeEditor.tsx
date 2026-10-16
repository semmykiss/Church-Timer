import React, { useState } from 'react';
import { Play, Check, X, Clock, Plus, Minus, Sparkles } from 'lucide-react';
import { useUITheme } from '../context/ThemeContext';

interface QuickTimeEditorProps {
  isOpen: boolean;
  onClose: () => void;
  currentMinutes: number;
  currentSeconds: number;
  currentTitle: string;
  currentSpeaker: string;
  onApply: (totalSeconds: number, title?: string, speaker?: string, autoStart?: boolean) => void;
}

const COMMON_PRESETS = [
  { label: '1m', min: 1, sec: 0 },
  { label: '2m', min: 2, sec: 0 },
  { label: '3m', min: 3, sec: 0 },
  { label: '5m', min: 5, sec: 0 },
  { label: '7m', min: 7, sec: 0 },
  { label: '10m', min: 10, sec: 0 },
  { label: '15m', min: 15, sec: 0 },
  { label: '20m', min: 20, sec: 0 },
  { label: '25m', min: 25, sec: 0 },
  { label: '30m', min: 30, sec: 0 },
  { label: '35m', min: 35, sec: 0 },
  { label: '45m', min: 45, sec: 0 },
  { label: '60m', min: 60, sec: 0 },
];

const COMMON_TITLES = [
  'The Sermon / Word',
  'Praise & Worship',
  'Opening Prayer',
  'Announcements',
  'Choir Ministration',
  'Tithes & Offering',
  'Altar Call',
  'Benediction',
];

export const QuickTimeEditor: React.FC<QuickTimeEditorProps> = ({
  isOpen,
  onClose,
  currentMinutes: initialMin,
  currentSeconds: initialSec,
  currentTitle: initialTitle,
  currentSpeaker: initialSpeaker,
  onApply,
}) => {
  const { theme } = useUITheme();
  const [minutes, setMinutes] = useState(initialMin || 30);
  const [seconds, setSeconds] = useState(initialSec || 0);
  const [title, setTitle] = useState(initialTitle || 'The Sermon / Word');
  const [speaker, setSpeaker] = useState(initialSpeaker || '');

  if (!isOpen) return null;

  const handlePresetClick = (min: number, sec: number) => {
    setMinutes(min);
    setSeconds(sec);
  };

  const handleAdjustMinutes = (delta: number) => {
    setMinutes((prev) => Math.max(0, prev + delta));
  };

  const handleAdjustSeconds = (delta: number) => {
    setSeconds((prev) => {
      const next = prev + delta;
      if (next < 0) {
        if (minutes > 0) {
          setMinutes((m) => m - 1);
          return 60 + next;
        }
        return 0;
      }
      if (next >= 60) {
        setMinutes((m) => m + Math.floor(next / 60));
        return next % 60;
      }
      return next;
    });
  };

  const handleSave = (autoStart: boolean = false) => {
    const totalSec = minutes * 60 + seconds;
    if (totalSec > 0) {
      onApply(totalSec, title.trim() || 'Church Service', speaker.trim() || undefined, autoStart);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div
        className={`w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden flex flex-col ${theme.cardClass}`}
      >
        {/* Header */}
        <div className={`px-5 py-3.5 border-b flex items-center justify-between ${theme.borderClass} ${theme.surfaceClass}`}>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-500" />
            <h3 className={`text-base font-bold ${theme.textPrimaryClass}`}>Quick Timer Setup</h3>
          </div>
          <button
            onClick={onClose}
            className={`p-1 rounded-lg hover:bg-slate-800/40 transition-colors ${theme.textMutedClass}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5">
          {/* Quick Preset Buttons Strip */}
          <div className="space-y-1.5">
            <label className={`text-xs font-semibold uppercase tracking-wider block ${theme.textMutedClass}`}>
              Instant Quick Presets
            </label>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_PRESETS.map((p) => {
                const isSelected = minutes === p.min && seconds === p.sec;
                return (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => handlePresetClick(p.min, p.sec)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                        : `${theme.surfaceClass} ${theme.textSecondaryClass} hover:border-emerald-500/50`
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Large Time Stepper & Inputs */}
          <div className={`p-4 rounded-xl border flex flex-col items-center justify-center space-y-3 ${theme.surfaceClass} ${theme.borderClass}`}>
            <div className="flex items-center justify-center gap-4">
              {/* Minutes Column */}
              <div className="flex flex-col items-center">
                <span className={`text-[11px] font-medium uppercase tracking-wider ${theme.textMutedClass}`}>
                  Minutes
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => handleAdjustMinutes(-1)}
                    className="w-8 h-8 rounded-lg bg-slate-800/60 hover:bg-slate-700 text-white flex items-center justify-center font-bold"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    min="0"
                    max="600"
                    value={minutes}
                    onChange={(e) => setMinutes(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-20 text-center text-3xl font-mono font-extrabold bg-transparent border-b-2 border-emerald-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleAdjustMinutes(1)}
                    className="w-8 h-8 rounded-lg bg-slate-800/60 hover:bg-slate-700 text-white flex items-center justify-center font-bold"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <span className="text-3xl font-mono font-bold text-slate-500 pb-1">:</span>

              {/* Seconds Column */}
              <div className="flex flex-col items-center">
                <span className={`text-[11px] font-medium uppercase tracking-wider ${theme.textMutedClass}`}>
                  Seconds
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => handleAdjustSeconds(-10)}
                    className="w-8 h-8 rounded-lg bg-slate-800/60 hover:bg-slate-700 text-white flex items-center justify-center font-bold"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={seconds.toString().padStart(2, '0')}
                    onChange={(e) => setSeconds(Math.max(0, Math.min(59, parseInt(e.target.value, 10) || 0)))}
                    className="w-20 text-center text-3xl font-mono font-extrabold bg-transparent border-b-2 border-emerald-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleAdjustSeconds(10)}
                    className="w-8 h-8 rounded-lg bg-slate-800/60 hover:bg-slate-700 text-white flex items-center justify-center font-bold"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Quick +/- Adders */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1 text-xs">
              <button
                type="button"
                onClick={() => handleAdjustMinutes(5)}
                className="px-2.5 py-1 rounded bg-slate-800/40 hover:bg-slate-800 text-emerald-400 font-medium"
              >
                +5 min
              </button>
              <button
                type="button"
                onClick={() => handleAdjustMinutes(10)}
                className="px-2.5 py-1 rounded bg-slate-800/40 hover:bg-slate-800 text-emerald-400 font-medium"
              >
                +10 min
              </button>
              <button
                type="button"
                onClick={() => handleAdjustMinutes(-5)}
                className="px-2.5 py-1 rounded bg-slate-800/40 hover:bg-slate-800 text-red-400 font-medium"
              >
                -5 min
              </button>
              <button
                type="button"
                onClick={() => {
                  setMinutes(0);
                  setSeconds(30);
                }}
                className="px-2.5 py-1 rounded bg-slate-800/40 hover:bg-slate-800 text-amber-400 font-medium"
              >
                30s
              </button>
            </div>
          </div>

          {/* Quick Title & Speaker */}
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <label className={`text-xs font-medium ${theme.textSecondaryClass}`}>Service Segment Title</label>
                <div className="flex gap-1">
                  {COMMON_TITLES.slice(0, 3).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTitle(t)}
                      className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors ${
                        title === t ? 'border-emerald-500 text-emerald-400' : `${theme.borderClass} ${theme.textMutedClass}`
                      }`}
                    >
                      {t.split('/')[0].trim()}
                    </button>
                  ))}
                </div>
              </div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={`w-full mt-1 px-3 py-2 text-xs rounded-lg border focus:outline-none focus:border-emerald-500 ${theme.surfaceClass} ${theme.borderClass} ${theme.textPrimaryClass}`}
                placeholder="e.g. The Sermon / Word"
              />
            </div>

            <div>
              <label className={`text-xs font-medium ${theme.textSecondaryClass}`}>Speaker / Lead (Optional)</label>
              <input
                type="text"
                value={speaker}
                onChange={(e) => setSpeaker(e.target.value)}
                className={`w-full mt-1 px-3 py-2 text-xs rounded-lg border focus:outline-none focus:border-emerald-500 ${theme.surfaceClass} ${theme.borderClass} ${theme.textPrimaryClass}`}
                placeholder="e.g. Senior Pastor"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className={`px-5 py-3.5 border-t flex items-center justify-between gap-3 ${theme.borderClass} ${theme.surfaceClass}`}>
          <button
            type="button"
            onClick={onClose}
            className={`px-4 py-2 text-xs font-medium rounded-lg hover:bg-slate-800/40 transition-colors ${theme.textSecondaryClass}`}
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSave(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg transition-colors border border-slate-700"
            >
              Set & Standby
            </button>
            <button
              type="button"
              onClick={() => handleSave(true)}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-md transition-colors flex items-center gap-1.5 active:scale-95"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Set & Start Now</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
