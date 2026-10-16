import React, { useState } from 'react';
import {
  TimerState,
  ChurchPreset,
  getTimerColorStatus,
  getActiveTimerColor,
  DEFAULT_THEME_CONFIG,
  ChurchServiceTemplate,
} from '../types/timer';
import { BACKGROUND_STYLES } from '../data/themes';
import { formatTimeDisplay } from '../hooks/useTimerSync';
import { playChime } from '../utils/audio';
import { useUITheme } from '../context/ThemeContext';
import { UIThemePreset } from '../types/uiTheme';
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
  Share2,
  Clock,
  Sparkles,
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
  HelpCircle,
  Radio,
  Sliders,
  Calendar,
  Sun,
  Moon,
  Video,
  Image as ImageIcon,
  ArrowRightLeft,
  Save,
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
  onLoadPreset: (preset: ChurchPreset) => void;
  onSendStageMessage: (text: string, flash: boolean) => void;
  onClearStageMessage: () => void;
  onToggleBlackout: (isBlackout?: boolean) => void;
  onToggleSound: (enabled?: boolean) => void;
  onToggleOvertime: (enabled?: boolean) => void;
  onSetTitleAndSpeaker: (title: string, speaker?: string) => void;
  onOpenShareModal: () => void;
  onOpenThemeModal: () => void;
  onOpenQuickSetup?: () => void;
  onOpenNdiModal?: () => void;
  onOpenChurchLogoModal?: () => void;
  onOpenInteroperabilityModal?: () => void;
  onOpenScheduleEditor?: () => void;
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
  // { label: '35m', min: 35 },
  // { label: '45m', min: 45 },
  // { label: '60m', min: 60 },
];

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
  onSetTitleAndSpeaker,
  onOpenShareModal,
  onOpenThemeModal,
  onOpenQuickSetup,
  onOpenNdiModal,
  onOpenChurchLogoModal,
  onOpenInteroperabilityModal,
  onOpenScheduleEditor,
}) => {
  const { currentTheme, theme: uiTheme, setTheme: setUITheme, toggleDarkLight } = useUITheme();
  const CUSTOM_STORAGE_KEY = 'sanctuary_custom_presets';

  // Load custom presets from localStorage or defaults
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
      } catch {
        // fallback
      }
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

  // Church service schedules state (stored locally, customizable, and persistent)
  const [schedules, setSchedules] = useState<ChurchServiceTemplate[]>(() => getStoredSchedules());
  const [isScheduleEditorOpen, setIsScheduleEditorOpen] = useState(false);

  // Quick edit state for custom saved presets
  const [editingCustomPresetId, setEditingCustomPresetId] = useState<string | null>(null);
  const [editPresetTitle, setEditPresetTitle] = useState('');
  const [editPresetSpeaker, setEditPresetSpeaker] = useState('');
  const [editPresetMinutes, setEditPresetMinutes] = useState(15);
  const [editPresetSeconds, setEditPresetSeconds] = useState(0);

  const handleStartEditCustomPreset = (preset: ChurchPreset) => {
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

  // Track active tab: either index of built-in templates or 'custom' for user saved presets
  const [activeTab, setActiveTab] = useState<number | 'custom'>('custom');
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // Sync custom presets to localStorage
  const persistCustomPresets = (updated: ChurchPreset[]) => {
    setCustomPresets(updated);
    try {
      localStorage.setItem(CUSTOM_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
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
    const totalSec = state.totalDurationSeconds;
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    const trimmedTitle = state.title || 'Current Segment';
    const trimmedSpeaker = state.speaker || undefined;

    const newPreset: ChurchPreset = {
      id: `custom-${Date.now()}`,
      title: trimmedTitle,
      speaker: trimmedSpeaker,
      durationMinutes: mins,
      durationSeconds: secs,
      category: 'custom',
    };

    const updated = [newPreset, ...customPresets];
    persistCustomPresets(updated);
    setActiveTab('custom');
    setSaveSuccessMessage(`"${trimmedTitle}" (${mins}m ${secs > 0 ? secs + 's' : ''}) saved to presets!`);
    setTimeout(() => setSaveSuccessMessage(null), 3000);
  };

  const handleDeleteCustomPreset = (presetId: string, presetTitle: string) => {
    const updated = customPresets.filter((p) => p.id !== presetId);
    persistCustomPresets(updated);
    setSaveSuccessMessage(`Deleted "${presetTitle}"`);
    setTimeout(() => setSaveSuccessMessage(null), 2500);
  };

  const stageTheme = state.themeConfig || DEFAULT_THEME_CONFIG;

  const colorStatus = getTimerColorStatus(
    state.remainingSeconds,
    stageTheme.warning1Seconds ?? 60,
    stageTheme.warning2Seconds ?? 30
  );
  const activeColor = getActiveTimerColor(colorStatus, stageTheme);
  const { formatted } = formatTimeDisplay(state.remainingSeconds);
  const isTimeUp = state.remainingSeconds <= 0;

  // Calculate elapsed progress percentage
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

  const handleOpenSecondScreen = () => {
    const width = 1280;
    const height = 720;
    const left = window.screen.width ? window.screen.width : 200;
    const stageUrl = `${window.location.origin}/?view=stage&room=${encodeURIComponent(state.roomId)}`;
    window.open(
      stageUrl,
      `SanctuaryStage_${state.roomId}`,
      `width=${width},height=${height},left=${left},top=0,menubar=no,toolbar=no,location=no,status=no`
    );
  };

  const activeTemplate =
    typeof activeTab === 'number' && schedules[activeTab] ? schedules[activeTab] : null;

  const THEME_CHIPS: { id: UIThemePreset; label: string; color: string }[] = [
    { id: 'dark', label: 'Dark', color: '#0f172a' },
    { id: 'light', label: 'Light', color: '#ffffff' },
    { id: 'midnight-navy', label: 'Navy', color: '#08152c' },
    { id: 'emerald-sanctuary', label: 'Forest', color: '#072418' },
    { id: 'royal-purple', label: 'Royal', color: '#1a0a33' },
    { id: 'warm-amber', label: 'Amber', color: '#241a08' },
  ];

  return (
    <div className="space-y-6 pb-12 transition-colors duration-200">
      {/* Top Banner Notice: Online Sync, Theme quick chips & Second Screen launcher */}
      <section
        className={`rounded-2xl p-4 sm:p-5 border shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors ${uiTheme.cardClass} ${uiTheme.borderClass}`}
      >
        <div className="flex items-start sm:items-center gap-3.5">
          <div
            className={`w-3.5 h-3.5 rounded-full mt-0.5 sm:mt-0 shrink-0 ${
              connected ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-amber-500 animate-pulse'
            }`}
          />
          <div>
            <div className={`text-sm font-bold flex flex-wrap items-center gap-2 ${uiTheme.textPrimaryClass}`}>
              <span>Sanctuary Room: &ldquo;{state.roomId.toUpperCase()}&rdquo;</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${
                connected ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              }`}>
                {connected ? '● Live Online Synchronized' : 'Connecting...'}
              </span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${
                state.isRunning ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-slate-700/60 text-slate-300 border-slate-600'
              }`}>
                {state.isRunning ? 'ON AIR' : 'STANDBY'}
              </span>
            </div>
            <p className={`text-xs mt-1 ${uiTheme.textMutedClass}`}>
              Stage transitions: <span className="text-emerald-400 font-semibold">Green</span> &gt; 60s ·{' '}
              <span className="text-amber-400 font-semibold">Amber</span> ≤ {stageTheme.warning1Seconds}s ·{' '}
              <span className="text-red-400 font-semibold">Red</span> ≤ {stageTheme.warning2Seconds}s ·{' '}
              <span className="text-red-500 font-bold">Time-up in Red</span>.
            </p>
          </div>
        </div>

        {/* Quick Interface Theme Buttons & Action bar */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Direct Theme Switcher Chips */}
          <div className={`hidden sm:flex items-center gap-1 p-1 rounded-xl border ${uiTheme.surfaceClass} ${uiTheme.borderClass}`}>
            {THEME_CHIPS.map((chip) => {
              const isSelected = currentTheme === chip.id;
              return (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => setUITheme(chip.id)}
                  className={`px-2 py-1 text-[11px] font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? `${uiTheme.accentBgClass} shadow-sm`
                      : `${uiTheme.textSecondaryClass} hover:${uiTheme.textPrimaryClass}`
                  }`}
                  title={`Switch to ${chip.label} theme`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full border border-black/30 shrink-0"
                    style={{ backgroundColor: chip.color }}
                  />
                  <span>{chip.label}</span>
                </button>
              );
            })}
          </div>

          {/* Quick Setup Button */}
          {onOpenQuickSetup && (
            <button
              onClick={onOpenQuickSetup}
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
              title="Instant Quick Timer Setup (Q)"
            >
              <Zap className="w-4 h-4 fill-slate-950" />
              <span>Quick Setup</span>
            </button>
          )}

          {/* NDI Video Output Button */}
          {onOpenNdiModal && (
            <button
              onClick={onOpenNdiModal}
              className={`px-3 py-2 text-xs font-semibold rounded-xl border flex items-center justify-center gap-1.5 transition-colors ${uiTheme.surfaceClass} border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10`}
              title="NDI® Video Output for vMix and OBS Studio"
            >
              <Video className="w-4 h-4" />
              <span className="hidden sm:inline">NDI® Output</span>
            </button>
          )}

          {/* Church Logo Button */}
          {onOpenChurchLogoModal && (
            <button
              onClick={onOpenChurchLogoModal}
              className={`px-3 py-2 text-xs font-semibold rounded-xl border flex items-center justify-center gap-1.5 transition-colors ${uiTheme.surfaceClass} border-amber-500/30 text-amber-400 hover:bg-amber-500/10`}
              title="Custom Church Logo & Branding"
            >
              <ImageIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Church Logo</span>
            </button>
          )}

          {/* Interoperability / Offline Hub */}
          {onOpenInteroperabilityModal && (
            <button
              onClick={onOpenInteroperabilityModal}
              className={`px-3 py-2 text-xs font-semibold rounded-xl border flex items-center justify-center gap-1.5 transition-colors ${uiTheme.surfaceClass} border-purple-500/30 text-purple-400 hover:bg-purple-500/10`}
              title="Desktop App, JSON Backup & Offline Sync"
            >
              <ArrowRightLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Offline Hub</span>
            </button>
          )}

          <button
            onClick={onOpenShareModal}
            className={`px-3 py-2 text-xs font-semibold rounded-xl border flex items-center justify-center gap-1.5 transition-colors ${uiTheme.surfaceClass} ${uiTheme.borderClass} ${uiTheme.textPrimaryClass} hover:border-emerald-500/50`}
            title="Online URLs and QR Code for Stage Tablets & Monitors"
          >
            <Share2 className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Online URLs</span>
          </button>

          <button
            onClick={handleOpenSecondScreen}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
            title="Open dedicated popup window for second monitor or stage TV"
          >
            <Monitor className="w-4 h-4" />
            <span className="hidden sm:inline">Extend 2nd Screen</span>
            <span className="sm:hidden">2nd Screen</span>
          </button>
        </div>
      </section>

      {/* Main Director Console Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Stage Monitor, Live Quick Presets Ribbon & Primary Transport Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Main Stage Confidence Monitor Preview Card */}
          <div className={`rounded-2xl border overflow-hidden shadow-2xl ${uiTheme.cardClass} ${uiTheme.borderClass}`}>
            {/* Monitor Card Header */}
            <div className={`px-5 py-3.5 border-b flex items-center justify-between ${uiTheme.surfaceClass} ${uiTheme.borderClass}`}>
              <div className="flex items-center gap-2.5">
                <span className={`text-xs font-bold uppercase tracking-wider ${uiTheme.textPrimaryClass}`}>
                  Live Stage Confidence Monitor
                </span>
                <span className="text-slate-500">·</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded border ${statusBadgeBg}`}>
                  {statusText}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {onOpenQuickSetup && (
                  <button
                    onClick={onOpenQuickSetup}
                    className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors font-medium mr-1"
                    title="Quick Timer Setup (Q)"
                  >
                    <Zap className="w-3.5 h-3.5 fill-amber-400" />
                    <span className="hidden sm:inline">Quick Edit</span>
                  </button>
                )}
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
                  className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors font-semibold"
                  title="Pop out stage display"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Pop out</span>
                </button>
              </div>
            </div>

            {/* Simulated Stage Screen Surface */}
            <div
              className={`p-6 sm:p-10 text-center flex flex-col items-center justify-center min-h-[300px] sm:min-h-[350px] relative transition-colors duration-500 ${
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
                  {/* Church Brand Logo Badge */}
                  {state.churchLogo?.enabled && (
                    <div className="mb-2 flex items-center justify-center">
                      <ChurchLogo config={state.churchLogo} showText={true} className="scale-90" />
                    </div>
                  )}

                  {/* Segment Title & Speaker Preview (with inline edit trigger) */}
                  <div className="mb-3 max-w-lg">
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
                      <div className="flex items-center justify-center gap-2 group">
                        <span className="text-xs sm:text-sm uppercase tracking-wider font-bold text-slate-300">
                          {state.title || 'Church Service'}
                        </span>
                        {state.speaker && (
                          <span className="text-xs sm:text-sm text-slate-400">
                            · {state.speaker}
                          </span>
                        )}
                        <button
                          onClick={() => {
                            setInlineTitle(state.title || '');
                            setInlineSpeaker(state.speaker || '');
                            setIsEditingTitleInline(true);
                          }}
                          className="p-1 rounded text-slate-500 hover:text-slate-200 transition-colors opacity-70 group-hover:opacity-100"
                          title="Quick edit segment title & speaker"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Main Digits (Clickable to Quick Edit!) */}
                  <div
                    onClick={onOpenQuickSetup}
                    className="cursor-pointer group relative p-3 rounded-2xl transition-all hover:bg-white/5 active:scale-98"
                    title="Click digits to Quick Edit time (Q)"
                  >
                    {isTimeUp ? (
                      <div className="space-y-2 animate-bounce-subtle">
                        <div
                          className="text-6xl sm:text-8xl md:text-9xl font-black tracking-tight leading-none transition-colors duration-300"
                          style={{
                            color: activeColor,
                            fontFamily: fontFamilyStyle,
                            filter: `drop-shadow(0 0 35px ${activeColor}80)`,
                          }}
                        >
                          {stageTheme.timeUpText || 'Time-up'}
                        </div>
                        {state.overtimeEnabled && (
                          <div
                            className="text-base sm:text-xl font-mono font-bold mt-2"
                            style={{ color: `${activeColor}dd` }}
                          >
                            Overtime: {formatted}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div
                        className="text-7xl sm:text-9xl md:text-[10rem] font-extrabold tracking-tighter leading-none tabular-nums transition-colors duration-300 select-all"
                        style={{
                          color: activeColor,
                          fontFamily: fontFamilyStyle,
                          filter: `drop-shadow(0 0 30px ${activeColor}50)`,
                        }}
                      >
                        {formatted}
                      </div>
                    )}

                    {/* Quick click hint badge */}
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 text-[10px] text-amber-300 font-semibold px-2 py-0.5 rounded border border-amber-500/40 pointer-events-none whitespace-nowrap">
                      ⚡ Click to Quick Setup / Edit Time
                    </div>
                  </div>

                  {/* Live Progress Bar */}
                  <div className="w-full max-w-md mx-auto mt-4 space-y-1">
                    <div className="w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden border border-slate-700/40">
                      <div
                        className="h-full transition-all duration-300 rounded-full"
                        style={{
                          width: `${progressPercent}%`,
                          backgroundColor: activeColor,
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono px-1">
                      <span>{Math.round(elapsedSec / 60)}m elapsed</span>
                      <span>{progressPercent}%</span>
                      <span>Target: {Math.round(totalSec / 60)}m</span>
                    </div>
                  </div>

                  {/* Active stage ticker prompt */}
                  {state.stageMessage && state.stageMessage.active && (
                    <div className="mt-4 px-4 py-2 bg-amber-500/20 border border-amber-500/70 rounded-xl text-amber-200 text-xs sm:text-sm font-bold max-w-md animate-pulse">
                      Church Alert: &ldquo;{state.stageMessage.text}&rdquo;
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Instant Quick Presets Strip (1-click set common durations) */}
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
                          : `${uiTheme.cardClass} ${uiTheme.textSecondaryClass} hover:border-emerald-500/50 hover:${uiTheme.textPrimaryClass}`
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

            {/* Primary Action Controls Bar */}
            <div className={`p-4 sm:p-5 space-y-4 ${uiTheme.cardClass}`}>
              {/* Transport & Quick Adjustments */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {!state.isRunning ? (
                    <button
                      onClick={onStart}
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl flex items-center gap-2 transition-all shadow-md active:scale-95"
                      title="Start Countdown (Spacebar)"
                    >
                      <Play className="w-4 h-4 fill-white" />
                      <span>Start Timer</span>
                    </button>
                  ) : (
                    <button
                      onClick={onPause}
                      className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm rounded-xl flex items-center gap-2 transition-all shadow-md active:scale-95"
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

                  {onOpenQuickSetup && (
                    <button
                      onClick={onOpenQuickSetup}
                      className="px-3.5 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-semibold text-sm rounded-xl flex items-center gap-1.5 transition-colors border border-amber-500/30"
                      title="Open Quick Setup dialog to change duration, title, speaker (Q)"
                    >
                      <Zap className="w-4 h-4 fill-amber-400" />
                      <span>Quick Setup</span>
                    </button>
                  )}

                  <button
                    onClick={handleSaveCurrentTimerAsPreset}
                    className={`hidden sm:flex px-3.5 py-2.5 font-semibold text-sm rounded-xl items-center gap-1.5 transition-colors border ${uiTheme.surfaceClass} ${uiTheme.borderClass} ${uiTheme.textSecondaryClass} hover:${uiTheme.textPrimaryClass}`}
                    title="Save currently loaded timer length and title as a custom preset"
                  >
                    <BookmarkPlus className="w-4 h-4 text-emerald-400" />
                    <span>Save Preset</span>
                  </button>
                </div>

                {/* Quick Add/Subtract Buttons (+1m, +5m, +30s, -1m) */}
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

              {/* Utility Toggles: Blackout, Sound, Overtime, Chime Tester */}
              <div className={`pt-3 border-t flex flex-wrap items-center justify-between gap-3 text-xs ${uiTheme.borderClass}`}>
                <div className="flex flex-wrap items-center gap-2">
                  {/* Blackout button */}
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

                  {/* Sound Alerts toggle */}
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

                  {/* Overtime Toggle */}
                  <button
                    onClick={() => onToggleOvertime()}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                      state.overtimeEnabled
                        ? `${uiTheme.surfaceClass} ${uiTheme.borderClass} ${uiTheme.textPrimaryClass}`
                        : `${uiTheme.surfaceClass} ${uiTheme.borderClass} ${uiTheme.textMutedClass}`
                    }`}
                    title="Count up overtime once expired"
                  >
                    <span>Overtime Count: {state.overtimeEnabled ? 'ON' : 'OFF'}</span>
                  </button>
                </div>

                {/* Test Chimes Group */}
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

          {/* AV Booth Urgent Stage Message Alert Center */}
          <div className={`rounded-2xl p-5 border shadow-lg space-y-4 ${uiTheme.cardClass} ${uiTheme.borderClass}`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`text-sm font-bold ${uiTheme.textPrimaryClass}`}>Stage & Pulpit Prompt Center</h3>
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

            {/* Quick 1-click prompts */}
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

            {/* Custom message input form */}
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

          {/* Keyboard Shortcuts Helper Accordion */}
          <div className={`p-4 rounded-xl border ${uiTheme.surfaceClass} ${uiTheme.borderClass}`}>
            <button
              type="button"
              onClick={() => setShowKeyboardHelp(!showKeyboardHelp)}
              className={`w-full flex items-center justify-between text-xs font-semibold ${uiTheme.textSecondaryClass} hover:${uiTheme.textPrimaryClass}`}
            >
              <span className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-emerald-400" />
                AV Booth Keyboard Shortcuts
              </span>
              <span className="text-[11px] text-emerald-400">{showKeyboardHelp ? 'Hide' : 'Show (Space, R, Q, +, -)'}</span>
            </button>
            {showKeyboardHelp && (
              <div className="mt-3 pt-3 border-t border-slate-800/40 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                <div className="flex items-center gap-1.5"><kbd className="px-1.5 py-0.5 rounded bg-black/30 font-mono font-bold">Space</kbd> Play / Pause</div>
                <div className="flex items-center gap-1.5"><kbd className="px-1.5 py-0.5 rounded bg-black/30 font-mono font-bold">R</kbd> Reset Timer</div>
                <div className="flex items-center gap-1.5"><kbd className="px-1.5 py-0.5 rounded bg-black/30 font-mono font-bold">Q</kbd> Quick Setup</div>
                <div className="flex items-center gap-1.5"><kbd className="px-1.5 py-0.5 rounded bg-black/30 font-mono font-bold">S</kbd> Online URLs</div>
                <div className="flex items-center gap-1.5"><kbd className="px-1.5 py-0.5 rounded bg-black/30 font-mono font-bold">T</kbd> Themes</div>
                <div className="flex items-center gap-1.5"><kbd className="px-1.5 py-0.5 rounded bg-black/30 font-mono font-bold">B</kbd> Blackout</div>
                <div className="flex items-center gap-1.5"><kbd className="px-1.5 py-0.5 rounded bg-black/30 font-mono font-bold">+</kbd> Add 1 Min</div>
                <div className="flex items-center gap-1.5"><kbd className="px-1.5 py-0.5 rounded bg-black/30 font-mono font-bold">-</kbd> Sub 1 Min</div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Church Service Order-of-Service & Custom Countdown (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Order of Service / Presets Card */}
          <div className={`rounded-2xl p-5 border shadow-lg space-y-4 ${uiTheme.cardClass} ${uiTheme.borderClass}`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`text-sm font-bold ${uiTheme.textPrimaryClass}`}>Church Service Schedule & Presets</h3>
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
                {onOpenQuickSetup && (
                  <button
                    type="button"
                    onClick={onOpenQuickSetup}
                    className="px-2.5 py-1 text-xs bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg flex items-center gap-1 font-semibold transition-colors"
                  >
                    <Zap className="w-3.5 h-3.5 fill-amber-400" />
                    <span className="hidden sm:inline">Quick Setup</span>
                  </button>
                )}
              </div>
            </div>

            {/* Template & Custom Presets Tabs */}
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

            {/* Notification Banner when preset is saved or deleted */}
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

            {/* List of items */}
            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
              {activeTab === 'custom' ? (
                /* Custom Saved Presets list */
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

                    // Inline editing state for custom preset
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
                              className="px-2.5 py-1 text-xs rounded bg-slate-950 border border-slate-700 text-white font-semibold"
                            />
                            <input
                              type="text"
                              value={editPresetSpeaker}
                              onChange={(e) => setEditPresetSpeaker(e.target.value)}
                              placeholder="Speaker (Optional)"
                              className="px-2.5 py-1 text-xs rounded bg-slate-950 border border-slate-700 text-white"
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
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
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
                /* Built-in and custom service template items */
                activeTemplate.items.map((item, idx) => {
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
              ) : null}
            </div>

            {/* Quick helper footer to add/customize segments */}
            {activeTemplate && (
              <div className={`pt-2.5 flex items-center justify-between border-t ${uiTheme.borderClass}`}>
                <span className={`text-[11px] ${uiTheme.textMutedClass}`}>
                  {activeTemplate.items.length} segments ·{' '}
                  {activeTemplate.items.reduce((acc, it) => acc + (it.durationMinutes || 0), 0)} min total
                </span>
                <button
                  type="button"
                  onClick={() => setIsScheduleEditorOpen(true)}
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Customize / Add Segments</span>
                </button>
              </div>
            )}
          </div>

          {/* Custom Duration & Title Setup Card */}
          <div className={`rounded-2xl p-5 border shadow-lg space-y-4 ${uiTheme.cardClass} ${uiTheme.borderClass}`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`text-sm font-bold ${uiTheme.textPrimaryClass}`}>Custom Countdown Builder</h3>
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

          {/* Church Stage Color Rules Explainer */}
          <div className={`p-4 rounded-2xl border space-y-2 text-xs ${uiTheme.surfaceClass} ${uiTheme.borderClass} ${uiTheme.textMutedClass}`}>
            <div className="flex items-center justify-between">
              <span className={`font-bold uppercase tracking-wider block ${uiTheme.textPrimaryClass}`}>
                Active Stage Color Thresholds:
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
            <ul className="space-y-1.5 pl-1">
              <li className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: stageTheme.countdownColor }} />
                <span>
                  <strong style={{ color: stageTheme.countdownColor }}>Normal:</strong> Digits green during countdown (&gt; {stageTheme.warning1Seconds}s)
                </span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: stageTheme.warning1Color }} />
                <span>
                  <strong style={{ color: stageTheme.warning1Color }}>1 Min Warning:</strong> Shifts to amber at {stageTheme.warning1Seconds} seconds
                </span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: stageTheme.warning2Color }} />
                <span>
                  <strong style={{ color: stageTheme.warning2Color }}>30 Sec Warning:</strong> Shifts to red at {stageTheme.warning2Seconds} seconds
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
        </div>
      </div>

      {/* Church Service Schedule & Presets Editor Modal */}
      <ScheduleEditorModal
        isOpen={isScheduleEditorOpen}
        onClose={() => setIsScheduleEditorOpen(false)}
        onSchedulesUpdated={(updated) => setSchedules(updated)}
        onLoadPreset={onLoadPreset}
        activePresetTitle={state.title}
      />
    </div>
  );
};
