import React, { useRef, useState } from 'react';
import { TimerState } from '../types/timer';
import { useUITheme } from '../context/ThemeContext';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import {
  Download,
  Upload,
  Laptop,
  Globe,
  Wifi,
  WifiOff,
  CheckCircle2,
  X,
  FileJson,
  Layers,
  ArrowRightLeft,
  Monitor,
  Share2,
} from 'lucide-react';

interface InteroperabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: TimerState;
  onImportState: (imported: Partial<TimerState>) => void;
}

export const InteroperabilityModal: React.FC<InteroperabilityModalProps> = ({
  isOpen,
  onClose,
  state,
  onImportState,
}) => {
  const { theme } = useUITheme();
  const isOnline = useOnlineStatus();
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

  // Export full JSON configuration
  const handleExportJson = () => {
    // Also include custom church schedules and presets
    let schedulesData = null;
    let customPresetsData = null;
    try {
      const s = localStorage.getItem('sanctuary_church_schedules');
      if (s) schedulesData = JSON.parse(s);
      const p = localStorage.getItem('sanctuary_custom_presets');
      if (p) customPresetsData = JSON.parse(p);
    } catch {
      // ignore
    }

    const backupData = {
      app: 'SanctuaryTimer',
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      schedules: schedulesData,
      customPresets: customPresetsData,
      state: {
        roomId: state.roomId,
        title: state.title,
        speaker: state.speaker,
        totalDurationSeconds: state.totalDurationSeconds,
        remainingSeconds: state.remainingSeconds,
        overtimeEnabled: state.overtimeEnabled,
        soundAlertsEnabled: state.soundAlertsEnabled,
        clockModeEnabled: state.clockModeEnabled,
        themeConfig: state.themeConfig,
        churchLogo: state.churchLogo,
        ndiConfig: state.ndiConfig,
      },
    };

    const jsonString = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sanctuary-stage-backup-${state.roomId || 'main'}-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Import JSON configuration
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportStatus(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string);
        const importedState = parsed.state || parsed;
        if (!importedState) {
          throw new Error('Invalid backup file structure.');
        }

        // Restore custom schedules & presets if present in backup
        if (parsed.schedules && Array.isArray(parsed.schedules)) {
          localStorage.setItem('sanctuary_church_schedules', JSON.stringify(parsed.schedules));
        }
        if (parsed.customPresets && Array.isArray(parsed.customPresets)) {
          localStorage.setItem('sanctuary_custom_presets', JSON.stringify(parsed.customPresets));
        }

        onImportState(importedState);
        setImportStatus('Configuration, schedules & presets successfully imported and applied!');
      } catch (err) {
        setImportStatus('Error importing file: Invalid JSON format.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className={`w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl ${theme.cardClass} border ${theme.borderClass} p-6 shadow-2xl space-y-6 text-slate-100`}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700/50 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <ArrowRightLeft className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-white">Interoperability & Offline Hub</h2>
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                  isOnline
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                }`}>
                  {isOnline ? 'Online Synced' : 'Offline Mode Active'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Switch seamlessly between Web and Desktop app, transfer setups via JSON, and run offline.
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

        {/* 1. Web vs Desktop App Status */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isInstalled ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                {isInstalled ? <Laptop className="w-5 h-5" /> : <Globe className="w-5 h-5" />}
              </div>
              <div>
                <div className="font-semibold text-sm text-white">
                  {isInstalled ? 'Running as Installed Desktop Application' : 'Running in Web Browser Mode'}
                </div>
                <div className="text-xs text-slate-400">
                  {isInstalled
                    ? 'Standalone window with zero browser bars, keyboard shortcuts, and full offline caching.'
                    : 'You can install this app to your Mac, Windows PC, or Chromebook for 1-click desktop launching.'}
                </div>
              </div>
            </div>

            {/* Install Desktop App Button */}
            {!isInstalled && isInstallable && (
              <button
                onClick={install}
                className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition shadow-md shadow-purple-600/20 flex items-center gap-1.5"
              >
                <Laptop className="w-3.5 h-3.5" /> Install App
              </button>
            )}

            {!isInstalled && isIOS && (
              <span className="text-xs text-purple-300 bg-purple-950/60 px-2.5 py-1 rounded-lg border border-purple-800">
                iOS: Tap Share → Add to Home Screen
              </span>
            )}
          </div>
        </div>

        {/* 2. Offline Resilience Architecture */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
            <CheckCircle2 className="w-4 h-4" /> Multi-Layer Offline Resilience
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300">
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <div className="font-semibold text-slate-200 mb-1 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-400" /> BroadcastChannel Sync
              </div>
              <div>
                Allows stage monitors, confidence displays, and controller on the same machine to communicate with zero internet or server connection.
              </div>
            </div>
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <div className="font-semibold text-slate-200 mb-1 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Service Worker Cache
              </div>
              <div>
                All scripts, styles, sounds, and church brand logos are pre-cached so the application starts instantly even in airplane mode.
              </div>
            </div>
          </div>
        </div>

        {/* 3. Export & Import JSON Configuration */}
        <div className="space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Backup & Interoperability Transfer (JSON)
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Export Button */}
            <button
              onClick={handleExportJson}
              className="p-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition text-left flex items-start gap-3 group"
            >
              <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 group-hover:scale-105 transition-transform">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <div className="font-semibold text-sm text-white flex items-center gap-1.5">
                  Export Setup File
                  <FileJson className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Saves themes, presets, church logo, and room settings into a portable .json file.
                </div>
              </div>
            </button>

            {/* Import Button */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="p-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition text-left flex items-start gap-3 cursor-pointer group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleImportJson}
                className="hidden"
              />
              <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 group-hover:scale-105 transition-transform">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <div className="font-semibold text-sm text-white flex items-center gap-1.5">
                  Import Setup File
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Load a saved service rundown, timers, or logo from another computer or browser.
                </div>
              </div>
            </div>
          </div>

          {importStatus && (
            <div className={`p-3 rounded-xl text-xs font-medium ${
              importStatus.includes('Error')
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
            }`}>
              {importStatus}
            </div>
          )}
        </div>

        {/* Quick Launch Direct Screens */}
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Open Standalone Display Windows
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => window.open(`${origin}/?view=stage&room=${state.roomId}`, '_blank', 'width=1280,height=720')}
              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs text-slate-200 flex items-center gap-1.5 transition"
            >
              <Monitor className="w-3.5 h-3.5 text-emerald-400" /> Stage Screen Window
            </button>
            <button
              onClick={() => window.open(`${origin}/?view=ndi&room=${state.roomId}&layout=lower-third&bg=transparent`, '_blank', 'width=1920,height=1080')}
              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs text-slate-200 flex items-center gap-1.5 transition"
            >
              <Layers className="w-3.5 h-3.5 text-cyan-400" /> NDI Broadcast Window
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end pt-4 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
