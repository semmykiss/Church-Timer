import React, { useState, useRef, useEffect } from 'react';
import {
  Monitor,
  Sun,
  Moon,
  Palette,
  Zap,
  QrCode,
  Check,
  Video,
  Image as ImageIcon,
  ArrowRightLeft,
  Laptop,
} from 'lucide-react';
import { useUITheme } from '../context/ThemeContext';
import { UIThemePreset } from '../types/uiTheme';
import { ChurchLogoConfig } from '../types/timer';
import { ChurchLogo } from './ChurchLogo';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface HeaderProps {
  currentView: 'controller' | 'stage' | 'ndi';
  onSelectView: (view: 'controller' | 'stage' | 'ndi') => void;
  onOpenStageScreen: () => void;
  onOpenNdiModal: () => void;
  onOpenChurchLogoModal: () => void;
  onOpenInteroperabilityModal: () => void;
  onOpenShareModal: () => void;
  onOpenThemeModal: () => void;
  onOpenQuickSetup?: () => void;
  connected?: boolean;
  roomId?: string;
  churchLogo?: ChurchLogoConfig;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onSelectView,
  onOpenStageScreen,
  onOpenNdiModal,
  onOpenChurchLogoModal,
  onOpenInteroperabilityModal,
  onOpenShareModal,
  onOpenThemeModal,
  onOpenQuickSetup,
  connected = true,
  roomId = 'main',
  churchLogo,
}) => {
  const { currentTheme, theme, setTheme, toggleDarkLight } = useUITheme();
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const themeMenuRef = useRef<HTMLDivElement>(null);
  const isOnline = useOnlineStatus();
  const { isInstallable, isInstalled, install } = usePWAInstall();

  // Close theme dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (themeMenuRef.current && !themeMenuRef.current.contains(event.target as Node)) {
        setShowThemeMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const THEME_OPTIONS: { id: UIThemePreset; name: string; dotColor: string }[] = [
    { id: 'dark', name: 'Studio Dark', dotColor: '#0f172a' },
    { id: 'light', name: 'Daylight Light', dotColor: '#f8fafc' },
    { id: 'midnight-navy', name: 'Midnight Navy', dotColor: '#08152c' },
    { id: 'emerald-sanctuary', name: 'Sanctuary Forest', dotColor: '#072418' },
    { id: 'royal-purple', name: 'Royal Worship', dotColor: '#1a0a33' },
    { id: 'warm-amber', name: 'Cathedral Amber', dotColor: '#241a08' },
  ];

  return (
    <header
      className={`flex items-center justify-between gap-3 px-3 sm:px-6 py-2.5 sm:py-3.5 border-b backdrop-blur-md sticky top-0 z-30 transition-colors duration-200 ${theme.surfaceClass} ${theme.borderClass}`}
    >
      {/* Zone 1: Logo & Room info */}
      <div className="flex items-center gap-3">
        <a
          href="/"
          className={`text-base sm:text-lg font-bold tracking-tight whitespace-nowrap shrink-0 flex items-center gap-2 ${theme.textPrimaryClass} hover:opacity-90 transition-opacity`}
        >
          {churchLogo?.enabled && churchLogo?.showOnController ? (
            <ChurchLogo config={churchLogo} showText={false} className="shrink-0" />
          ) : (
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
          )}
          <span className="truncate max-w-[140px] sm:max-w-none">
            {churchLogo?.enabled && churchLogo?.churchName ? churchLogo.churchName : 'SanctuaryTimer'}
          </span>
        </a>

        {/* Live sync / offline pill */}
        <span
          className={`hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
            connected && isOnline
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
          }`}
          title={`Room: ${roomId.toUpperCase()} · ${isOnline ? (connected ? 'Online Synced' : 'Reconnecting') : 'Offline Mode (Local Storage & Peer Sync)'}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${connected && isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
          <span>{isOnline ? `Room: ${roomId.toUpperCase()}` : 'Offline Mode'}</span>
        </span>
      </div>

      {/* Zone 2: Navigation Links */}
      <nav className="hidden lg:flex items-center gap-4 xl:gap-5 text-sm font-medium">
        <button
          onClick={() => onSelectView('controller')}
          className={`transition-colors whitespace-nowrap shrink-0 ${
            currentView === 'controller'
              ? `${theme.textPrimaryClass} font-bold underline underline-offset-8 decoration-emerald-500 decoration-2`
              : `${theme.textMutedClass} hover:${theme.textPrimaryClass}`
          }`}
        >
          Director Console
        </button>
        <button
          onClick={() => onSelectView('stage')}
          className={`transition-colors whitespace-nowrap shrink-0 ${
            currentView === 'stage'
              ? `${theme.textPrimaryClass} font-bold underline underline-offset-8 decoration-emerald-500 decoration-2`
              : `${theme.textMutedClass} hover:${theme.textPrimaryClass}`
          }`}
        >
          Stage Screen
        </button>

        {/* NDI Output Modal Trigger */}
        <button
          onClick={onOpenNdiModal}
          className={`flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${theme.textMutedClass} hover:text-cyan-400`}
          title="NDI® Video Output for vMix and OBS Studio"
        >
          <Video className="w-3.5 h-3.5 text-cyan-400" />
          <span>NDI® Output</span>
        </button>

        {/* Church Logo Trigger */}
        <button
          onClick={onOpenChurchLogoModal}
          className={`flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${theme.textMutedClass} hover:text-amber-400`}
          title="Upload Church Logo & Set Brand Appearance"
        >
          <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
          <span>Church Logo</span>
        </button>

        {/* Offline / Interoperability Trigger */}
        <button
          onClick={onOpenInteroperabilityModal}
          className={`flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${theme.textMutedClass} hover:text-purple-400`}
          title="Desktop App & Offline Backup Hub"
        >
          <ArrowRightLeft className="w-3.5 h-3.5 text-purple-400" />
          <span>Interoperability</span>
        </button>

        {onOpenQuickSetup && (
          <button
            onClick={onOpenQuickSetup}
            className={`flex items-center gap-1 transition-colors whitespace-nowrap shrink-0 ${theme.textMutedClass} hover:${theme.textPrimaryClass}`}
            title="Quick Timer Setup & Adjustments"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Quick Setup</span>
          </button>
        )}

        <button
          onClick={onOpenShareModal}
          className={`flex items-center gap-1 transition-colors whitespace-nowrap shrink-0 ${theme.textMutedClass} hover:${theme.textPrimaryClass}`}
        >
          <QrCode className="w-3.5 h-3.5 text-emerald-400" />
          <span>Online URLs</span>
        </button>

        <button
          onClick={onOpenThemeModal}
          className={`flex items-center gap-1 transition-colors whitespace-nowrap shrink-0 ${theme.textMutedClass} hover:${theme.textPrimaryClass}`}
        >
          <Palette className="w-3.5 h-3.5 text-purple-400" />
          <span>Stage Colors</span>
        </button>
      </nav>

      {/* Zone 3: Actions & Theme Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Install Desktop App shortcut if available */}
        {!isInstalled && isInstallable && (
          <button
            onClick={install}
            className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-purple-600/20 text-purple-300 border border-purple-500/40 hover:bg-purple-600 hover:text-white transition shadow-sm"
            title="Install Stagetimer as a Desktop App"
          >
            <Laptop className="w-3.5 h-3.5" />
            <span>Install Desktop</span>
          </button>
        )}

        {/* NDI Output Quick Button on Smaller Screens */}
        <button
          onClick={onOpenNdiModal}
          className="lg:hidden p-2 rounded-lg border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 transition"
          title="NDI® Video Output"
        >
          <Video className="w-4 h-4" />
        </button>

        {/* Church Logo Quick Button on Smaller Screens */}
        <button
          onClick={onOpenChurchLogoModal}
          className="lg:hidden p-2 rounded-lg border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 transition"
          title="Church Logo"
        >
          <ImageIcon className="w-4 h-4" />
        </button>

        {/* Quick Dark/Light Toggle */}
        <button
          onClick={toggleDarkLight}
          className={`p-2 rounded-lg border transition-all ${theme.cardClass} ${theme.textPrimaryClass} hover:border-slate-400/40`}
          title={`Switch to ${theme.mode === 'dark' ? 'Daylight Light' : 'Studio Dark'} mode`}
          aria-label="Toggle dark/light theme"
        >
          {theme.mode === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-700" />
          )}
        </button>

        {/* Interface Color Theme Dropdown */}
        <div className="relative" ref={themeMenuRef}>
          <button
            onClick={() => setShowThemeMenu(!showThemeMenu)}
            className={`p-2 rounded-lg border transition-all flex items-center gap-1.5 text-xs font-medium ${theme.cardClass} ${theme.textPrimaryClass} hover:border-slate-400/40`}
            title="Choose UI Theme & Colors"
          >
            <Palette className="w-4 h-4 text-emerald-400" />
            <span className="hidden md:inline">{theme.name.split(' ')[0]}</span>
          </button>

          {showThemeMenu && (
            <div
              className={`absolute right-0 mt-2 w-56 rounded-xl border shadow-2xl py-2 z-50 text-xs ${theme.cardClass} ${theme.borderClass}`}
            >
              <div className={`px-3 py-1.5 border-b font-semibold uppercase tracking-wider text-[10px] ${theme.textMutedClass} ${theme.borderClass}`}>
                Console Interface Theme
              </div>
              <div className="p-1 space-y-0.5">
                {THEME_OPTIONS.map((opt) => {
                  const isSelected = currentTheme === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setTheme(opt.id);
                        setShowThemeMenu(false);
                      }}
                      className={`w-full px-3 py-2 rounded-lg flex items-center justify-between text-left transition-colors ${
                        isSelected
                          ? `${theme.accentBgClass}`
                          : `hover:bg-slate-500/10 ${theme.textPrimaryClass}`
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-black/30 shrink-0"
                          style={{ backgroundColor: opt.dotColor }}
                        />
                        <span className="font-medium">{opt.name}</span>
                      </div>
                      {isSelected && <Check className="w-4 h-4 shrink-0" />}
                    </button>
                  );
                })}
              </div>
              <div className={`pt-1.5 mt-1 border-t px-2 ${theme.borderClass}`}>
                <button
                  type="button"
                  onClick={() => {
                    setShowThemeMenu(false);
                    onOpenThemeModal();
                  }}
                  className={`w-full py-1.5 px-2 text-center rounded text-[11px] font-medium text-emerald-400 hover:bg-emerald-500/10 transition-colors flex items-center justify-center gap-1`}
                >
                  <Palette className="w-3.5 h-3.5" />
                  <span>Customize Stage Colors...</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Primary Action: Open Stage Screen */}
        <button
          onClick={onOpenStageScreen}
          className="px-3 sm:px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 shadow-md active:scale-95"
          title="Open dedicated popup window to drag onto second sanctuary monitor"
        >
          <Monitor className="w-4 h-4" />
          <span className="hidden sm:inline">Open Stage Screen</span>
          <span className="sm:hidden">Stage</span>
        </button>
      </div>
    </header>
  );
};
