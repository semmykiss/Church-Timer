import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  TimerState,
  ChurchPreset,
  getTimerColorStatus,
  getActiveTimerColor,
  DEFAULT_THEME_CONFIG,
} from '../types/timer';
import { BACKGROUND_STYLES } from '../data/themes';
import { formatTimeDisplay } from '../hooks/useTimerSync';
import { playChime } from '../utils/audio';
import { UIThemePreset } from '../types/uiTheme';
import { useUITheme } from '../context/ThemeContext';
import {
  ScheduleEditorModal,
  getStoredSchedules,
} from './ScheduleEditorModal';
import {
  Play,
  Pause,
  RotateCcw,
  Plus,
  Minus,
  Monitor,
  EyeOff,
  Eye,
  Volume2,
  VolumeX,
  Send,
  Trash2,
  ExternalLink,
  Bookmark,
  BookmarkPlus,
  Check,
  Palette,
  Zap,
  Edit2,
  Edit3,
  Calendar,
  Save,
  Sun,
  Moon,
} from 'lucide-react';
import { ChurchLogo } from './ChurchLogo';

interface ControllerProps {
  state: TimerState;
  connected: boolean;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onAdjustTime: (deltaSeconds: number) => void;
  onSetDuration: (totalSeconds: number, title?: string, speaker?: string) => void;
  onLoadPreset: (preset: any) => void;
  onSendStageMessage: (text: string, flash: boolean) => void;
  onClearStageMessage: () => void;
  onToggleBlackout: (isBlackout?: boolean) => void;
  onToggleSound: (enabled?: boolean) => void;
  onToggleOvertime: (enabled?: boolean) => void;
  onSetThresholds?: (warning1Seconds: number, warning2Seconds: number) => void;
  onSetTitleAndSpeaker: (title: string, speaker?: string) => void;
  onOpenShareModal: () => void;
  onOpenThemeModal: () => void;
  onOpenQuickSetup?: () => void;
  onOpenNdiModal?: () => void;
  onOpenChurchLogoModal?: () => void;
  onOpenInteroperabilityModal?: () => void;
  onOpenScheduleEditor?: () => void;
  onToggleStageScreen?: () => void;
  isStageWindowOpen?: boolean;
  // Added to support server-side schedules
  getSchedules: () => Promise<any[]>;
  saveSchedule: (schedule: any) => Promise<any>;
  deleteSchedule: (id: string) => Promise<void>;
}

const COMMON_QUICK_PRESETS = [
  { label: '1m', min: 1 },
  { label: '2m', min: 2 },
  { label: '3m', min: 3 },
  { label: '5m', min: 5 },
  { label: '10m', min: 10 },
  { label: '15m', min: 15 },
  { label: '20m', min: 20 },
  { label: '30m', min: 30 },
];

// Selectable per-session warning thresholds (seconds)
const THRESHOLD_OPTIONS = [15, 30, 60, 90, 120, 180, 300, 600];

const formatThresholdLabel = (sec: number): string =>
  sec >= 60 ? `${Math.round(sec / 60)} min${sec >= 120 ? 's' : ''}` : `${sec}s`;

// Merge standard options with the current value so a manually-imported
// non-standard threshold (e.g. 45s) still displays correctly in the dropdown.
const thresholdSelectOptions = (filter: (s: number) => boolean, currentValue: number): number[] =>
  Array.from(new Set([...THRESHOLD_OPTIONS.filter(filter), currentValue])).sort((a, b) => a - b);

export const Controller: React.FC<ControllerProps> = ({
  state,
  connected,
  onStart,
  onPause,
  onReset,
  onAdjustTime,
  onSetDuration,
  onLoadPreset,
  onSendStageMessage,
  onClearStageMessage,
  onToggleBlackout,
  onToggleSound,
  onToggleOvertime,
  onSetThresholds,
  onSetTitleAndSpeaker,
  onOpenShareModal,
  onOpenThemeModal,
  onOpenQuickSetup,
  onOpenNdiModal,
  onOpenChurchLogoModal,
  onOpenInteroperabilityModal,
  onOpenScheduleEditor,
  onToggleStageScreen,
  isStageWindowOpen = false,
  getSchedules,
  saveSchedule,
  deleteSchedule,
}) => {
  const { theme: uiTheme, setTheme: setUITheme } = useUITheme();
  const CUSTOM_STORAGE_KEY = 'sanctuary_custom_presets';

  // Load custom presets from localStorage (Fallback/Legacy)
  const [customPresets, setCustomPresets] = useState<ChurchPreset[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(CUSTOM_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch {}
    }
    return [
      {
        id: 'cp-pastor-exhortation',
        title: "Pastor's Exhortation",
        speaker: 'Visiting Minister',
        durationMinutes: 18,
        durationSeconds: 0,
        category: 'word',
      },
      {
        id: 'cp-baby-dedication',
        title: 'Baby Dedication Ceremony',
        speaker: 'Pastoral Staff',
        durationMinutes: 12,
        durationSeconds: 30,
        category: 'prayer',
      },
      {
        id: 'cp-extended-worship',
        title: 'Extended Prophetic Worship',
        speaker: 'Worship Team',
        durationMinutes: 30,
        durationSeconds: 0,
        category: 'worship',
      },
    ];
  });

  const [customMinutes, setCustomMinutes] = useState(30);
  const [customSeconds, setCustomSeconds] = useState(0);
  const [customTitle, setCustomTitle] = useState(state.title || 'The Sermon / Word');
  const [customSpeaker, setCustomSpeaker] = useState(state.speaker || 'Senior Pastor');
  const [messageInput, setMessageInput] = useState('');
  const [flashAlert, setFlashAlert] = useState(false);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [isEditingTitleInline, setIsEditingTitleInline] = useState(false);
  const [inlineTitle, setInlineTitle] = useState(state.title || '');
  const [inlineSpeaker, setInlineSpeaker] = useState(state.speaker || '');

  // Church service schedules state (local templates + server-synced, merged below)
  const [customScheduleState, setCustomScheduleState] = useState<any[]>(() => getStoredSchedules());
  const [isScheduleEditorOpen, setIsScheduleEditorOpen] = useState(false);

  // Quick edit state for custom saved presets
  const [editingCustomPresetId, setEditingCustomPresetId] = useState<string | null>(null);
  const [editPresetTitle, setEditPresetTitle] = useState('');
  const [editPresetSpeaker, setEditPresetSpeaker] = useState('');
  const [editPresetMinutes, setEditPresetMinutes] = useState(15);
  const [editPresetSeconds, setEditPresetSeconds] = useState(0);

  const handleStartEditCustomPreset = (preset: any) => {
    setEditingCustomPresetId(preset.id);
    setEditPresetTitle(preset.title);
    setEditPresetSpeaker(preset.speaker || '');
    setEditPresetMinutes(preset.durationMinutes);
    setEditPresetSeconds(preset.durationSeconds || 0);
  };

  const handleSaveEditCustomPreset = (presetId: string) => {
    const updated = customPresets.map((p) => {
      if (p.id === presetId) {
        return {
          ...p,
          title: editPresetTitle.trim() || 'Custom Preset',
          speaker: editPresetSpeaker.trim() || undefined,
          durationMinutes: Math.max(0, editPresetMinutes),
          durationSeconds: Math.max(0, Math.min(59, editPresetSeconds)),
        };
      }
      return p;
    });
    persistCustomPresets(updated);
    setEditingCustomPresetId(null);
    setSaveSuccessMessage(`Updated "${editPresetTitle}"`);
    setTimeout(() => setSaveSuccessMessage(null), 2500);
  };

  const [activeTab, setActiveTab] = useState<number | 'custom'>('custom');
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  const persistCustomPresets = (updated: ChurchPreset[]) => {
    setCustomPresets(updated);
    try {
      localStorage.setItem(CUSTOM_STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  };

  const handleSaveCustomPreset = () => {
    const totalSec = customMinutes * 60 + customSeconds;
    if (totalSec <= 0) return;

    const trimmedTitle = customTitle.trim() || `${customMinutes}m ${customSeconds > 0 ? customSeconds + 's' : ''} Timer`;
    const trimmedSpeaker = customSpeaker.trim() || undefined;

    const newPreset: ChurchPreset = {
      id: `custom-${Date.now()}`,
      title: trimmedTitle,
      speaker: trimmedSpeaker,
      durationMinutes: customMinutes,
      durationSeconds: customSeconds,
      category: 'custom',
    };

    const updated = [newPreset, ...customPresets];
    persistCustomPresets(updated);
    setActiveTab('custom');
    setSaveSuccessMessage(`"${trimmedTitle}" saved to custom presets!`);
    setTimeout(() => setSaveSuccessMessage(null), 3000);
  };

  const handleSaveCurrentTimerAsPreset = () => {
    const totalMin = Math.floor((state.totalDurationSeconds || 0) / 60);
    if (totalMin <= 0) return;

    const newPreset: ChurchPreset = {
      id: `custom-${Date.now()}`,
      title: state.title || `${totalMin}m Timer`,
      speaker: state.speaker || undefined,
      durationMinutes: totalMin,
      durationSeconds: (state.totalDurationSeconds || 0) % 60,
      category: 'custom',
    };

    persistCustomPresets([newPreset, ...customPresets]);
    setActiveTab('custom');
    setSaveSuccessMessage(`"${newPreset.title}" saved to custom presets!`);
    setTimeout(() => setSaveSuccessMessage(null), 3000);
  };

  const handleDeleteCustomPreset = (presetId: string, presetTitle: string) => {
    const updated = customPresets.filter((p) => p.id !== presetId);
    persistCustomPresets(updated);
    setSaveSuccessMessage(`Deleted "${presetTitle}"`);
    setTimeout(() => setSaveSuccessMessage(null), 2500);
  };

  // Fetch server-synced schedules and merge with local templates
  const [serverScheduleTemplates, setServerScheduleTemplates] = useState<any[]>([]);

  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        const fetched = await getSchedules();
        // Convert flat server schedule items into template-shaped entries
        const templates = (fetched || []).map((s: any) => ({
          id: s.id,
          name: s.title || 'Synced Schedule',
          description: 'Synced from server',
          items: [s],
          serverSynced: true,
        }));
        setServerScheduleTemplates(templates);
      } catch {
        setServerScheduleTemplates([]);
      }
    };
    fetchSchedules();
  }, [getSchedules, state.roomId]);

  const schedules = useMemo(
    () => [...serverScheduleTemplates, ...customScheduleState],
    [serverScheduleTemplates, customScheduleState]
  );

  const stageTheme = state.themeConfig || DEFAULT_THEME_CONFIG;
  const colorStatus = getTimerColorStatus(
    state.remainingSeconds,
    stageTheme.warning1Seconds ?? 60,
    stageTheme.warning2Seconds ?? 30
  );
  const activeColor = getActiveTimerColor(colorStatus, stageTheme);
  const { formatted } = formatTimeDisplay(state.remainingSeconds);
  const isTimeUp = state.remainingSeconds <= 0;

  const totalSec = state.totalDurationSeconds || 1;
  const elapsedSec = Math.max(0, totalSec - state.remainingSeconds);
  const progressPercent = Math.min(100, Math.max(0, Math.round((elapsedSec / totalSec) * 100)));

  let statusText = 'NORMAL COUNTDOWN (> 60s)';
  let statusBadgeBg = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
  if (colorStatus === 'amber') {
    statusText = `WARNING 1 (${stageTheme.warning1Seconds}s REACHED)`;
    statusBadgeBg = 'bg-amber-500/15 text-amber-400 border-amber-500/30';
  } else if (colorStatus === 'red') {
    statusText = `WARNING 2 (${stageTheme.warning2Seconds}s LEFT)`;
    statusBadgeBg = 'bg-red-500/15 text-red-400 border-red-500/30 animate-pulse';
  } else if (colorStatus === 'time-up') {
    statusText = "TIME'S UP!";
    statusBadgeBg = 'bg-red-600 text-white border-red-500 font-bold animate-bounce-subtle';
  }

  const fontFamilyStyle =
    stageTheme.fontFamily === 'digital'
      ? "'Courier New', monospace"
      : stageTheme.fontFamily === 'sans'
      ? "'Plus Jakarta Sans', sans-serif"
      : "'JetBrains Mono', monospace";

  const handleCustomApply = (e: React.FormEvent) => {
    e.preventDefault();
    const totalSec = customMinutes * 60 + customSeconds;
    if (totalSec > 0) {
      onSetDuration(totalSec, customTitle.trim() || 'Church Service', customSpeaker.trim() || undefined);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (messageInput.trim()) {
      onSendStageMessage(messageInput.trim(), flashAlert);
      setMessageInput('');
    }
  };

  const handleSaveInlineTitle = (e: React.FormEvent) => {
    e.preventDefault();
    onSetTitleAndSpeaker(inlineTitle.trim() || 'Church Service', inlineSpeaker.trim() || undefined);
    setIsEditingTitleInline(false);
  };

  // Stage window open/close is managed by App so every button stays in sync
  const handleOpenSecondScreen = onToggleStageScreen ?? (() => {});

  const activeTemplate =
    typeof activeTab === 'number' && schedules[activeTab] ? schedules[activeTab] : null;

  return (
    <div className="space-y-6 pb-12 transition-colors duration-200">
      <section
        className={`sheen lift rounded-3xl p-4 sm:p-6 border shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors ${uiTheme.cardClass} ${uiTheme.borderClass}`}
      >
        <div className="flex items-start sm:items-center gap-4">
          <div
            className={`w-2.5 h-2.5 rounded-full mt-1.5 sm:mt-0 shrink-0 ${
              connected ? 'bg-emerald-500 animate-pulse-dot' : 'bg-amber-500 animate-pulse'
            }`}
          />
          <div>
            <div className={`font-display text-lg sm:text-xl font-bold flex flex-wrap items-center gap-2.5 ${uiTheme.textPrimaryClass}`}>
              <span>{state.roomId.toUpperCase()}</span>
              <span className={`text-[11px] font-sans font-semibold px-2.5 py-1 rounded-full tracking-wide ${
                connected ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25' : 'bg-amber-500/10 text-amber-400 border border-amber-500/25'
              }`}>
                {connected ? 'LIVE SYNC' : 'CONNECTING…'}
              </span>
              <span className={`text-[11px] font-sans font-bold px-2.5 py-1 rounded-full tracking-wide ${
                state.isRunning
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/40'
                  : 'bg-slate-700/60 text-slate-300'
              }`}>
                {state.isRunning ? 'ON AIR' : 'STANDBY'}
              </span>
            </div>
            <div className={`flex flex-wrap items-center gap-x-3.5 gap-y-1 mt-2 text-[11px] ${uiTheme.textMutedClass}`}>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span><span className="text-emerald-400 font-semibold">Green</span> &gt; {formatThresholdLabel(stageTheme.warning1Seconds)}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span><span className="text-amber-400 font-semibold">Amber</span> ≤ {stageTheme.warning1Seconds}s</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                <span><span className="text-red-400 font-semibold">Red</span> ≤ {stageTheme.warning2Seconds}s</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                <span><span className="text-red-500 font-bold">Time-up</span></span>
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Simple Dark / Light mode toggle */}
          <div className={`flex items-center gap-1 p-1 rounded-xl border ${uiTheme.surfaceClass} ${uiTheme.borderClass}`}>
            <button
              type="button"
              onClick={() => setUITheme('dark')}
              className={`px-3 py-1 text-[11px] font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                uiTheme.mode === 'dark'
                  ? `${uiTheme.accentBgClass} shadow-sm`
                  : `${uiTheme.textSecondaryClass} hover:${uiTheme.textPrimaryClass}`
              }`}
              title="Switch to dark mode"
            >
              <Moon className="w-3 h-3" />
              <span>Dark</span>
            </button>
            <button
              type="button"
              onClick={() => setUITheme('light')}
              className={`px-3 py-1 text-[11px] font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                uiTheme.mode === 'light'
                  ? `${uiTheme.accentBgClass} shadow-sm`
                  : `${uiTheme.textSecondaryClass} hover:${uiTheme.textPrimaryClass}`
              }`}
              title="Switch to light mode"
            >
              <Sun className="w-3 h-3" />
              <span>Light</span>
            </button>
          </div>

          <button
            onClick={handleOpenSecondScreen}
            className={`px-4 py-2 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 ${
              isStageWindowOpen
                ? 'bg-gradient-to-r from-red-600 to-rose-500 hover:from-red-500 hover:to-rose-400 shadow-lg shadow-red-500/30'
                : 'bg-emerald-600 hover:bg-emerald-500 shadow-md'
            }`}
            title={isStageWindowOpen ? 'Close the stage window on your second monitor' : 'Open the stage window on your second monitor'}
          >
            <Monitor className="w-4 h-4" />
            <span className="hidden sm:inline">{isStageWindowOpen ? 'Close 2nd Screen' : 'Extend 2nd Screen'}</span>
            <span className="sm:hidden">{isStageWindowOpen ? 'Close' : '2nd Screen'}</span>
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-6">
          <div className={`rounded-2xl border overflow-hidden shadow-2xl ${uiTheme.cardClass} ${uiTheme.borderClass}`}>
            <div className={`px-5 py-3.5 border-b flex items-center justify-between ${uiTheme.surfaceClass} ${uiTheme.borderClass}`}>
              <div className="flex items-center gap-2.5">
                <span className={`font-display text-xs font-bold uppercase tracking-[0.12em] ${uiTheme.textPrimaryClass}`}>
                  Live Stage Confidence Monitor
                </span>
                <span className="text-slate-500">·</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded border ${statusBadgeBg}`}>
                  {statusText}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={onOpenThemeModal}
                  className={`text-xs flex items-center gap-1 transition-colors mr-1 ${uiTheme.textMutedClass} hover:${uiTheme.textPrimaryClass}`}
                  title="Customize stage colors"
                >
                  <Palette className="w-3.5 h-3.5 text-purple-400" />
                  <span className="hidden sm:inline">Colors</span>
                </button>
                <button
                  onClick={handleOpenSecondScreen}
                  className={`text-xs flex items-center gap-1 transition-colors font-semibold ${
                    isStageWindowOpen ? 'text-red-400 hover:text-red-300' : 'text-emerald-400 hover:text-emerald-300'
                  }`}
                  title={isStageWindowOpen ? 'Close stage display window' : 'Pop out stage display'}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>{isStageWindowOpen ? 'Close' : 'Pop out'}</span>
                </button>
              </div>
            </div>

            <div
              className={`spotlight p-6 sm:p-10 text-center flex flex-col items-center justify-center min-h-[300px] sm:min-h-[350px] relative transition-colors duration-500 ${
                BACKGROUND_STYLES[stageTheme.backgroundStyle] || 'bg-black text-white'
              }`}
            >
              {state.isBlackout ? (
                <div className="space-y-3 opacity-50">
                  <EyeOff className="w-12 h-12 text-slate-500 mx-auto" />
                  <p className="text-slate-400 text-xs font-bold tracking-widest uppercase">
                    SCREEN BLACKED OUT (SOLEMN PRAYER / VIDEO)
                  </p>
                </div>
              ) : (
                <>
                  {state.churchLogo?.enabled && (
                    <div className="mb-2 flex items-center justify-center">
                      <ChurchLogo config={state.churchLogo} showText={true} className="scale-90" />
                    </div>
                  )}

                  {/* Live corner tag */}
                  <div className="absolute top-3.5 left-3.5 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.06] border border-white/10 backdrop-blur-sm">
                    <span className={`w-1.5 h-1.5 rounded-full ${state.isRunning ? 'bg-red-500 animate-pulse' : 'bg-slate-500'}`} />
                    <span className="text-[10px] font-bold tracking-widest text-white/80 uppercase">
                      {state.isRunning ? 'On Air' : 'Standby'}
                    </span>
                  </div>

                  <div className="mb-4 max-w-lg">
                    {isEditingTitleInline ? (
                      <form onSubmit={handleSaveInlineTitle} className="flex flex-col sm:flex-row items-center gap-2">
                        <input
                          type="text"
                          value={inlineTitle}
                          onChange={(e) => setInlineTitle(e.target.value)}
                          placeholder="Session title"
                          className="px-2.5 py-1 text-xs rounded bg-slate-900 border border-slate-700 text-white font-semibold focus:outline-none focus:border-emerald-500"
                        />
                        <input
                          type="text"
                          value={inlineSpeaker}
                          onChange={(e) => setInlineSpeaker(e.target.value)}
                          placeholder="Speaker name"
                          className="px-2.5 py-1 text-xs rounded bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                        />
                        <button
                          type="submit"
                          className="px-2.5 py-1 text-xs bg-emerald-600 text-white font-semibold rounded hover:bg-emerald-500"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsEditingTitleInline(false)}
                          className="px-2 py-1 text-xs text-slate-400 hover:text-white"
                        >
                          Cancel
                        </button>
                      </form>
                    ) : (
                      <div className="flex items-center justify-center gap-2.5 group">
                        <span className="font-display text-xs sm:text-sm uppercase tracking-[0.14em] font-semibold text-slate-200">
                          {state.title || 'Church Service'}
                        </span>
                        {state.speaker && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-slate-500 shrink-0" />
                            <span className="text-xs sm:text-sm text-slate-400 font-medium">
                              {state.speaker}
                            </span>
                          </>
                        )}
                        <button
                          onClick={() => {
                            setInlineTitle(state.title || '');
                            setInlineSpeaker(state.speaker || '');
                            setIsEditingTitleInline(true);
                          }}
                          className="p-1 rounded text-slate-500 hover:text-slate-200 transition-all opacity-0 group-hover:opacity-100"
                          title="Quick edit segment title & speaker"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div
                    onClick={onOpenQuickSetup}
                    className="cursor-pointer group relative p-3 rounded-2xl transition-all hover:bg-white/5 active:scale-98"
                    title="Click digits to Quick Edit time (Q)"
                  >
                    {isTimeUp ? (
                      <div className="space-y-2 animate-bounce-subtle">
                        <div
                          className="font-display text-6xl sm:text-8xl md:text-9xl font-extrabold leading-none transition-colors duration-300"
                          style={{
                            color: activeColor,
                            fontFamily: fontFamilyStyle,
                            filter: `drop-shadow(0 0 22px ${activeColor}55) drop-shadow(0 0 70px ${activeColor}30)`,
                          }}
                        >
                          {stageTheme.timeUpText || 'Time-up'}
                        </div>
                        {state.overtimeEnabled && (
                          <div
                            className="font-timer text-base sm:text-xl font-bold mt-2"
                            style={{ color: `${activeColor}dd` }}
                          >
                            Overtime: {formatted}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div
                        className="font-timer text-7xl sm:text-9xl md:text-[10rem] font-extrabold leading-none transition-colors duration-300 select-all"
                        style={{
                          color: activeColor,
                          fontFamily: fontFamilyStyle,
                          filter: `drop-shadow(0 0 18px ${activeColor}40) drop-shadow(0 0 60px ${activeColor}26)`,
                        }}
                      >
                        {formatted}
                      </div>
                    )}

                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 text-[10px] text-amber-300 font-semibold px-2 py-0.5 rounded border border-amber-500/40 pointer-events-none whitespace-nowrap">
                      ⚡ Click to Quick Setup / Edit Time
                    </div>
                  </div>

                  <div className="w-full max-w-md mx-auto mt-6 space-y-2">
                    <div className="w-full bg-white/[0.07] rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full transition-all duration-500 rounded-full"
                        style={{
                          width: `${progressPercent}%`,
                          background: `linear-gradient(90deg, ${activeColor}99, ${activeColor})`,
                          boxShadow: `0 0 12px ${activeColor}66`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono px-0.5">
                      <span>{Math.round(elapsedSec / 60)}m elapsed</span>
                      <span className="px-2 py-0.5 rounded-full bg-white/[0.07] border border-white/10 text-slate-300 font-semibold">
                        {progressPercent}%
                      </span>
                      <span>Target: {Math.round(totalSec / 60)}m</span>
                    </div>
                  </div>

                  {state.stageMessage && state.stageMessage.active && (
                    <div className={`mt-4 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold max-w-md border ${
                      state.stageMessage.flash
                        ? 'animate-flash-red text-white border-red-300'
                        : 'bg-amber-500/20 border-amber-500/70 text-amber-200'
                    }`}>
                      Church Alert: &ldquo;{state.stageMessage.text}&rdquo;
                    </div>
                  )}
                </>
              )}
            </div>

            <div className={`px-5 py-2.5 border-t border-b flex items-center justify-between gap-2 overflow-x-auto ${uiTheme.surfaceClass} ${uiTheme.borderClass}`}>
              <div className="flex items-center gap-1.5 shrink-0 text-xs font-semibold text-amber-400">
                <Zap className="w-3.5 h-3.5 fill-amber-400" />
                <span className="hidden sm:inline">Quick Set:</span>
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
                {COMMON_QUICK_PRESETS.map((p) => {
                  const targetSec = p.min * 60;
                  const isCurrent = state.totalDurationSeconds === targetSec;
                  return (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => onSetDuration(targetSec, state.title, state.speaker)}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all shrink-0 ${
                        isCurrent
                          ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                          : `${uiTheme.cardClass} ${uiTheme.textSecondaryClass} hover:border-emerald-500/50`
                      }`}
                      title={`Quick set timer to ${p.min} minutes`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
              {onOpenQuickSetup && (
                <button
                  type="button"
                  onClick={onOpenQuickSetup}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-colors shrink-0"
                >
                  Custom...
                </button>
              )}
            </div>

            <div className={`p-4 sm:p-5 space-y-4 ${uiTheme.cardClass}`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {!state.isRunning ? (
                    <button
                      onClick={onStart}
                      className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-sm rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/30 active:scale-95"
                      title="Start Countdown (Spacebar)"
                    >
                      <Play className="w-4 h-4 fill-white" />
                      <span>Start Timer</span>
                    </button>
                  ) : (
                    <button
                      onClick={onPause}
                      className="px-6 py-2.5 bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-500 hover:to-orange-400 text-white font-bold text-sm rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-amber-500/30 active:scale-95"
                      title="Pause Countdown (Spacebar)"
                    >
                      <Pause className="w-4 h-4 fill-white" />
                      <span>Pause Timer</span>
                    </button>
                  )}

                  <button
                    onClick={onReset}
                    className={`px-4 py-2.5 font-semibold text-sm rounded-xl flex items-center gap-1.5 transition-colors border ${uiTheme.surfaceClass} ${uiTheme.borderClass} ${uiTheme.textPrimaryClass} hover:border-slate-500/60`}
                    title="Reset to initial duration (R)"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Reset</span>
                  </button>

                  <button
                    onClick={handleSaveCurrentTimerAsPreset}
                    className={`hidden sm:flex px-3.5 py-2.5 font-semibold text-sm rounded-xl items-center gap-1.5 transition-colors border ${uiTheme.surfaceClass} ${uiTheme.borderClass} ${uiTheme.textSecondaryClass} hover:${uiTheme.textPrimaryClass}`}
                    title="Save currently loaded timer length and title as a custom preset"
                  >
                    <BookmarkPlus className="w-4 h-4 text-emerald-400" />
                    <span>Save Preset</span>
                  </button>
                </div>

                <div className={`flex items-center gap-1 p-1 rounded-xl border ${uiTheme.surfaceClass} ${uiTheme.borderClass}`}>
                  <span className={`text-[11px] font-semibold px-2 ${uiTheme.textMutedClass}`}>Quick Adjust:</span>
                  <button
                    onClick={() => onAdjustTime(60)}
                    className="px-2.5 py-1 text-xs font-bold text-emerald-400 hover:bg-emerald-500/20 rounded-lg transition-colors"
                    title="Add 1 minute (+)"
                  >
                    +1m
                  </button>
                  <button
                    onClick={() => onAdjustTime(300)}
                    className="px-2.5 py-1 text-xs font-bold text-emerald-400 hover:bg-emerald-500/20 rounded-lg transition-colors"
                    title="Add 5 minutes"
                  >
                    +5m
                  </button>
                  <button
                    onClick={() => onAdjustTime(30)}
                    className="px-2.5 py-1 text-xs font-bold text-emerald-400 hover:bg-emerald-500/20 rounded-lg transition-colors"
                    title="Add 30 seconds"
                  >
                    +30s
                  </button>
                  <button
                    onClick={() => onAdjustTime(-60)}
                    className="px-2.5 py-1 text-xs font-bold text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                    title="Subtract 1 minute (-)"
                  >
                    -1m
                  </button>
                </div>
              </div>

              <div className={`pt-3 border-t flex flex-wrap items-center justify-between gap-3 text-xs ${uiTheme.borderClass}`}>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => onToggleBlackout()}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                      state.isBlackout
                        ? 'bg-amber-600/20 border-amber-500 text-amber-300'
                        : `${uiTheme.surfaceClass} ${uiTheme.borderClass} ${uiTheme.textSecondaryClass} hover:${uiTheme.textPrimaryClass}`
                    }`}
                    title="Blackout Stage Screen (B)"
                  >
                    {state.isBlackout ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    <span>{state.isBlackout ? 'Unblank Screen' : 'Blackout Screen'}</span>
                  </button>

                  <button
                    onClick={() => onToggleSound()}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                      state.soundAlertsEnabled
                        ? `${uiTheme.surfaceClass} border-emerald-500/50 text-emerald-400`
                        : `${uiTheme.surfaceClass} ${uiTheme.borderClass} ${uiTheme.textMutedClass}`
                    }`}
                    title="Toggle audio alerts (M)"
                  >
                    {state.soundAlertsEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                    <span>{state.soundAlertsEnabled ? 'Chimes Active' : 'Chimes Muted'}</span>
                  </button>

                  <button
                    onClick={() => onToggleOvertime()}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                      state.overtimeEnabled
                        ? `${uiTheme.surfaceClass} ${uiTheme.borderClass} ${uiTheme.textPrimaryClass}`
                        : `${uiTheme.surfaceClass} ${uiTheme.borderClass} ${uiTheme.textMutedClass}`
                    }`}
                    title="Count up overtime once expired"
                  >
                    <span className="whitespace-nowrap">Overtime Count: {state.overtimeEnabled ? 'ON' : 'OFF'}</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-[11px] ${uiTheme.textMutedClass}`}>Test Chimes:</span>
                  <button
                    onClick={() => playChime('amber')}
                    className="text-[11px] text-amber-400 hover:text-amber-300 px-2 py-1 rounded bg-amber-500/10 border border-amber-500/30 transition-colors"
                    title="Preview Amber Chime (60s)"
                  >
                    Amber (60s)
                  </button>
                  <button
                    onClick={() => playChime('red')}
                    className="text-[11px] text-red-400 hover:text-red-300 px-2 py-1 rounded bg-red-500/10 border border-red-500/30 transition-colors"
                    title="Preview Red Chime (30s)"
                  >
                    Red (30s)
                  </button>
                  <button
                    onClick={() => playChime('timeup')}
                    className="text-[11px] text-red-500 hover:text-red-400 px-2 py-1 rounded bg-red-600/10 border border-red-600/30 font-bold transition-colors"
                    title="Preview Time-up Bell"
                  >
                    Time-up
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: prompts & stage color info beside the countdown monitor */}
        <div className="lg:col-span-5 space-y-6">
          <div className={`rounded-2xl p-5 border shadow-lg space-y-4 ${uiTheme.cardClass} ${uiTheme.borderClass}`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`font-display text-sm font-bold ${uiTheme.textPrimaryClass}`}>Stage & Pulpit Prompt Center</h3>
                <p className={`text-xs mt-0.5 ${uiTheme.textMutedClass}`}>
                  Send silent discrete prompts or notices directly to the stage confidence monitor.
                </p>
              </div>
              {state.stageMessage && (
                <button
                  onClick={onClearStageMessage}
                  className="px-2.5 py-1 text-xs bg-red-950/40 text-red-400 hover:bg-red-900/60 border border-red-800/60 rounded-lg flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear Active Alert</span>
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                { label: 'Wrap up please', flash: false },
                { label: '2 Minutes Left', flash: false },
                { label: 'Please conclude', flash: true },
                { label: 'Baby crying: Nursery #204', flash: true },
                { label: 'Mic audio battery low', flash: false },
              ].map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => onSendStageMessage(item.label, item.flash)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${uiTheme.surfaceClass} ${uiTheme.borderClass} ${uiTheme.textSecondaryClass} hover:${uiTheme.textPrimaryClass} hover:border-emerald-500/50`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                placeholder="Type custom message for speaker or stage team..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                className={`flex-1 rounded-xl px-3 py-2 text-xs border focus:outline-none focus:border-emerald-500 ${uiTheme.surfaceClass} ${uiTheme.borderClass} ${uiTheme.textPrimaryClass}`}
              />
              <label className={`flex items-center gap-1.5 text-xs px-2 cursor-pointer select-none ${uiTheme.textMutedClass}`}>
                <input
                  type="checkbox"
                  checked={flashAlert}
                  onChange={(e) => setFlashAlert(e.target.checked)}
                  className="rounded border-slate-700 text-emerald-500"
                />
                <span>Flash</span>
              </label>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </form>
          </div>

          <div className={`p-4 rounded-2xl border space-y-3 text-xs ${uiTheme.surfaceClass} ${uiTheme.borderClass}`}>
            <div className="flex items-center justify-between">
              <span className={`font-bold uppercase tracking-wider block ${uiTheme.textPrimaryClass}`}>
                Stage Warnings — This Session
              </span>
              <button
                type="button"
                onClick={onOpenThemeModal}
                className="text-emerald-400 hover:text-emerald-300 text-[11px] underline underline-offset-2 flex items-center gap-1"
              >
                <Palette className="w-3 h-3" />
                <span>Customize</span>
              </button>
            </div>

            {/* Per-session threshold overrides (auto-scaled by default when a duration is set) */}
            <div className="grid grid-cols-2 gap-2">
              <label className="flex flex-col gap-1">
                <span className={`text-[10px] font-semibold uppercase tracking-wider ${uiTheme.textMutedClass}`}>
                  Amber warning at
                </span>
                <select
                  value={stageTheme.warning1Seconds}
                  onChange={(e) => {
                    const w1 = parseInt(e.target.value, 10);
                    const w2 = Math.min(stageTheme.warning2Seconds, w1 - 15);
                    onSetThresholds?.(w1, Math.max(10, w2));
                  }}
                  className={`rounded-lg px-2 py-1.5 border text-xs font-semibold focus:outline-none focus:border-emerald-500 ${uiTheme.surfaceClass} ${uiTheme.borderClass} ${uiTheme.textPrimaryClass}`}
                >
                  {thresholdSelectOptions((s) => s >= 60, stageTheme.warning1Seconds).map((sec) => (
                    <option key={sec} value={sec}>{formatThresholdLabel(sec)}</option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className={`text-[10px] font-semibold uppercase tracking-wider ${uiTheme.textMutedClass}`}>
                  Red warning at
                </span>
                <select
                  value={stageTheme.warning2Seconds}
                  onChange={(e) => {
                    const w2 = parseInt(e.target.value, 10);
                    onSetThresholds?.(Math.max(w2 + 15, stageTheme.warning1Seconds), w2);
                  }}
                  className={`rounded-lg px-2 py-1.5 border text-xs font-semibold focus:outline-none focus:border-emerald-500 ${uiTheme.surfaceClass} ${uiTheme.borderClass} ${uiTheme.textPrimaryClass}`}
                >
                  {thresholdSelectOptions((s) => s < stageTheme.warning1Seconds, stageTheme.warning2Seconds).map((sec) => (
                    <option key={sec} value={sec}>{formatThresholdLabel(sec)}</option>
                  ))}
                </select>
              </label>
            </div>

            <ul className="space-y-1.5 pl-1 pt-1">
              <li className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: stageTheme.countdownColor }} />
                <span>
                  <strong style={{ color: stageTheme.countdownColor }}>Normal:</strong> Digits green above {formatThresholdLabel(stageTheme.warning1Seconds)}
                </span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: stageTheme.warning1Color }} />
                <span>
                  <strong style={{ color: stageTheme.warning1Color }}>Amber:</strong> Shifts to amber at {formatThresholdLabel(stageTheme.warning1Seconds)} remaining
                </span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: stageTheme.warning2Color }} />
                <span>
                  <strong style={{ color: stageTheme.warning2Color }}>Red:</strong> Shifts to red at {formatThresholdLabel(stageTheme.warning2Seconds)} remaining
                </span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: stageTheme.timeUpColor }} />
                <span>
                  <strong style={{ color: stageTheme.timeUpColor }}>Time-Up:</strong> Displays &ldquo;{stageTheme.timeUpText || 'Time-up'}&rdquo; in bold red
                </span>
              </li>
            </ul>
          </div>

          {/* Now & Next — live running order from the active schedule */}
          <div className={`rounded-2xl p-5 border shadow-lg space-y-4 ${uiTheme.cardClass} ${uiTheme.borderClass}`}>
            <div className="flex items-center justify-between">
              <h3 className={`font-display text-sm font-bold ${uiTheme.textPrimaryClass}`}>Now &amp; Next</h3>
              {activeTemplate && (
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${uiTheme.surfaceClass} ${uiTheme.textMutedClass}`}>
                  {activeTemplate.name}
                </span>
              )}
            </div>

            {activeTemplate && activeTemplate.items?.length > 0 ? (
              (() => {
                const items: any[] = activeTemplate.items;
                const currentIdx = items.findIndex((i) => i.title === state.title);
                const nowItem = currentIdx >= 0 ? items[currentIdx] : null;
                const nextItems = currentIdx >= 0
                  ? items.slice(currentIdx + 1, currentIdx + 4)
                  : items.slice(0, 3);

                return (
                  <>
                    {/* Current segment */}
                    <div className={`rounded-xl border p-3.5 ${nowItem ? 'bg-emerald-950/40 border-emerald-700/70' : `${uiTheme.surfaceClass} ${uiTheme.borderClass}`}`}>
                      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
                        <span className={`w-1.5 h-1.5 rounded-full ${state.isRunning ? 'bg-red-500 animate-pulse' : 'bg-slate-500'}`} />
                        <span className={nowItem ? 'text-emerald-400' : uiTheme.textMutedClass}>
                          {nowItem ? (state.isRunning ? 'On Stage Now' : 'Loaded · Standby') : 'Nothing Loaded'}
                        </span>
                      </div>
                      <p className={`font-display text-sm font-bold mt-1.5 ${uiTheme.textPrimaryClass}`}>
                        {nowItem ? nowItem.title : state.title || 'Select a segment below to queue it'}
                      </p>
                      {nowItem?.speaker && (
                        <p className={`text-[11px] mt-0.5 ${uiTheme.textMutedClass}`}>{nowItem.speaker}</p>
                      )}
                    </div>

                    {/* Upcoming segments */}
                    {nextItems.length > 0 && (
                      <div className="space-y-1.5">
                        <p className={`text-[10px] font-bold uppercase tracking-widest ${uiTheme.textMutedClass}`}>
                          Up Next
                        </p>
                        {nextItems.map((item, i) => (
                          <button
                            key={item.id || i}
                            onClick={() => onLoadPreset(item)}
                            className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-xl border text-left transition-all group ${uiTheme.surfaceClass} ${uiTheme.borderClass} hover:border-emerald-500/50`}
                            title={`Queue "${item.title}" to the stage timer`}
                          >
                            <div className="min-w-0 flex-1 flex items-center gap-2.5">
                              <span className={`text-[10px] font-mono font-bold shrink-0 ${uiTheme.textMutedClass}`}>
                                {String((currentIdx >= 0 ? currentIdx + 2 + i : i + 1)).padStart(2, '0')}
                              </span>
                              <div className="min-w-0">
                                <p className={`text-xs font-semibold truncate ${uiTheme.textPrimaryClass}`}>{item.title}</p>
                                {item.speaker && (
                                  <p className={`text-[10px] truncate ${uiTheme.textMutedClass}`}>{item.speaker}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[10px] font-mono text-amber-400 font-semibold">
                                {item.durationMinutes}m
                              </span>
                              <span className="text-[10px] font-bold text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                Queue →
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {currentIdx >= 0 && currentIdx + 1 >= items.length && (
                      <p className={`text-[11px] italic ${uiTheme.textMutedClass}`}>
                        This is the final segment of the service. 🎬
                      </p>
                    )}
                  </>
                );
              })()
            ) : (
              <div className={`p-5 text-center border border-dashed rounded-xl space-y-2 ${uiTheme.borderClass}`}>
                <Calendar className="w-6 h-6 text-slate-500 mx-auto" />
                <p className={`text-xs font-semibold ${uiTheme.textPrimaryClass}`}>No schedule tab selected</p>
                <p className={`text-[11px] ${uiTheme.textMutedClass}`}>
                  Pick a schedule tab above, or use Edit Schedule to build your running order — it will appear here live.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={`rounded-2xl p-5 border shadow-lg space-y-4 ${uiTheme.cardClass} ${uiTheme.borderClass}`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className={`font-display text-sm font-bold ${uiTheme.textPrimaryClass}`}>Church Service Schedule & Presets</h3>
            <p className={`text-xs mt-0.5 ${uiTheme.textMutedClass}`}>1-click queue segments, edit service orders, or load custom presets.</p>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsScheduleEditorOpen(true)}
              className="px-2.5 py-1 text-xs bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30 rounded-lg flex items-center gap-1 font-semibold transition-colors shadow-sm"
              title="Edit Church Service Schedule & Presets"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Edit Schedule</span>
            </button>
          </div>
        </div>

        <div className={`grid grid-cols-2 sm:grid-cols-3 gap-1.5 p-1 rounded-xl border ${uiTheme.surfaceClass} ${uiTheme.borderClass}`}>
          {schedules.map((tmpl, idx) => (
            <button
              key={tmpl.id}
              onClick={() => setActiveTab(idx)}
              className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg text-center transition-colors truncate ${
                activeTab === idx
                  ? `${uiTheme.accentBgClass} shadow-sm`
                  : `${uiTheme.textMutedClass} hover:${uiTheme.textPrimaryClass}`
              }`}
              title={tmpl.name}
            >
              {tmpl.name}
            </button>
          ))}
          <button
            onClick={() => setActiveTab('custom')}
            className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg text-center transition-colors truncate flex items-center justify-center gap-1.5 ${
              activeTab === 'custom'
                ? 'bg-emerald-950 text-emerald-300 shadow-sm border border-emerald-700/80'
                : 'text-emerald-400 hover:text-emerald-300'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5 shrink-0" />
            <span>Saved ({customPresets.length})</span>
          </button>
        </div>

        {saveSuccessMessage && (
          <div className="px-3.5 py-2 bg-emerald-950/60 border border-emerald-800/80 rounded-xl text-emerald-300 text-xs flex items-center justify-between transition-all">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{saveSuccessMessage}</span>
            </div>
            <button
              onClick={() => setSaveSuccessMessage(null)}
              className="text-emerald-400/70 hover:text-emerald-200 text-[10px]"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
          {activeTab === 'custom' ? (
            customPresets.length === 0 ? (
              <div className={`p-6 text-center border border-dashed rounded-xl space-y-2 ${uiTheme.borderClass}`}>
                <BookmarkPlus className="w-8 h-8 text-slate-500 mx-auto" />
                <p className={`text-xs font-semibold ${uiTheme.textPrimaryClass}`}>No custom presets saved yet</p>
                <p className={`text-[11px] max-w-xs mx-auto ${uiTheme.textMutedClass}`}>
                  Use the &ldquo;Custom Countdown Configuration&rdquo; below or &ldquo;Save Preset&rdquo; to store frequent service durations.
                </p>
              </div>
            ) : (
              customPresets.map((item, idx) => {
                const totalSec = (item.durationMinutes || 0) * 60 + (item.durationSeconds || 0);
                const isCurrent = state.totalDurationSeconds === totalSec && state.title === item.title;
                const durationLabel =
                  item.durationSeconds && item.durationSeconds > 0
                    ? `${item.durationMinutes}m ${item.durationSeconds}s`
                    : `${item.durationMinutes} min`;

                if (editingCustomPresetId === item.id) {
                  return (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl border border-amber-500/80 bg-slate-900/90 space-y-2.5 animate-in fade-in"
                    >
                      <div className="flex items-center justify-between text-xs font-bold text-amber-300">
                        <span>Edit Preset #{idx + 1}</span>
                        <button
                          onClick={() => setEditingCustomPresetId(null)}
                          className="text-slate-400 hover:text-white text-[11px]"
                        >
                          Cancel
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={editPresetTitle}
                          onChange={(e) => setEditPresetTitle(e.target.value)}
                          placeholder="Preset Title"
                          className="px-2.5 py-1 text-xs rounded bg-slate-900 border border-slate-700 text-white font-semibold"
                        />
                        <input
                          type="text"
                          value={editPresetSpeaker}
                          onChange={(e) => setEditPresetSpeaker(e.target.value)}
                          placeholder="Speaker (Optional)"
                          className="px-2.5 py-1 text-xs rounded bg-slate-900 border border-slate-700 text-white"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <span className="text-[11px] text-slate-400">Min:</span>
                          <input
                            type="number"
                            min="0"
                            max="600"
                            value={editPresetMinutes}
                            onChange={(e) => setEditPresetMinutes(Math.max(0, parseInt(e.target.value, 10) || 0))}
                            className="w-16 px-2 py-1 text-xs rounded bg-slate-950 border border-slate-700 text-white font-mono"
                          />
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[11px] text-slate-400">Sec:</span>
                          <input
                            type="number"
                            min="0"
                            max="59"
                            value={editPresetSeconds}
                            onChange={(e) => setEditPresetSeconds(Math.max(0, parseInt(e.target.value, 10) || 0))}
                            className="w-16 px-2 py-1 text-xs rounded bg-slate-950 border border-slate-700 text-white font-mono"
                          />
                        </div>
                        <div className="flex-1 flex justify-end gap-1.5">
                          <button
                            onClick={() => setEditingCustomPresetId(null)}
                            className="px-2.5 py-1 text-xs text-slate-400 hover:text-white"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveEditCustomPreset(item.id)}
                            className="px-3 py-1 text-xs bg-amber-500 text-slate-950 font-bold rounded flex items-center gap-1"
                          >
                            <Save className="w-3 h-3" />
                            <span>Save</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={item.id}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                      isCurrent
                        ? 'bg-emerald-950/40 border-emerald-700 text-white'
                        : `${uiTheme.surfaceClass} ${uiTheme.borderClass} ${uiTheme.textPrimaryClass} hover:border-slate-500/50`
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-emerald-400 font-mono">#{idx + 1}</span>
                        <h4 className="text-xs font-semibold truncate">{item.title}</h4>
                      </div>
                      <div className={`flex items-center gap-2 text-[11px] mt-0.5 ${uiTheme.textMutedClass}`}>
                        <span className="text-emerald-400 font-bold">{durationLabel}</span>
                        {item.speaker && (
                          <>
                            <span>·</span>
                            <span className="truncate">{item.speaker}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => onLoadPreset(item)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors shrink-0 ${
                          isCurrent
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : `${uiTheme.cardClass} ${uiTheme.borderClass} border hover:border-emerald-500/60`
                        }`}
                      >
                        {isCurrent ? 'Active on Stage' : 'Load Preset'}
                      </button>
                      <button
                        onClick={() => handleStartEditCustomPreset(item)}
                        className="p-1.5 text-slate-400 hover:text-amber-400 rounded-lg transition-colors"
                        title="Edit this saved preset"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteCustomPreset(item.id, item.title)}
                        className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg transition-colors"
                        title="Delete this saved preset"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
              )
            ) : activeTemplate ? (
              activeTemplate.items.map((item: any, idx: number) => {
                const isCurrent = state.title === item.title;
                const durLabel =
                  item.durationSeconds && item.durationSeconds > 0
                    ? `${item.durationMinutes}m ${item.durationSeconds}s`
                    : `${item.durationMinutes} min`;

                return (
                  <div
                    key={item.id}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                      isCurrent
                        ? 'bg-emerald-950/40 border-emerald-700 text-white'
                        : `${uiTheme.surfaceClass} ${uiTheme.borderClass} ${uiTheme.textPrimaryClass} hover:border-slate-500/50`
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-mono ${uiTheme.textMutedClass}`}>0{idx + 1}.</span>
                        <h4 className="text-xs font-semibold truncate">{item.title}</h4>
                      </div>
                      <div className={`flex items-center gap-2 text-[11px] mt-0.5 ${uiTheme.textMutedClass}`}>
                        <span className="font-mono text-amber-400 font-semibold">{durLabel}</span>
                        {item.speaker && (
                          <>
                            <span>·</span>
                            <span className="truncate">{item.speaker}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => onLoadPreset(item)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors shrink-0 ${
                          isCurrent
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : `${uiTheme.cardClass} ${uiTheme.borderClass} border hover:border-emerald-500/60`
                        }`}
                      >
                        {isCurrent ? 'Queued' : 'Load Segment'}
                      </button>
                      <button
                        onClick={() => setIsScheduleEditorOpen(true)}
                        className="p-1.5 text-slate-400 hover:text-amber-400 rounded-lg transition-colors"
                        title="Edit this service order or segment"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            ) : null
          }
        </div>

        <div className={`rounded-2xl p-5 border shadow-lg space-y-4 ${uiTheme.cardClass} ${uiTheme.borderClass}`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className={`font-display text-sm font-bold ${uiTheme.textPrimaryClass}`}>Custom Countdown Builder</h3>
              <p className={`text-xs mt-0.5 ${uiTheme.textMutedClass}`}>Set any custom duration, title, and speaker.</p>
            </div>
          </div>

          <form onSubmit={handleCustomApply} className="space-y-3">
            <div>
              <label className={`text-xs font-semibold ${uiTheme.textSecondaryClass}`}>Session / Segment Name</label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                className={`w-full mt-1 rounded-xl px-3 py-2 text-xs border focus:outline-none focus:border-emerald-500 ${uiTheme.surfaceClass} ${uiTheme.borderClass} ${uiTheme.textPrimaryClass}`}
                placeholder="e.g. Guest Speaker Word"
              />
            </div>

            <div>
              <label className={`text-xs font-semibold ${uiTheme.textSecondaryClass}`}>Speaker Name (Optional)</label>
              <input
                type="text"
                value={customSpeaker}
                onChange={(e) => setCustomSpeaker(e.target.value)}
                className={`w-full mt-1 rounded-xl px-3 py-2 text-xs border focus:outline-none focus:border-emerald-500 ${uiTheme.surfaceClass} ${uiTheme.borderClass} ${uiTheme.textPrimaryClass}`}
                placeholder="e.g. Bishop Thomas"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={`text-xs font-semibold ${uiTheme.textSecondaryClass}`}>Minutes</label>
                <input
                  type="number"
                  min="0"
                  max="600"
                  value={customMinutes}
                  onChange={(e) => setCustomMinutes(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className={`w-full mt-1 rounded-xl px-3 py-2 text-xs font-mono border focus:outline-none focus:border-emerald-500 ${uiTheme.surfaceClass} ${uiTheme.borderClass} ${uiTheme.textPrimaryClass}`}
                />
              </div>
              <div>
                <label className={`text-xs font-semibold ${uiTheme.textSecondaryClass}`}>Seconds</label>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={customSeconds}
                  onChange={(e) => setCustomSeconds(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className={`w-full mt-1 rounded-xl px-3 py-2 text-xs font-mono border focus:outline-none focus:border-emerald-500 ${uiTheme.surfaceClass} ${uiTheme.borderClass} ${uiTheme.textPrimaryClass}`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-colors shadow-md flex items-center justify-center gap-1.5 active:scale-98"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Apply to Stage</span>
              </button>
              <button
                type="button"
                onClick={handleSaveCustomPreset}
                className={`w-full py-2.5 font-bold text-xs rounded-xl transition-colors border flex items-center justify-center gap-1.5 ${uiTheme.surfaceClass} ${uiTheme.borderClass} ${uiTheme.textPrimaryClass} hover:border-emerald-500/60`}
              >
                <BookmarkPlus className="w-3.5 h-3.5 text-emerald-400" />
                <span>Save as Preset</span>
              </button>
            </div>
          </form>
        </div>
      </div>

    {/* Modals */}
    <ScheduleEditorModal
      isOpen={isScheduleEditorOpen}
      onClose={() => setIsScheduleEditorOpen(false)}
      onSchedulesUpdated={(updated) => setCustomScheduleState(updated)}
      onLoadPreset={onLoadPreset}
      activePresetTitle={state.title}
    />
  </div>
  );
};
