import { useState, useEffect, useCallback } from 'react';
import { useTimerSync } from './hooks/useTimerSync';
import { StageDisplay } from './components/StageDisplay';
import { NdiDisplay } from './components/NdiDisplay';
import { Controller } from './components/Controller';
import { Header } from './components/Header';
import { ShareModal } from './components/ShareModal';
import { ThemeModal } from './components/ThemeModal';
import { QuickTimeEditor } from './components/QuickTimeEditor';
import { NdiModal } from './components/NdiModal';
import { ChurchLogoModal } from './components/ChurchLogoModal';
import { InteroperabilityModal } from './components/InteroperabilityModal';
import { useUITheme } from './context/ThemeContext';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';

function parseRoute(): { view: 'controller' | 'stage' | 'ndi'; room: string } {
  if (typeof window === 'undefined') {
    return { view: 'controller', room: 'main' };
  }

  const searchParams = new URLSearchParams(window.location.search);
  const pathname = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase();

  let room = (searchParams.get('room') || 'main').toLowerCase();
  let view: 'controller' | 'stage' | 'ndi' = 'controller';

  // Check query params
  const viewParam = searchParams.get('view') || searchParams.get('mode');
  if (viewParam === 'stage' || viewParam === 'display') {
    view = 'stage';
  } else if (viewParam === 'ndi' || viewParam === 'broadcast' || viewParam === 'obs' || viewParam === 'vmix') {
    view = 'ndi';
  }

  // Check path routes like /stage, /display, /ndi
  if (pathname.startsWith('/stage') || pathname.startsWith('/display')) {
    view = 'stage';
    const parts = pathname.split('/').filter(Boolean);
    if (parts.length >= 2 && parts[1]) {
      room = parts[1].toLowerCase();
    }
  } else if (pathname.startsWith('/ndi')) {
    view = 'ndi';
    const parts = pathname.split('/').filter(Boolean);
    if (parts.length >= 2 && parts[1]) {
      room = parts[1].toLowerCase();
    }
  }

  // Check hash routes like #stage, #display, #ndi
  if (hash.includes('stage') || hash.includes('display')) {
    view = 'stage';
  } else if (hash.includes('ndi')) {
    view = 'ndi';
  }

  return { view, room };
}

export default function App() {
  const { theme } = useUITheme();
  const isOnline = useOnlineStatus();
  const initialRoute = parseRoute();

  const [currentView, setCurrentView] = useState<'controller' | 'stage' | 'ndi'>(initialRoute.view);
  const [roomId, setRoomId] = useState<string>(initialRoute.room);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [isQuickEditorOpen, setIsQuickEditorOpen] = useState(false);
  const [isNdiModalOpen, setIsNdiModalOpen] = useState(false);
  const [isChurchLogoModalOpen, setIsChurchLogoModalOpen] = useState(false);
  const [isInteroperabilityModalOpen, setIsInteroperabilityModalOpen] = useState(false);

  // Sync route whenever URL popstate or hashchange happens
  useEffect(() => {
    const handleLocationChange = () => {
      const next = parseRoute();
      setCurrentView(next.view);
      setRoomId(next.room);
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  const {
    state,
    connected,
    startTimer,
    pauseTimer,
    resetTimer,
    setDuration,
    adjustTime,
    loadPreset,
    sendStageMessage,
    clearStageMessage,
    toggleBlackout,
    toggleSound,
    toggleOvertime,
    setTitleAndSpeaker,
    updateTheme,
    updateChurchLogo,
    updateNdiConfig,
    importState,
  } = useTimerSync(roomId);

  const handleOpenStageScreen = useCallback(() => {
    const width = 1280;
    const height = 720;
    const left = window.screen.width ? window.screen.width : 200;
    const stageUrl = `${window.location.origin}/?view=stage&room=${encodeURIComponent(roomId)}`;
    const newWindow = window.open(
      stageUrl,
      `SanctuaryStage_${roomId}`,
      `width=${width},height=${height},left=${left},top=0,menubar=no,toolbar=no,location=no,status=no`
    );
    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
      window.open(stageUrl, '_blank');
    }
  }, [roomId]);

  // Global Keyboard shortcuts for AV booth operators
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target?.tagName)) {
        return;
      }

      // Spacebar: Start / Pause
      if (e.code === 'Space') {
        e.preventDefault();
        if (state.isRunning) {
          pauseTimer();
        } else {
          startTimer();
        }
      }
      // 'R' / 'r': Reset
      else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        resetTimer();
      }
      // 'Q' / 'q': Quick Setup / Edit
      else if (e.key === 'q' || e.key === 'Q') {
        e.preventDefault();
        setIsQuickEditorOpen(true);
      }
      // 'N' / 'n': NDI Video Output Modal
      else if (e.key === 'n' || e.key === 'N') {
        if (!e.metaKey && !e.ctrlKey) {
          e.preventDefault();
          setIsNdiModalOpen((prev) => !prev);
        }
      }
      // 'L' / 'l': Church Logo Modal
      else if (e.key === 'l' || e.key === 'L') {
        if (!e.metaKey && !e.ctrlKey) {
          e.preventDefault();
          setIsChurchLogoModalOpen((prev) => !prev);
        }
      }
      // 'S' / 's': Share / Online URLs
      else if (e.key === 's' || e.key === 'S') {
        if (!e.metaKey && !e.ctrlKey) {
          e.preventDefault();
          setIsShareModalOpen((prev) => !prev);
        }
      }
      // 'T' / 't': Theme Modal
      else if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        setIsThemeModalOpen((prev) => !prev);
      }
      // 'B' / 'b': Toggle Blackout
      else if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        toggleBlackout();
      }
      // 'M' / 'm': Toggle Sound Mute
      else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        toggleSound();
      }
      // '+' or '=': Add 1 minute
      else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        adjustTime(60);
      }
      // '-' or '_': Subtract 1 minute
      else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        adjustTime(-60);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    state.isRunning,
    startTimer,
    pauseTimer,
    resetTimer,
    adjustTime,
    toggleBlackout,
    toggleSound,
  ]);

  // Handle Quick Time apply
  const handleQuickTimeApply = (
    totalSeconds: number,
    title?: string,
    speaker?: string,
    autoStart?: boolean
  ) => {
    setDuration(totalSeconds, title, speaker);
    if (autoStart) {
      setTimeout(() => startTimer(), 100);
    }
  };

  // If pure stage display mode is requested (via URL /stage, ?view=stage, or toggle)
  if (currentView === 'stage') {
    return (
      <StageDisplay
        state={state}
        connected={connected}
        onAdjustTime={adjustTime}
        isStandalone={true}
        onSwitchToController={() => {
          setCurrentView('controller');
          window.history.pushState({}, '', `/?room=${encodeURIComponent(roomId)}`);
        }}
      />
    );
  }

  // If NDI / transparent broadcast output mode is requested (via URL /ndi, ?view=ndi, or toggle)
  if (currentView === 'ndi') {
    return (
      <NdiDisplay
        state={state}
        onSwitchToController={() => {
          setCurrentView('controller');
          window.history.pushState({}, '', `/?room=${encodeURIComponent(roomId)}`);
        }}
      />
    );
  }

  const mins = Math.floor(state.remainingSeconds / 60);
  const secs = state.remainingSeconds % 60;

  // Otherwise render Director Console
  return (
    <div className={`min-h-screen ${theme.bgClass} flex flex-col font-sans transition-colors duration-200`}>
      <Header
        currentView={currentView}
        onSelectView={(v) => {
          setCurrentView(v);
          if (v === 'stage') {
            window.history.pushState({}, '', `/?view=stage&room=${encodeURIComponent(roomId)}`);
          } else if (v === 'ndi') {
            window.history.pushState({}, '', `/?view=ndi&room=${encodeURIComponent(roomId)}`);
          } else {
            window.history.pushState({}, '', `/?room=${encodeURIComponent(roomId)}`);
          }
        }}
        onOpenStageScreen={handleOpenStageScreen}
        onOpenNdiModal={() => setIsNdiModalOpen(true)}
        onOpenChurchLogoModal={() => setIsChurchLogoModalOpen(true)}
        onOpenInteroperabilityModal={() => setIsInteroperabilityModalOpen(true)}
        onOpenShareModal={() => setIsShareModalOpen(true)}
        onOpenThemeModal={() => setIsThemeModalOpen(true)}
        onOpenQuickSetup={() => setIsQuickEditorOpen(true)}
        connected={connected}
        roomId={roomId}
        churchLogo={state.churchLogo}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Controller
          state={state}
          connected={connected}
          onStart={startTimer}
          onPause={pauseTimer}
          onReset={resetTimer}
          onAdjustTime={adjustTime}
          onSetDuration={setDuration}
          onLoadPreset={loadPreset}
          onSendStageMessage={sendStageMessage}
          onClearStageMessage={clearStageMessage}
          onToggleBlackout={toggleBlackout}
          onToggleSound={toggleSound}
          onToggleOvertime={toggleOvertime}
          onSetTitleAndSpeaker={setTitleAndSpeaker}
          onOpenShareModal={() => setIsShareModalOpen(true)}
          onOpenThemeModal={() => setIsThemeModalOpen(true)}
          onOpenQuickSetup={() => setIsQuickEditorOpen(true)}
          onOpenNdiModal={() => setIsNdiModalOpen(true)}
          onOpenChurchLogoModal={() => setIsChurchLogoModalOpen(true)}
          onOpenInteroperabilityModal={() => setIsInteroperabilityModalOpen(true)}
        />
      </main>

      {/* Offline Status Badge banner (shows when user is disconnected from internet) */}
      {!isOnline && (
        <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs shadow-2xl animate-in slide-in-from-bottom-4">
          <WifiOff className="w-4 h-4 animate-pulse" />
          <span>Offline Mode Active • Local Broadcast Sync & Timers Working Offline</span>
        </div>
      )}

      {/* Modals */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        roomId={roomId}
      />

      <ThemeModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
        themeConfig={state.themeConfig}
        onSaveTheme={updateTheme}
      />

      <QuickTimeEditor
        isOpen={isQuickEditorOpen}
        onClose={() => setIsQuickEditorOpen(false)}
        currentMinutes={mins >= 0 ? mins : 30}
        currentSeconds={secs >= 0 ? secs : 0}
        currentTitle={state.title}
        currentSpeaker={state.speaker}
        onApply={handleQuickTimeApply}
      />

      <NdiModal
        isOpen={isNdiModalOpen}
        onClose={() => setIsNdiModalOpen(false)}
        state={state}
        onUpdateConfig={updateNdiConfig}
      />

      <ChurchLogoModal
        isOpen={isChurchLogoModalOpen}
        onClose={() => setIsChurchLogoModalOpen(false)}
        config={state.churchLogo}
        onUpdate={updateChurchLogo}
      />

      <InteroperabilityModal
        isOpen={isInteroperabilityModalOpen}
        onClose={() => setIsInteroperabilityModalOpen(false)}
        state={state}
        onImportState={importState}
      />
    </div>
  );
}
