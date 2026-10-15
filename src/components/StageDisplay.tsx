import React, { useState, useEffect } from 'react';
import { TimerState, getTimerColorStatus } from '../types/timer';
import { formatTimeDisplay } from '../hooks/useTimerSync';
import { Maximize2, Minimize2, EyeOff, Radio, Clock, ShieldAlert } from 'lucide-react';

interface StageDisplayProps {
  state: TimerState;
  connected: boolean;
  onAdjustTime?: (delta: number) => void;
  isStandalone?: boolean;
}

export const StageDisplay: React.FC<StageDisplayProps> = ({
  state,
  connected,
  isStandalone = false,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTimeStr, setCurrentTimeStr] = useState('');
  const [controlsVisible, setControlsVisible] = useState(false);

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

  const colorStatus = getTimerColorStatus(state.remainingSeconds);
  const { formatted, isNegative } = formatTimeDisplay(state.remainingSeconds);
  const isTimeUp = state.remainingSeconds <= 0;

  // Determine color classes strictly following user requirements:
  // - Countdown: GREEN
  // - 1 min to end (<= 60s): AMBER
  // - 30 sec to end (<= 30s): RED
  // - When time is over: DISPLAY Time-up in RED
  let colorClass = 'text-emerald-400';
  let glowClass = 'drop-shadow-[0_0_35px_rgba(52,211,153,0.35)]';
  let statusLabel = 'COUNTING DOWN';

  if (colorStatus === 'amber') {
    colorClass = 'text-amber-400';
    glowClass = 'drop-shadow-[0_0_35px_rgba(251,191,36,0.4)]';
    statusLabel = '1 MINUTE WARNING';
  } else if (colorStatus === 'red') {
    colorClass = 'text-red-500';
    glowClass = 'drop-shadow-[0_0_40px_rgba(239,68,68,0.5)]';
    statusLabel = '30 SECONDS LEFT';
  } else if (colorStatus === 'time-up') {
    colorClass = 'text-red-500';
    glowClass = 'drop-shadow-[0_0_50px_rgba(239,68,68,0.7)] animate-pulse';
    statusLabel = "TIME'S UP";
  }

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
      className="relative w-full h-full min-h-screen bg-neutral-950 text-white flex flex-col justify-between p-6 md:p-10 select-none overflow-hidden font-sans"
      onMouseMove={() => {
        setControlsVisible(true);
      }}
      onMouseLeave={() => setControlsVisible(false)}
    >
      {/* Background subtle stage glow */}
      <div
        className={`absolute inset-0 pointer-events-none opacity-20 transition-colors duration-1000 ${
          colorStatus === 'green'
            ? 'bg-radial-[circle_at_center,_var(--tw-gradient-stops)] from-emerald-900/40 via-transparent to-transparent'
            : colorStatus === 'amber'
            ? 'bg-radial-[circle_at_center,_var(--tw-gradient-stops)] from-amber-900/40 via-transparent to-transparent'
            : 'bg-radial-[circle_at_center,_var(--tw-gradient-stops)] from-red-950/60 via-transparent to-transparent'
        }`}
      />

      {/* Top Bar: Current Program & Wall Clock */}
      <header className="relative z-10 flex items-center justify-between border-b border-neutral-800/80 pb-4">
        {/* Left: Current Church Service Item */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider font-semibold text-neutral-400">
              Current Session
            </span>
            <span className="text-neutral-600">·</span>
            <span
              className={`text-xs font-semibold uppercase tracking-wider ${
                colorStatus === 'green'
                  ? 'text-emerald-400'
                  : colorStatus === 'amber'
                  ? 'text-amber-400'
                  : 'text-red-400'
              }`}
            >
              {statusLabel}
            </span>
          </div>
          <h1 className="text-xl md:text-3xl font-bold text-neutral-100 tracking-tight mt-0.5 truncate max-w-xl">
            {state.title || 'Church Service'}
          </h1>
          {state.speaker && (
            <p className="text-sm md:text-base text-neutral-400 mt-0.5">
              Speaker: <span className="text-neutral-200 font-medium">{state.speaker}</span>
            </p>
          )}
        </div>

        {/* Right: Wall Clock & Online Status */}
        <div className="flex items-center gap-6 text-right">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-xs uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Sanctuary Time
            </span>
            <span className="font-mono text-xl md:text-2xl font-bold text-neutral-200 tabular-nums">
              {currentTimeStr}
            </span>
          </div>

          {/* Sync indicator */}
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-neutral-900 border border-neutral-800 text-xs font-medium text-neutral-300"
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
              className={`font-mono text-[clamp(4.5rem,14vw,14rem)] font-extrabold tracking-tight leading-none ${colorClass} ${glowClass}`}
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              Time-up
            </div>

            {/* If overtime is enabled, display the overtime count below */}
            {state.overtimeEnabled && (
              <div className="mt-4 md:mt-8 flex items-center justify-center gap-3">
                <span className="text-sm md:text-xl uppercase tracking-widest text-red-400/80 font-semibold">
                  Overtime Elapsed:
                </span>
                <span
                  className="font-mono text-2xl md:text-5xl font-bold text-red-400 tabular-nums"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {formatted}
                </span>
              </div>
            )}
          </div>
        ) : (
          /* Active Countdown: GREEN (>60s), AMBER (<=60s), RED (<=30s) */
          <div className="text-center flex flex-col items-center">
            <div
              className={`font-mono text-[clamp(5.5rem,19vw,18rem)] font-extrabold tracking-tighter leading-none tabular-nums transition-colors duration-500 select-all ${colorClass} ${glowClass}`}
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
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
          {isStandalone && (
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="text-neutral-400 hover:text-white transition-colors underline underline-offset-4 mr-2"
            >
              Open Director Console
            </a>
          )}
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
