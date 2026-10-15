import React, { useState } from 'react';
import {
  TimerState,
  ChurchPreset,
  getTimerColorStatus,
  getActiveTimerColor,
  DEFAULT_THEME_CONFIG,
} from '../types/timer';
import { CHURCH_SERVICE_TEMPLATES } from '../data/churchTemplates';
import { BACKGROUND_STYLES } from '../data/themes';
import { formatTimeDisplay } from '../hooks/useTimerSync';
import { playChime } from '../utils/audio';
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
} from 'lucide-react';

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
}

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
}) => {
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
    setSaveSuccessMessage(`Current timer "${trimmedTitle}" saved as preset!`);
    setTimeout(() => setSaveSuccessMessage(null), 3000);
  };

  const handleDeleteCustomPreset = (id: string, title: string) => {
    const updated = customPresets.filter((p) => p.id !== id);
    persistCustomPresets(updated);
    setSaveSuccessMessage(`Removed "${title}"`);
    setTimeout(() => setSaveSuccessMessage(null), 2500);
  };

  const activeTemplate = typeof activeTab === 'number' ? (CHURCH_SERVICE_TEMPLATES[activeTab] || CHURCH_SERVICE_TEMPLATES[0]) : null;
  const theme = state.themeConfig || DEFAULT_THEME_CONFIG;
  const colorStatus = getTimerColorStatus(
    state.remainingSeconds,
    theme.warning1Seconds ?? 60,
    theme.warning2Seconds ?? 30
  );
  const activeColor = getActiveTimerColor(colorStatus, theme);
  const { formatted, isNegative } = formatTimeDisplay(state.remainingSeconds);
  const isTimeUp = state.remainingSeconds <= 0;

  let statusText = `COUNTING DOWN (${theme.themeName || 'ACTIVE'})`;
  if (colorStatus === 'amber') {
    statusText = `${theme.warning1Seconds ?? 60}S WARNING`;
  } else if (colorStatus === 'red') {
    statusText = `${theme.warning2Seconds ?? 30}S LEFT`;
  } else if (colorStatus === 'time-up') {
    statusText = theme.timeUpText || "TIME'S UP";
  }

  const fontFamilyStyle =
    theme.fontFamily === 'digital'
      ? "'Courier New', monospace"
      : theme.fontFamily === 'sans'
      ? "'Plus Jakarta Sans', sans-serif"
      : "'JetBrains Mono', monospace";

  const handleCustomApply = (e: React.FormEvent) => {
    e.preventDefault();
    const totalSec = customMinutes * 60 + customSeconds;
    if (totalSec > 0) {
      onSetDuration(totalSec, customTitle, customSpeaker);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (messageInput.trim()) {
      onSendStageMessage(messageInput.trim(), flashAlert);
      setMessageInput('');
    }
  };

  const handleOpenSecondScreen = () => {
    const width = 1280;
    const height = 720;
    const left = window.screen.width ? window.screen.width : 200;
    const stageUrl = `${window.location.origin}/?view=stage&room=${state.roomId}`;
    window.open(
      stageUrl,
      `SanctuaryStage_${state.roomId}`,
      `width=${width},height=${height},left=${left},top=0,menubar=no,toolbar=no,location=no,status=no`
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner Notice: Online Sync & Second Screen status */}
      <section className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
          <div>
            <div className="text-sm font-semibold text-white flex items-center gap-2">
              <span>Sanctuary Room: &ldquo;{state.roomId.toUpperCase()}&rdquo;</span>
              <span className="text-slate-500 text-xs font-normal">·</span>
              <span className="text-xs text-slate-400 font-normal">
                {connected ? 'Live Online Sync Active' : 'Connecting to Cloud Room...'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Active Theme: <span className="text-emerald-400 font-medium">{theme.themeName || 'Classic Sanctuary'}</span> · Warning at {theme.warning1Seconds}s & {theme.warning2Seconds}s.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={onOpenThemeModal}
            className="flex-1 sm:flex-none px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700/80 flex items-center justify-center gap-1.5 transition-colors"
            title="Customize theme, stage colors, and thresholds"
          >
            <Palette className="w-4 h-4 text-emerald-400" />
            <span>Theme & Colors</span>
          </button>
          <button
            onClick={onOpenShareModal}
            className="flex-1 sm:flex-none px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700/80 flex items-center justify-center gap-1.5 transition-colors"
          >
            <Share2 className="w-4 h-4 text-emerald-400" />
            <span>Online URLs & QR</span>
          </button>
          <button
            onClick={handleOpenSecondScreen}
            className="flex-1 sm:flex-none px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-2 shadow-md transition-all"
          >
            <Monitor className="w-4 h-4" />
            <span>Extend Second Screen</span>
          </button>
        </div>
      </section>

      {/* Primary Layout: Left = Live Stage Monitor & Big Controls, Right = Service Schedule & Custom Builder */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Stage Monitor & Primary Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Main Stage Confidence Monitor Preview */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            {/* Monitor Header */}
            <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Live Stage Confidence Monitor
                </span>
                <span className="text-slate-600">·</span>
                <span className="text-xs font-medium text-slate-400">{statusText}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={onOpenThemeModal}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors mr-2"
                  title="Change Theme & Stage Colors"
                >
                  <Palette className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">{theme.themeName || 'Theme'}</span>
                </button>
                <button
                  onClick={handleOpenSecondScreen}
                  className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
                  title="Open dedicated popup window for 2nd monitor"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Pop out</span>
                </button>
              </div>
            </div>

            {/* Simulated Stage Screen Surface */}
            <div
              className={`p-6 sm:p-10 text-center flex flex-col items-center justify-center min-h-[290px] sm:min-h-[340px] relative transition-colors duration-500 ${
                BACKGROUND_STYLES[theme.backgroundStyle] || 'bg-black text-white'
              }`}
            >
              {state.isBlackout ? (
                <div className="space-y-2 opacity-50">
                  <EyeOff className="w-10 h-10 text-slate-500 mx-auto" />
                  <p className="text-slate-400 text-xs font-semibold tracking-widest uppercase">
                    SCREEN BLACKED OUT (PRAYER / MEDIA)
                  </p>
                </div>
              ) : (
                <>
                  {/* Segment Title & Speaker Preview */}
                  <div className="mb-2">
                    <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
                      {state.title || 'Church Service'}
                    </span>
                    {state.speaker && (
                      <span className="text-xs text-slate-400 ml-2">
                        · {state.speaker}
                      </span>
                    )}
                  </div>

                  {/* Main Digits */}
                  {isTimeUp ? (
                    <div className="space-y-2 animate-bounce-subtle">
                      <div
                        className="text-6xl sm:text-8xl font-black tracking-tight leading-none transition-colors duration-300"
                        style={{
                          color: activeColor,
                          fontFamily: fontFamilyStyle,
                          filter: `drop-shadow(0 0 30px ${activeColor}70)`,
                        }}
                      >
                        {theme.timeUpText || 'Time-up'}
                      </div>
                      {state.overtimeEnabled && (
                        <div
                          className="text-sm sm:text-lg font-mono font-bold"
                          style={{ color: `${activeColor}dd` }}
                        >
                          Overtime: {formatted}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div
                      className="text-7xl sm:text-9xl font-extrabold tracking-tighter leading-none tabular-nums transition-colors duration-300"
                      style={{
                        color: activeColor,
                        fontFamily: fontFamilyStyle,
                        filter: `drop-shadow(0 0 25px ${activeColor}40)`,
                      }}
                    >
                      {formatted}
                    </div>
                  )}

                  {/* Stage message ticker if active */}
                  {state.stageMessage && state.stageMessage.active && (
                    <div className="mt-4 px-4 py-2 bg-amber-500/20 border border-amber-500/60 rounded-lg text-amber-200 text-xs sm:text-sm font-semibold max-w-md animate-pulse">
                      Alert to Stage: {state.stageMessage.text}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Quick Action Bar Under Monitor */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 space-y-4">
              {/* Primary Transport Controls */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {!state.isRunning ? (
                    <button
                      onClick={onStart}
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm rounded-lg flex items-center gap-2 transition-all shadow-md active:scale-95"
                    >
                      <Play className="w-4 h-4 fill-white" />
                      <span>Start Timer</span>
                    </button>
                  ) : (
                    <button
                      onClick={onPause}
                      className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold text-sm rounded-lg flex items-center gap-2 transition-all shadow-md active:scale-95"
                    >
                      <Pause className="w-4 h-4 fill-white" />
                      <span>Pause Timer</span>
                    </button>
                  )}

                  <button
                    onClick={onReset}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-sm rounded-lg flex items-center gap-1.5 transition-colors border border-slate-700/60"
                    title="Reset to segment duration"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Reset</span>
                  </button>

                  <button
                    onClick={handleSaveCurrentTimerAsPreset}
                    className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-sm rounded-lg flex items-center gap-1.5 transition-colors border border-slate-700/60"
                    title="Save currently loaded timer length and title as a custom preset"
                  >
                    <BookmarkPlus className="w-4 h-4 text-emerald-400" />
                    <span className="hidden sm:inline">Save as Preset</span>
                  </button>
                </div>

                {/* Quick Time Adjusters (+1m, +5m, -1m, +30s) */}
                <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-lg border border-slate-800">
                  <span className="text-[11px] font-medium text-slate-400 px-2">Quick Adjust:</span>
                  <button
                    onClick={() => onAdjustTime(60)}
                    className="px-2.5 py-1 text-xs font-semibold text-emerald-400 bg-slate-800 hover:bg-slate-700 rounded transition-colors"
                    title="Add 1 minute to current time"
                  >
                    +1m
                  </button>
                  <button
                    onClick={() => onAdjustTime(300)}
                    className="px-2.5 py-1 text-xs font-semibold text-emerald-400 bg-slate-800 hover:bg-slate-700 rounded transition-colors"
                    title="Add 5 minutes to current time"
                  >
                    +5m
                  </button>
                  <button
                    onClick={() => onAdjustTime(30)}
                    className="px-2.5 py-1 text-xs font-semibold text-emerald-400 bg-slate-800 hover:bg-slate-700 rounded transition-colors"
                    title="Add 30 seconds"
                  >
                    +30s
                  </button>
                  <button
                    onClick={() => onAdjustTime(-60)}
                    className="px-2.5 py-1 text-xs font-semibold text-red-400 bg-slate-800 hover:bg-slate-700 rounded transition-colors"
                    title="Subtract 1 minute"
                  >
                    -1m
                  </button>
                </div>
              </div>

              {/* Utility Toggles: Blackout, Sound, Overtime */}
              <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300">
                <div className="flex items-center gap-4">
                  {/* Blackout button */}
                  <button
                    onClick={() => onToggleBlackout()}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors ${
                      state.isBlackout
                        ? 'bg-amber-600/20 border-amber-500 text-amber-300'
                        : 'bg-slate-800/80 border-slate-700 hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    {state.isBlackout ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    <span>{state.isBlackout ? 'Unblank Screen' : 'Blackout Screen'}</span>
                  </button>

                  {/* Sound Alerts toggle */}
                  <button
                    onClick={() => onToggleSound()}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors ${
                      state.soundAlertsEnabled
                        ? 'bg-slate-800/80 border-slate-700 text-emerald-400'
                        : 'bg-slate-800/40 border-slate-800 text-slate-500'
                    }`}
                    title="Play chime at 1 min (amber), 30 sec (red), and time-up"
                  >
                    {state.soundAlertsEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                    <span>{state.soundAlertsEnabled ? 'Chimes Active' : 'Chimes Muted'}</span>
                  </button>

                  {/* Overtime Toggle */}
                  <button
                    onClick={() => onToggleOvertime()}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors ${
                      state.overtimeEnabled
                        ? 'bg-slate-800/80 border-slate-700 text-slate-300'
                        : 'bg-slate-800/40 border-slate-800 text-slate-500'
                    }`}
                  >
                    <span>Overtime Count: {state.overtimeEnabled ? 'ON' : 'OFF'}</span>
                  </button>
                </div>

                {/* Test Chime button */}
                <button
                  onClick={() => playChime('amber')}
                  className="text-slate-400 hover:text-slate-200 underline underline-offset-2 transition-colors"
                >
                  Test Chime Tone
                </button>
              </div>
            </div>
          </div>

          {/* AV Booth Urgent Stage Message Alert Center */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">Stage & Pulpit Prompt Center</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Send silent discrete prompts or notices directly to the stage confidence monitor.
                </p>
              </div>
              {state.stageMessage && (
                <button
                  onClick={onClearStageMessage}
                  className="px-2.5 py-1 text-xs bg-red-950/40 text-red-400 hover:bg-red-900/60 border border-red-800/60 rounded-md flex items-center gap-1 transition-colors"
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
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 rounded-lg border border-slate-700/60 transition-colors"
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Custom message input form */}
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                placeholder="Type custom message for speaker..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              />
              <label className="flex items-center gap-1.5 text-xs text-slate-400 px-2 cursor-pointer">
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
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700/80"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Church Service Order-of-Service & Custom Countdown (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Order of Service / Presets Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">Church Service Schedule & Presets</h3>
                <p className="text-xs text-slate-400 mt-0.5">1-click queue segments or load custom saved lengths.</p>
              </div>
            </div>

            {/* Template & Custom Presets Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 p-1 bg-slate-950 rounded-lg border border-slate-800">
              {CHURCH_SERVICE_TEMPLATES.map((tmpl, idx) => (
                <button
                  key={tmpl.id}
                  onClick={() => setActiveTab(idx)}
                  className={`px-2.5 py-1.5 text-xs font-medium rounded-md text-center transition-colors truncate ${
                    activeTab === idx
                      ? 'bg-slate-800 text-white shadow-sm border border-slate-700/60'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tmpl.name}
                </button>
              ))}
              <button
                onClick={() => setActiveTab('custom')}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-md text-center transition-colors truncate flex items-center justify-center gap-1.5 ${
                  activeTab === 'custom'
                    ? 'bg-emerald-950/80 text-emerald-300 shadow-sm border border-emerald-700/80'
                    : 'text-emerald-400 hover:text-emerald-300'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5 shrink-0" />
                <span>My Saved Presets ({customPresets.length})</span>
              </button>
            </div>

            {/* Notification Banner when preset is saved or deleted */}
            {saveSuccessMessage && (
              <div className="px-3.5 py-2 bg-emerald-950/50 border border-emerald-800/80 rounded-lg text-emerald-300 text-xs flex items-center justify-between transition-all">
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
                  <div className="p-6 text-center border border-dashed border-slate-800 rounded-xl space-y-2">
                    <BookmarkPlus className="w-8 h-8 text-slate-600 mx-auto" />
                    <p className="text-xs font-medium text-slate-300">No custom presets saved yet</p>
                    <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                      Use the &ldquo;Custom Countdown Configuration&rdquo; form below to save custom durations (e.g., Guest Preacher 20m, Baby Dedication 12m) for fast 1-click loading.
                    </p>
                  </div>
                ) : (
                  customPresets.map((item, idx) => {
                    const totalSec = (item.durationMinutes || 0) * 60 + (item.durationSeconds || 0);
                    const isCurrent = state.totalDurationSeconds === totalSec && state.title === item.title;
                    const durationLabel = item.durationSeconds && item.durationSeconds > 0
                      ? `${item.durationMinutes}m ${item.durationSeconds}s`
                      : `${item.durationMinutes} min`;

                    return (
                      <div
                        key={item.id}
                        className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                          isCurrent
                            ? 'bg-emerald-950/30 border-emerald-800/80 text-white'
                            : 'bg-slate-950 border-slate-800/80 hover:border-slate-700 text-slate-300'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-emerald-400/80 font-mono">#{idx + 1}</span>
                            <h4 className="text-xs font-semibold truncate text-slate-200">{item.title}</h4>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                            <span className="text-emerald-400 font-medium">{durationLabel}</span>
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
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                              isCurrent
                                ? 'bg-emerald-600 text-white font-semibold'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60'
                            }`}
                          >
                            {isCurrent ? 'Active on Stage' : 'Load Preset'}
                          </button>
                          <button
                            onClick={() => handleDeleteCustomPreset(item.id, item.title)}
                            className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
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
                /* Built-in template items */
                activeTemplate.items.map((item, idx) => {
                  const isCurrent = state.title === item.title;
                  return (
                    <div
                      key={item.id}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                        isCurrent
                          ? 'bg-emerald-950/30 border-emerald-800/80 text-white'
                          : 'bg-slate-950 border-slate-800/80 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500 font-mono">0{idx + 1}.</span>
                          <h4 className="text-xs font-semibold truncate text-slate-200">{item.title}</h4>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                          <span>{item.durationMinutes} min</span>
                          {item.speaker && (
                            <>
                              <span>·</span>
                              <span className="truncate">{item.speaker}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => onLoadPreset(item)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors shrink-0 ${
                          isCurrent
                            ? 'bg-emerald-600 text-white font-semibold'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60'
                        }`}
                      >
                        {isCurrent ? 'Queued' : 'Load Segment'}
                      </button>
                    </div>
                  );
                })
              ) : null}
            </div>
          </div>

          {/* Custom Duration & Title Setup Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">Custom Countdown Configuration</h3>
                <p className="text-xs text-slate-400 mt-0.5">Set any custom duration, title, and speaker.</p>
              </div>
            </div>

            <form onSubmit={handleCustomApply} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-300">Session / Segment Name</label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  placeholder="e.g. Guest Speaker Word"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300">Speaker Name (Optional)</label>
                <input
                  type="text"
                  value={customSpeaker}
                  onChange={(e) => setCustomSpeaker(e.target.value)}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  placeholder="e.g. Bishop Thomas"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-300">Minutes</label>
                  <input
                    type="number"
                    min="0"
                    max="600"
                    value={customMinutes}
                    onChange={(e) => setCustomMinutes(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-300">Seconds</label>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={customSeconds}
                    onChange={(e) => setCustomSeconds(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <button
                  type="submit"
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-md flex items-center justify-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Apply to Stage</span>
                </button>
                <button
                  type="button"
                  onClick={handleSaveCustomPreset}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold rounded-lg transition-colors border border-slate-700/80 flex items-center justify-center gap-1.5"
                >
                  <BookmarkPlus className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Save as Preset</span>
                </button>
              </div>
            </form>
          </div>

          {/* Church Stage Color Rules Explainer */}
          <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-2 text-xs text-slate-400">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-300 uppercase tracking-wider block">
                Active Stage Color Thresholds:
              </span>
              <button
                type="button"
                onClick={onOpenThemeModal}
                className="text-emerald-400 hover:text-emerald-300 text-[11px] underline underline-offset-2 flex items-center gap-1"
              >
                <Palette className="w-3 h-3" />
                <span>Change Colors</span>
              </button>
            </div>
            <ul className="space-y-1.5 pl-1">
              <li className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: theme.countdownColor }} />
                <span>
                  <strong style={{ color: theme.countdownColor }}>Normal:</strong> Active countdown while &gt; {theme.warning1Seconds}s
                </span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: theme.warning1Color }} />
                <span>
                  <strong style={{ color: theme.warning1Color }}>Warning 1:</strong> Reaching {theme.warning1Seconds} seconds to end
                </span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: theme.warning2Color }} />
                <span>
                  <strong style={{ color: theme.warning2Color }}>Warning 2:</strong> Reaching {theme.warning2Seconds} seconds to end
                </span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: theme.timeUpColor }} />
                <span>
                  <strong style={{ color: theme.timeUpColor }}>Expired:</strong> Displays &ldquo;{theme.timeUpText || 'Time-up'}&rdquo; in bold
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
