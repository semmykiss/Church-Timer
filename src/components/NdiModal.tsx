import React, { useState } from 'react';
import { TimerState, NdiConfig, DEFAULT_NDI_CONFIG } from '../types/timer';
import { useUITheme } from '../context/ThemeContext';
import {
  Video,
  X,
  Copy,
  Check,
  ExternalLink,
  Layers,
  Monitor,
  Tv,
  HelpCircle,
  Sliders,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

interface NdiModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: TimerState;
  onUpdateConfig: (updated: Partial<NdiConfig>) => void;
}

export const NdiModal: React.FC<NdiModalProps> = ({
  isOpen,
  onClose,
  state,
  onUpdateConfig,
}) => {
  const { theme } = useUITheme();
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'urls' | 'vmix' | 'obs' | 'preview'>('urls');
  const [cameraSimulation, setCameraSimulation] = useState<'church' | 'choir' | 'checker' | 'black'>('church');

  const ndiConfig = state.ndiConfig || DEFAULT_NDI_CONFIG;

  if (!isOpen) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const roomId = state.roomId || 'main';

  // Base NDI URL
  const getNdiUrl = (layout: string = ndiConfig.layout, bg: string = ndiConfig.background) => {
    return `${origin}/?view=ndi&room=${encodeURIComponent(roomId)}&layout=${layout}&bg=${bg}`;
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2500);
  };

  const openNdiWindow = (layout: string = ndiConfig.layout, bg: string = ndiConfig.background) => {
    const url = getNdiUrl(layout, bg);
    window.open(url, `SanctuaryNDI_${roomId}`, 'width=1920,height=1080');
  };

  const layouts = [
    {
      id: 'lower-third',
      name: 'Lower Third Banner',
      desc: 'Ideal for livestream overlays with speaker, sermon title, countdown & logo.',
    },
    {
      id: 'corner-bug',
      name: 'Corner Bug (HUD)',
      desc: 'Compact countdown clock tucked in the corner for Sunday broadcast.',
    },
    {
      id: 'fullscreen-hud',
      name: 'Stage Confidence Feed',
      desc: 'Huge high-contrast countdown for NDI talent monitors & teleprompters.',
    },
    {
      id: 'clean-timer',
      name: 'Clean Timer Digits',
      desc: 'Minimal floating countdown digits with 100% transparent background.',
    },
  ];

  const backgrounds = [
    { id: 'transparent', name: 'Alpha Transparent', color: 'bg-slate-900 border-dashed border-amber-400' },
    { id: 'chroma-green', name: 'Chroma Green (#00FF00)', color: 'bg-[#00FF00]' },
    { id: 'chroma-blue', name: 'Chroma Blue (#0000FF)', color: 'bg-[#0000FF]' },
    { id: 'chroma-magenta', name: 'Chroma Magenta (#FF00FF)', color: 'bg-[#FF00FF]' },
    { id: 'black', name: 'Luma Key Black', color: 'bg-black' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className={`w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-2xl ${theme.cardClass} border ${theme.borderClass} p-6 shadow-2xl space-y-6 text-slate-100`}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700/50 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Video className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-white">NDI® & Live Video Output</h2>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Broadcast Ready
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Send live countdowns with transparent alpha directly into vMix, OBS Studio, and NDI receivers.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800">
          <button
            onClick={() => setActiveTab('urls')}
            className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider transition border-b-2 flex items-center gap-1.5 ${
              activeTab === 'urls'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" /> Output Links & Layouts
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider transition border-b-2 flex items-center gap-1.5 ${
              activeTab === 'preview'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Tv className="w-4 h-4" /> Live Camera Simulator
          </button>
          <button
            onClick={() => setActiveTab('vmix')}
            className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider transition border-b-2 flex items-center gap-1.5 ${
              activeTab === 'vmix'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Monitor className="w-4 h-4" /> vMix Guide
          </button>
          <button
            onClick={() => setActiveTab('obs')}
            className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider transition border-b-2 flex items-center gap-1.5 ${
              activeTab === 'obs'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4" /> OBS Studio & NDI
          </button>
        </div>

        {/* TAB 1: OUTPUT LINKS & LAYOUT SELECTION */}
        {activeTab === 'urls' && (
          <div className="space-y-6">
            {/* Layout Options */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-cyan-400" /> Select Broadcast Layout
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {layouts.map((l) => {
                  const isSelected = ndiConfig.layout === l.id;
                  return (
                    <div
                      key={l.id}
                      onClick={() => onUpdateConfig({ layout: l.id as NdiConfig['layout'] })}
                      className={`p-3.5 rounded-xl border cursor-pointer transition ${
                        isSelected
                          ? 'border-cyan-500 bg-cyan-500/15 shadow-md shadow-cyan-500/10'
                          : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-sm text-white">{l.name}</span>
                        {isSelected && <Check className="w-4 h-4 text-cyan-400" />}
                      </div>
                      <p className="text-xs text-slate-400">{l.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Background / Keying Method */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Background & Keying Mode
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {backgrounds.map((bg) => {
                  const isSelected = ndiConfig.background === bg.id;
                  return (
                    <button
                      key={bg.id}
                      onClick={() => onUpdateConfig({ background: bg.id as NdiConfig['background'] })}
                      className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center gap-1.5 ${
                        isSelected
                          ? 'border-cyan-400 bg-cyan-500/20'
                          : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
                      }`}
                    >
                      <span className={`w-4 h-4 rounded-full ${bg.color}`} />
                      <span className="text-[11px] font-medium text-slate-200 truncate w-full">
                        {bg.name.split(' ')[0]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Primary NDI Web Source URL Box */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-cyan-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> 1-Click Browser Source URL
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Paste this into vMix (Web Browser) or OBS Studio (Browser Source) for 100% transparent alpha output.
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openNdiWindow()}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1 transition"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Open Output
                  </button>
                  <button
                    onClick={() => copyToClipboard(getNdiUrl(), 'primary')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                      copiedType === 'primary'
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20'
                    }`}
                  >
                    {copiedType === 'primary' ? (
                      <>
                        <Check className="w-3.5 h-3.5" /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> Copy URL
                      </>
                    )}
                  </button>
                </div>
              </div>
              <input
                readOnly
                value={getNdiUrl()}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-cyan-300 font-mono text-xs select-all focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* TAB 2: LIVE CAMERA SIMULATOR */}
        {activeTab === 'preview' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-xs text-slate-400">
                Simulate how your live timer looks overlaid on top of church video feeds:
              </div>
              <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-lg border border-slate-800">
                <button
                  onClick={() => setCameraSimulation('church')}
                  className={`px-2.5 py-1 rounded text-xs transition ${
                    cameraSimulation === 'church' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400'
                  }`}
                >
                  Pulpit Cam
                </button>
                <button
                  onClick={() => setCameraSimulation('choir')}
                  className={`px-2.5 py-1 rounded text-xs transition ${
                    cameraSimulation === 'choir' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400'
                  }`}
                >
                  Stage Cam
                </button>
                <button
                  onClick={() => setCameraSimulation('checker')}
                  className={`px-2.5 py-1 rounded text-xs transition ${
                    cameraSimulation === 'checker' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400'
                  }`}
                >
                  Alpha Grid
                </button>
              </div>
            </div>

            {/* Video preview viewport */}
            <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col justify-end p-6 select-none">
              {/* Simulated video background */}
              {cameraSimulation === 'church' && (
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center">
                  <div className="text-center opacity-30">
                    <div className="text-5xl mb-2">⛪</div>
                    <div className="text-xs uppercase tracking-widest text-slate-400 font-bold">
                      Main Sanctuary Camera (1080p60)
                    </div>
                  </div>
                </div>
              )}
              {cameraSimulation === 'choir' && (
                <div className="absolute inset-0 bg-gradient-to-t from-amber-950/40 via-purple-950/40 to-slate-950 flex items-center justify-center">
                  <div className="text-center opacity-30">
                    <div className="text-5xl mb-2">🎤</div>
                    <div className="text-xs uppercase tracking-widest text-slate-400 font-bold">
                      Worship & Choir Live Feed
                    </div>
                  </div>
                </div>
              )}
              {cameraSimulation === 'checker' && (
                <div className="absolute inset-0 bg-[linear-gradient(45deg,#1e293b_25%,transparent_25%),linear-gradient(-45deg,#1e293b_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#1e293b_75%),linear-gradient(-45deg,transparent_75%,#1e293b_75%)] bg-[size:20px_20px] bg-slate-950" />
              )}

              {/* Simulated Overlay */}
              <div className="relative z-10 w-full">
                {ndiConfig.layout === 'lower-third' && (
                  <div className="rounded-xl bg-slate-950/85 backdrop-blur-xl border border-white/10 p-4 flex items-center justify-between shadow-2xl">
                    <div>
                      <div className="text-[10px] text-amber-400 uppercase font-bold tracking-wider">
                        {state.churchLogo?.churchName || 'Grace Sanctuary'}
                      </div>
                      <div className="text-base font-bold text-white">{state.title || 'Sermon'}</div>
                      {state.speaker && (
                        <div className="text-xs text-slate-300 font-medium">Speaker: {state.speaker}</div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                        Time Remaining
                      </div>
                      <div className="text-3xl font-black font-mono text-emerald-400 tabular-nums">
                        {Math.floor(state.remainingSeconds / 60)}:
                        {(state.remainingSeconds % 60).toString().padStart(2, '0')}
                      </div>
                    </div>
                  </div>
                )}

                {ndiConfig.layout === 'corner-bug' && (
                  <div className="ml-auto w-44 rounded-xl bg-slate-950/90 backdrop-blur-md border border-white/10 p-3 shadow-xl">
                    <div className="text-[10px] text-slate-400 uppercase font-bold truncate">
                      {state.title || 'Service'}
                    </div>
                    <div className="text-2xl font-black font-mono text-emerald-400">
                      {Math.floor(state.remainingSeconds / 60)}:
                      {(state.remainingSeconds % 60).toString().padStart(2, '0')}
                    </div>
                  </div>
                )}

                {ndiConfig.layout === 'fullscreen-hud' && (
                  <div className="text-center py-6">
                    <div className="text-6xl font-black font-mono text-emerald-400">
                      {Math.floor(state.remainingSeconds / 60)}:
                      {(state.remainingSeconds % 60).toString().padStart(2, '0')}
                    </div>
                    <div className="text-sm font-bold uppercase tracking-wider text-white mt-1">
                      {state.title}
                    </div>
                  </div>
                )}

                {ndiConfig.layout === 'clean-timer' && (
                  <div className="text-center">
                    <div className="text-5xl font-black font-mono text-emerald-400 drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]">
                      {Math.floor(state.remainingSeconds / 60)}:
                      {(state.remainingSeconds % 60).toString().padStart(2, '0')}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: vMix GUIDE */}
        {activeTab === 'vmix' && (
          <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center font-bold text-xs">
                  1
                </span>
                Adding Stagetimer into vMix via Web Browser Input
              </h3>
              <ol className="list-decimal pl-5 space-y-2 text-slate-300">
                <li>
                  In vMix, click <strong>Add Input</strong> in the bottom-left corner.
                </li>
                <li>
                  Select the <strong>Web Browser</strong> category on the left navigation.
                </li>
                <li>
                  Paste your Sanctuary NDI URL:
                  <div className="mt-1 flex items-center gap-2">
                    <code className="px-2 py-1 bg-slate-950 rounded text-cyan-300 font-mono text-[11px] truncate select-all">
                      {getNdiUrl('lower-third', 'transparent')}
                    </code>
                    <button
                      onClick={() => copyToClipboard(getNdiUrl('lower-third', 'transparent'), 'vmix')}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-semibold"
                    >
                      {copiedType === 'vmix' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </li>
                <li>
                  Set Width to <strong>1920</strong> and Height to <strong>1080</strong>.
                </li>
                <li>
                  Check <strong>Transparent background</strong> (or set chroma key if using chroma green).
                </li>
                <li>
                  Assign the input to an <strong>Overlay Channel (1, 2, 3, or 4)</strong> to toggle over your live sermon feed!
                </li>
              </ol>
            </div>
          </div>
        )}

        {/* TAB 4: OBS STUDIO & NDI */}
        {activeTab === 'obs' && (
          <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center font-bold text-xs">
                  2
                </span>
                Using OBS Studio Browser Source & OBS-NDI
              </h3>
              <ol className="list-decimal pl-5 space-y-2 text-slate-300">
                <li>
                  In OBS Studio, click <strong>+</strong> under Sources and choose <strong>Browser</strong>.
                </li>
                <li>Name the source "Sanctuary Stage Timer".</li>
                <li>
                  Paste the NDI URL:
                  <div className="mt-1 flex items-center gap-2">
                    <code className="px-2 py-1 bg-slate-950 rounded text-cyan-300 font-mono text-[11px] truncate select-all">
                      {getNdiUrl('lower-third', 'transparent')}
                    </code>
                    <button
                      onClick={() => copyToClipboard(getNdiUrl('lower-third', 'transparent'), 'obs')}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-semibold"
                    >
                      {copiedType === 'obs' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </li>
                <li>
                  Set Width to <strong>1920</strong> and Height to <strong>1080</strong>.
                </li>
                <li>
                  Check <strong>Shutdown source when not visible</strong> and <strong>Refresh browser when scene becomes active</strong>.
                </li>
                <li>
                  <strong>NDI Broadcast:</strong> If you have the <em>obs-ndi</em> plugin installed, go to <strong>Tools → NDI® Output Settings</strong> and enable Main Output to stream directly to any NDI receiver on your network!
                </li>
              </ol>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
            Works on local LAN & offline without internet.
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
