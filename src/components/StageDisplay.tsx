import React, { useState, useEffect } from 'react';
import { TimerState, getTimerColorStatus, getActiveTimerColor, DEFAULT_THEME_CONFIG } from '../types/timer';
import { BACKGROUND_STYLES } from '../data/themes';
import { formatTimeDisplay } from '../hooks/useTimerSync';
import { Maximize2, Minimize2, EyeOff, Radio, Clock, ShieldAlert } from 'lucide-react';
import { ChurchLogo } from './ChurchLogo';

interface StageDisplayProps {
  state: TimerState;
  connected: boolean;
  onAdjustTime?: (delta: number) => void;
  isStandalone?: boolean;
  onSwitchToController?: () => void;
}

export const StageDisplay: React.FC<StageDisplayProps> = ({
  state,
  connected,
  isStandalone = false,
  onSwitchToController,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTimeStr, setCurrentTimeStr] = useState('');
  const [controlsVisible, setControlsVisible] = useState(false);

  const theme = state.themeConfig || DEFAULT_THEME_CONFIG;

  // Time-of-day wall clock for the stage
  useEffect(() => {
    const updateWallClock = () => {
      const now = new Date();
      setCurrentTimeStr(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
      );
    };
    updateWallClock();
    const timer = setInterval(updateWallClock, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fullscreen handlers
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Keyboard shortcut: F for fullscreen, ESC to exit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'f' || e.key === 'F') {
        if (!['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
          toggleFullscreen();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const colorStatus = getTimerColorStatus(
    state.remainingSeconds,
    theme.warning1Seconds ?? 60,
    theme.warning2Seconds ?? 30
  );
  const activeColor = getActiveTimerColor(colorStatus, theme);
  const { formatted, isNegative } = formatTimeDisplay(state.remainingSeconds);
  const isTimeUp = state.remainingSeconds <= 0;

  let statusLabel = 'COUNTING DOWN';
  if (colorStatus === 'amber') {
    statusLabel = `${theme.warning1Seconds ?? 60}S WARNING`;
  } else if (colorStatus === 'red') {
    statusLabel = `${theme.warning2Seconds ?? 30}S LEFT`;
  } else if (colorStatus === 'time-up') {
    statusLabel = "TIME'S UP";
  }

  const fontFamilyStyle =
    theme.fontFamily === 'digital'
      ? "'Courier New', monospace"
      : theme.fontFamily === 'sans'
      ? "'Plus Jakarta Sans', sans-serif"
      : "'JetBrains Mono', monospace";

  // If Blackout is active
  if (state.isBlackout) {
    return (
      <div
        className="w-full h-full min-h-screen bg-black flex flex-col items-center justify-center p-8 select-none"
        onMouseMove={() => setControlsVisible(true)}
      >
        <div className="text-center space-y-4 opacity-40">
          <EyeOff className="w-12 h-12 text-slate-500 mx-auto" />
          <p className="text-slate-400 text-sm font-medium tracking-widest uppercase">
            Display Blanked / In Solemn Mode
          </p>
        </div>
        {controlsVisible && (
          <button
            onClick={toggleFullscreen}
            className="fixed bottom-6 right-6 p-3 bg-neutral-900 border border-neutral-800 text-slate-400 hover:text-white rounded-lg transition-opacity"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={`relative w-full h-full min-h-screen ${
        BACKGROUND_STYLES[theme.backgroundStyle] || 'bg-black text-white'
      } flex flex-col justify-between p-6 md:p-10 select-none overflow-hidden font-sans`}
      onMouseMove={() => {
        setControlsVisible(true);
      }}
      onMouseLeave={() => setControlsVisible(false)}
    >
      {/* Dynamic radial glow centered on screen */}
      <div
        className="absolute inset-0 pointer-events-none opacity-30 transition-all duration-1000"
        style={{
          background: `radial-gradient(circle at center, ${activeColor}22 0%, transparent 70%)`,
        }}
      />

      {/* Background Watermark Church Logo if configured */}
      {state.churchLogo?.enabled && state.churchLogo?.showOnStage && state.churchLogo.position === 'watermark' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10 select-none scale-150">
          <ChurchLogo config={state.churchLogo} showText={false} className="w-96 h-96" />
        </div>
      )}

      {/* Top Bar: Current Program & Wall Clock */}
      <header className="relative z-10 flex items-center justify-between border-b border-neutral-800/80 pb-4">
        {/* Left: Church Logo (if top-left) and Current Church Service Item */}
        <div className="flex items-center gap-4">
          {state.churchLogo?.enabled && state.churchLogo?.showOnStage && state.churchLogo.position === 'top-left' && (
            <ChurchLogo config={state.churchLogo} showText={false} />
          )}
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-semibold text-neutral-400">
                Current Session
              </span>
              <span className="text-neutral-600">·</span>
              <span
                className="text-xs font-semibold uppercase tracking-wider transition-colors duration-300"
                style={{ color: activeColor }}
              >
                {statusLabel}
              </span>
            </div>
            {theme.showSpeaker !== false && (
              <>
                <h1 className="text-xl md:text-3xl font-bold text-neutral-100 tracking-tight mt-0.5 truncate max-w-xl">
                  {state.title || 'Church Service'}
                </h1>
                {state.speaker && (
                  <p className="text-sm md:text-base text-neutral-400 mt-0.5">
                    Speaker: <span className="text-neutral-200 font-medium">{state.speaker}</span>
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        {/* Center: Church Logo (if top-center) */}
        {state.churchLogo?.enabled && state.churchLogo?.showOnStage && state.churchLogo.position === 'top-center' && (
          <div className="hidden lg:flex items-center justify-center">
            <ChurchLogo config={state.churchLogo} showText={true} />
          </div>
        )}

        {/* Right: Wall Clock & Online Status */}
        <div className="flex items-center gap-6 text-right">
          {state.churchLogo?.enabled && state.churchLogo?.showOnStage && state.churchLogo.position === 'top-right' && (
            <ChurchLogo config={state.churchLogo} showText={false} />
          )}
          {theme.showClock !== false && (
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-xs uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Sanctuary Time
              </span>
              <span className="font-mono text-xl md:text-2xl font-bold text-neutral-200 tabular-nums">
                {currentTimeStr}
              </span>
            </div>
          )}

          {/* Sync indicator */}
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-neutral-900/80 border border-neutral-800 text-xs font-medium text-neutral-300"
            title={connected ? 'Live Sync Active' : 'Connecting to Server...'}
          >
            <Radio
              className={`w-3.5 h-3.5 ${
                connected ? 'text-emerald-400 animate-pulse' : 'text-neutral-500'
              }`}
            />
            <span className="hidden md:inline">{connected ? 'Live Online' : 'Connecting'}</span>
          </div>
        </div>
      </header>

      {/* Main Center Stage Area: The Massive Countdown Display */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center my-auto py-4">
        {isTimeUp ? (
          /* Exact user requirement: WHEN THE TIME IS OVER, DISPLAY Time-up in RED */
          <div className="text-center animate-bounce-subtle">
            <div
              className="text-[clamp(4.5rem,14vw,14rem)] font-extrabold tracking-tight leading-none transition-colors duration-300"
              style={{
                color: activeColor,
                fontFamily: fontFamilyStyle,
                filter: `drop-shadow(0 0 45px ${activeColor}70)`,
              }}
            >
              {theme.timeUpText || 'Time-up'}
            </div>

            {/* If overtime is enabled, display the overtime count below */}
            {state.overtimeEnabled && (
              <div className="mt-4 md:mt-8 flex items-center justify-center gap-3">
                <span
                  className="text-sm md:text-xl uppercase tracking-widest font-semibold"
                  style={{ color: `${activeColor}bb` }}
                >
                  Overtime Elapsed:
                </span>
                <span
                  className="text-2xl md:text-5xl font-bold tabular-nums"
                  style={{
                    color: activeColor,
                    fontFamily: fontFamilyStyle,
                  }}
                >
                  {formatted}
                </span>
              </div>
            )}
          </div>
        ) : (
          /* Active Countdown: GREEN, AMBER, RED transitions */
          <div className="text-center flex flex-col items-center">
            <div
              className="text-[clamp(5.5rem,19vw,18rem)] font-extrabold tracking-tighter leading-none tabular-nums transition-colors duration-500 select-all"
              style={{
                color: activeColor,
                fontFamily: fontFamilyStyle,
                filter: `drop-shadow(0 0 35px ${activeColor}40)`,
              }}
            >
              {formatted}
            </div>

            {/* Running status bar */}
            <div className="mt-4 flex items-center gap-3 text-neutral-400 text-xs md:text-sm font-medium">
              {!state.isRunning && (
                <span className="px-3 py-1 bg-neutral-800 text-neutral-300 rounded font-semibold tracking-wide">
                  PAUSED
                </span>
              )}
              <span>Target: {Math.round(state.totalDurationSeconds / 60)} min total</span>
            </div>
          </div>
        )}

        {/* Live Stage Message Alert (e.g. from AV director to the stage/pulpit) */}
        {state.stageMessage && state.stageMessage.active && (
          <div
            className={`mt-6 md:mt-10 max-w-4xl w-full mx-auto px-6 py-4 rounded-xl border flex items-center gap-4 shadow-2xl transition-all ${
              state.stageMessage.flash
                ? 'bg-amber-500/20 border-amber-400 text-amber-200 animate-pulse'
                : 'bg-neutral-900 border-neutral-700 text-neutral-100'
            }`}
          >
            <ShieldAlert className="w-8 h-8 text-amber-400 shrink-0" />
            <div className="flex-1">
              <div className="text-xs uppercase tracking-wider text-amber-400 font-bold">
                Message from Audio-Visual Booth
              </div>
              <div className="text-lg md:text-2xl font-bold text-white mt-0.5">
                {state.stageMessage.text}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer / Stage Monitor Indicators */}
      <footer className="relative z-10 flex items-center justify-between border-t border-neutral-800/80 pt-4 text-xs text-neutral-400">
        <div className="flex items-center gap-4">
          <span className="font-semibold text-neutral-300">SanctuaryTimer</span>
          <span>·</span>
          <span>Room: {state.roomId.toUpperCase()}</span>
          <span>·</span>
          <span className="hidden sm:inline">Press &apos;F&apos; or Fullscreen for second-screen monitor</span>
        </div>

        <div className="flex items-center gap-3">
          {onSwitchToController ? (
            <button
              onClick={onSwitchToController}
              className="text-neutral-400 hover:text-white transition-colors underline underline-offset-4 mr-2"
            >
              Open Director Console
            </button>
          ) : isStandalone ? (
            <a
              href={`/?room=${encodeURIComponent(state.roomId)}`}
              className="text-neutral-400 hover:text-white transition-colors underline underline-offset-4 mr-2"
            >
              Open Director Console
            </a>
          ) : null}
          <button
            onClick={toggleFullscreen}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/80 rounded-md text-neutral-200 transition-colors"
            title="Toggle Stage Fullscreen (F)"
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-3.5 h-3.5" />
                <span>Exit Fullscreen</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Extend Fullscreen</span>
              </>
            )}
          </button>
        </div>
      </footer>
    </div>
  );
};
