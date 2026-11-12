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
  Menu,
  ChevronDown,
  LogOut,
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
  onOpenStageScreen?: () => void;
  onToggleStageScreen?: () => void;
  isStageWindowOpen?: boolean;
  onOpenNdiModal: () => void;
  onOpenChurchLogoModal: () => void;
  onOpenInteroperabilityModal: () => void;
  onOpenShareModal: () => void;
  onOpenThemeModal: () => void;
  onOpenQuickSetup?: () => void;
  connected?: boolean;
  roomId?: string;
  churchLogo?: ChurchLogoConfig;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onSelectView,
  onOpenStageScreen,
  onToggleStageScreen,
  isStageWindowOpen = false,
  onOpenNdiModal,
  onOpenChurchLogoModal,
  onOpenInteroperabilityModal,
  onOpenShareModal,
  onOpenThemeModal,
  onOpenQuickSetup,
  connected = true,
  roomId = 'main',
  churchLogo,
  onLogout,
}) => {
  const { currentTheme, theme, setTheme, toggleDarkLight } = useUITheme();
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const themeMenuRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const isOnline = useOnlineStatus();
  const { isInstallable, isInstalled, install } = usePWAInstall();

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (themeMenuRef.current && !themeMenuRef.current.contains(event.target as Node)) {
        setShowThemeMenu(false);
      }
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setShowMoreMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const THEME_OPTIONS: { id: UIThemePreset; name: string; dotColor: string }[] = [
    { id: 'dark', name: 'Dark Mode', dotColor: '#0f172a' },
    { id: 'light', name: 'Light Mode', dotColor: '#f8fafc' },
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

      {/* Zone 2: Navigation Links — primary views + cascaded tools menu */}
      <nav className="hidden md:flex items-center gap-4 xl:gap-5 text-sm font-medium">
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

        {/* Cascaded Tools Menu — all screen sizes */}
        <div className="relative" ref={moreMenuRef}>
          <button
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            className={`p-2 sm:px-2.5 rounded-lg border transition-all flex items-center gap-1.5 text-xs font-medium ${theme.cardClass} ${theme.textPrimaryClass} hover:border-slate-400/40`}
            title="Tools & Settings"
            aria-label="Tools and settings menu"
          >
            <Menu className="w-4 h-4" />
            <span className="hidden sm:inline">More</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${showMoreMenu ? 'rotate-180' : ''}`} />
          </button>

          {showMoreMenu && (
            <div
              className={`absolute right-0 mt-2 w-56 rounded-xl border shadow-2xl py-2 z-50 text-xs ${theme.cardClass} ${theme.borderClass}`}
            >
              <div className={`px-3 py-1.5 border-b font-semibold uppercase tracking-wider text-[10px] ${theme.textMutedClass} ${theme.borderClass}`}>
                Tools & Settings
              </div>
              <div className="p-1 space-y-0.5">
                {onOpenQuickSetup && (
                  <MoreMenuItem
                    icon={<Zap className="w-4 h-4 text-amber-400" />}
                    label="Quick Setup"
                    hint="Timer (Q)"
                    onClick={() => { setShowMoreMenu(false); onOpenQuickSetup(); }}
                  />
                )}
                <MoreMenuItem
                  icon={<Video className="w-4 h-4 text-cyan-400" />}
                  label="NDI® Output"
                  hint="vMix / OBS"
                  onClick={() => { setShowMoreMenu(false); onOpenNdiModal(); }}
                />
                <MoreMenuItem
                  icon={<ImageIcon className="w-4 h-4 text-amber-400" />}
                  label="Church Logo"
                  hint="Branding"
                  onClick={() => { setShowMoreMenu(false); onOpenChurchLogoModal(); }}
                />
                <MoreMenuItem
                  icon={<ArrowRightLeft className="w-4 h-4 text-purple-400" />}
                  label="Interoperability"
                  hint="Offline & Backup"
                  onClick={() => { setShowMoreMenu(false); onOpenInteroperabilityModal(); }}
                />
                <MoreMenuItem
                  icon={<QrCode className="w-4 h-4 text-emerald-400" />}
                  label="Online URLs"
                  hint="Stage tablets"
                  onClick={() => { setShowMoreMenu(false); onOpenShareModal(); }}
                />
                <MoreMenuItem
                  icon={<Palette className="w-4 h-4 text-purple-400" />}
                  label="Stage Colors"
                  hint="Thresholds"
                  onClick={() => { setShowMoreMenu(false); onOpenThemeModal(); }}
                />
              </div>
            </div>
          )}
        </div>

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

        {/* Operator Sign-out */}
        {onLogout && (
          <button
            onClick={onLogout}
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-2 text-xs font-semibold rounded-lg border transition-all ${theme.cardClass} ${theme.textMutedClass} hover:text-red-400 hover:border-red-500/50 hover:bg-red-500/10`}
            title="Sign out of this console"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign out</span>
          </button>
        )}
        {onLogout && (
          <button
            onClick={onLogout}
            className="sm:hidden p-2 rounded-lg border transition-all border-red-500/40 text-red-400 hover:bg-red-500/10"
            title="Sign out of this console"
            aria-label="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}

        {/* Primary Action: Toggle the second-screen stage window */}
        <button
          onClick={onToggleStageScreen ?? onOpenStageScreen}
          className={`px-3 sm:px-4 py-2 text-xs font-bold text-white rounded-lg transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 shadow-md active:scale-95 ${
            isStageWindowOpen
              ? 'bg-gradient-to-r from-red-600 to-rose-500 hover:from-red-500 hover:to-rose-400 shadow-lg shadow-red-500/30'
              : 'bg-emerald-600 hover:bg-emerald-500'
          }`}
          title={isStageWindowOpen ? 'Close the stage window on your second monitor' : 'Open the stage window on your second monitor'}
        >
          <Monitor className="w-4 h-4" />
          <span className="hidden sm:inline">{isStageWindowOpen ? 'Close Stage Screen' : 'Open Stage Screen'}</span>
          <span className="sm:hidden">Stage</span>
        </button>
      </div>
    </header>
  );
};

// Row inside the cascaded "More" tools dropdown
const MoreMenuItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  hint?: string;
  onClick: () => void;
}> = ({ icon, label, hint, onClick }) => {
  const { theme } = useUITheme();
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full px-3 py-2 rounded-lg flex items-center gap-3 text-left transition-colors hover:bg-slate-500/10 ${theme.textPrimaryClass}`}
    >
      {icon}
      <span className="flex-1 font-medium">{label}</span>
      {hint && <span className={`text-[10px] ${theme.textMutedClass}`}>{hint}</span>}
    </button>
  );
};
