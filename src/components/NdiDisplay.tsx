import React, { useState, useEffect } from 'react';
import { TimerState, getTimerColorStatus, getActiveTimerColor } from '../types/timer';
import { ChurchLogo } from './ChurchLogo';

interface NdiDisplayProps {
  state: TimerState;
  onSwitchToController?: () => void;
}

export const NdiDisplay: React.FC<NdiDisplayProps> = ({ state, onSwitchToController }) => {
  const [now, setNow] = useState(Date.now());
  const [searchParams, setSearchParams] = useState<URLSearchParams>(new URLSearchParams());

  useEffect(() => {
    setSearchParams(new URLSearchParams(window.location.search));
    const interval = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(interval);
  }, []);

  // Compute live seconds
  let currentRemaining = state.remainingSeconds;
  if (state.isRunning && state.endsAt) {
    currentRemaining = Math.round((state.endsAt - now) / 1000);
    if (!state.overtimeEnabled && currentRemaining < 0) {
      currentRemaining = 0;
    }
  }

  // Format time display
  const isNegative = currentRemaining < 0;
  const absSeconds = Math.abs(currentRemaining);
  const hours = Math.floor(absSeconds / 3600);
  const minutes = Math.floor((absSeconds % 3600) / 60);
  const seconds = absSeconds % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');
  const formattedTime =
    hours > 0
      ? `${isNegative ? '-' : ''}${hours}:${pad(minutes)}:${pad(seconds)}`
      : `${isNegative ? '-' : ''}${pad(minutes)}:${pad(seconds)}`;

  // Color status & timer colors
  const colorStatus = getTimerColorStatus(
    currentRemaining,
    state.themeConfig.warning1Seconds,
    state.themeConfig.warning2Seconds
  );
  const activeColor = getActiveTimerColor(colorStatus, state.themeConfig);

  // Read config from state or url overrides
  const urlLayout = searchParams.get('layout');
  const layout = urlLayout || state.ndiConfig?.layout || 'lower-third';
  const urlBg = searchParams.get('bg');
  const bgType = urlBg || state.ndiConfig?.background || 'transparent';

  // Progress percentage
  const total = Math.max(1, state.totalDurationSeconds);
  const progressPercent = Math.min(100, Math.max(0, ((total - currentRemaining) / total) * 100));

  // Background style
  let bgClass = 'bg-transparent';
  if (bgType === 'chroma-green') bgClass = 'bg-[#00FF00]';
  else if (bgType === 'chroma-blue') bgClass = 'bg-[#0000FF]';
  else if (bgType === 'chroma-magenta') bgClass = 'bg-[#FF00FF]';
  else if (bgType === 'black') bgClass = 'bg-black';

  // Font family
  const fontClass =
    state.themeConfig.fontFamily === 'mono'
      ? 'font-mono'
      : state.themeConfig.fontFamily === 'digital'
      ? 'font-mono tracking-widest'
      : 'font-sans';

  return (
    <div
      className={`relative w-screen h-screen overflow-hidden select-none ${bgClass} text-white flex flex-col justify-end p-8`}
      style={{
        backgroundColor: bgType === 'transparent' ? 'transparent' : undefined,
      }}
    >
      {/* Blackout overlay if active */}
      {state.isBlackout && (
        <div className="absolute inset-0 bg-black z-50 flex items-center justify-center">
          <span className="text-slate-600 text-sm font-mono tracking-widest uppercase">
            [Blackout Active]
          </span>
        </div>
      )}

      {/* Floating Director Console switch button on hover */}
      {onSwitchToController && (
        <div className="absolute top-3 right-3 opacity-0 hover:opacity-100 transition-opacity z-50">
          <button
            onClick={onSwitchToController}
            className="px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-700 text-slate-300 text-xs backdrop-blur-md shadow-lg"
          >
            ← Return to Console
          </button>
        </div>
      )}

      {/* STAGE ALERT BANNER OVERLAY */}
      {state.stageMessage?.active && (
        <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-40 w-full max-w-4xl px-4 animate-in slide-in-from-top-6 duration-300">
          <div
            className={`p-4 rounded-2xl bg-amber-500 text-slate-950 font-black text-center shadow-2xl border-2 border-white/50 tracking-wide ${
              state.stageMessage.flash ? 'animate-pulse' : ''
            }`}
          >
            <div className="text-xs uppercase tracking-widest text-slate-900/80 mb-0.5">
              Live Stage Message
            </div>
            <div className="text-2xl sm:text-3xl uppercase font-black">
              {state.stageMessage.text}
            </div>
          </div>
        </div>
      )}

      {/* LAYOUT 1: LOWER-THIRD BROADCAST OVERLAY */}
      {layout === 'lower-third' && (
        <div className="w-full max-w-5xl mx-auto mb-4 animate-in slide-in-from-bottom-6 duration-300">
          <div className="relative rounded-2xl bg-slate-950/85 backdrop-blur-xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden">
            {/* Top progress bar */}
            {state.ndiConfig?.showProgressBar && (
              <div className="h-1.5 w-full bg-slate-800/80">
                <div
                  className="h-full transition-all duration-300 ease-out"
                  style={{
                    width: `${progressPercent}%`,
                    backgroundColor: activeColor,
                  }}
                />
              </div>
            )}

            <div className="px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
              {/* Church Logo & Info */}
              <div className="flex items-center gap-4 min-w-0">
                {state.churchLogo?.enabled && state.churchLogo?.showOnNdi && (
                  <ChurchLogo config={state.churchLogo} showText={false} />
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase tracking-widest font-bold text-amber-400">
                      {state.churchLogo?.churchName || 'Sunday Service'}
                    </span>
                    {state.isRunning && (
                      <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 font-bold uppercase tracking-wider animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400" /> Live
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-white tracking-tight truncate">
                    {state.title || 'Church Service'}
                  </h3>
                  {state.speaker && (
                    <div className="text-xs text-slate-300 font-medium truncate">
                      Speaker: <span className="text-slate-100 font-semibold">{state.speaker}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Countdown Digits */}
              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right">
                  <div className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
                    {colorStatus === 'time-up' ? 'Time Exceeded' : 'Remaining'}
                  </div>
                  <div
                    className={`text-4xl md:text-5xl font-black ${fontClass} tabular-nums tracking-tight drop-shadow-md`}
                    style={{ color: activeColor }}
                  >
                    {formattedTime}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LAYOUT 2: CORNER BUG (Top-Right or Bottom-Right) */}
      {layout === 'corner-bug' && (
        <div className="absolute bottom-6 right-6 z-30 animate-in fade-in duration-300">
          <div className="rounded-2xl bg-slate-950/90 backdrop-blur-xl border border-white/15 p-4 shadow-2xl flex items-center gap-3.5">
            {state.churchLogo?.enabled && state.churchLogo?.showOnNdi && (
              <ChurchLogo config={state.churchLogo} showText={false} />
            )}
            <div>
              <div className="flex items-center justify-between gap-3 text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                <span className="truncate max-w-[120px]">{state.title || 'Service'}</span>
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: activeColor }}
                />
              </div>
              <div
                className={`text-3xl font-black ${fontClass} tabular-nums tracking-tight`}
                style={{ color: activeColor }}
              >
                {formattedTime}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LAYOUT 3: FULLSCREEN CONFIDENCE HUD */}
      {layout === 'fullscreen-hud' && (
        <div className="w-full h-full flex flex-col justify-between p-12">
          {/* Header */}
          <div className="flex items-center justify-between">
            {state.churchLogo?.enabled && state.churchLogo?.showOnNdi && (
              <ChurchLogo config={state.churchLogo} showText={true} />
            )}
            <div className="text-right">
              <div className="text-sm uppercase tracking-widest font-bold text-slate-400">
                {state.title}
              </div>
              {state.speaker && (
                <div className="text-lg font-semibold text-slate-200">{state.speaker}</div>
              )}
            </div>
          </div>

          {/* Huge Digits in Center */}
          <div className="flex flex-col items-center justify-center my-auto">
            <div
              className={`text-8xl md:text-[14rem] font-black ${fontClass} tabular-nums tracking-tighter drop-shadow-[0_10px_30px_rgba(0,0,0,0.8)]`}
              style={{ color: activeColor }}
            >
              {formattedTime}
            </div>
          </div>

          {/* Footer Bar */}
          <div className="w-full">
            <div className="h-2 rounded-full bg-slate-800/80 overflow-hidden">
              <div
                className="h-full transition-all duration-300"
                style={{ width: `${progressPercent}%`, backgroundColor: activeColor }}
              />
            </div>
          </div>
        </div>
      )}

      {/* LAYOUT 4: CLEAN FLOATING TIMER DIGITS ONLY */}
      {layout === 'clean-timer' && (
        <div className="m-auto text-center animate-in zoom-in-95 duration-200">
          <div
            className={`text-7xl md:text-9xl font-black ${fontClass} tabular-nums tracking-tight drop-shadow-[0_8px_20px_rgba(0,0,0,0.9)]`}
            style={{ color: activeColor }}
          >
            {formattedTime}
          </div>
          {state.title && (
            <div className="text-lg font-bold uppercase tracking-wider text-white/90 drop-shadow-md mt-2">
              {state.title}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
