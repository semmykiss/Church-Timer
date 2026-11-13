import { useState, useEffect, useCallback, useRef } from 'react';
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
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './components/LoginPage';
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
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}

// Blocks the console until an AV operator signs in
function AuthGate() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <LoginPage />;
  }
  return <AppShell />;
}

function AppShell() {
  const { theme } = useUITheme();
  const { logout } = useAuth();
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
    setThresholds,
    setTitleAndSpeaker,
    updateTheme,
    updateChurchLogo,
    updateNdiConfig,
    importState,
    getSchedules,
    saveSchedule,
    deleteSchedule,
  } = useTimerSync(roomId);

  // Stage pop-out window lifecycle (opened/closed via the "Extend 2nd Screen" toggle)
  const stageWindowRef = useRef<Window | null>(null);
  const [isStageWindowOpen, setIsStageWindowOpen] = useState(false);

  // Keep button state in sync if the operator closes the stage window manually
  useEffect(() => {
    if (!isStageWindowOpen) return;
    const poll = setInterval(() => {
      const w = stageWindowRef.current;
      if (!w || w.closed) {
        stageWindowRef.current = null;
        setIsStageWindowOpen(false);
      }
    }, 800);
    return () => clearInterval(poll);
  }, [isStageWindowOpen]);

  const handleToggleStageScreen = useCallback(async () => {
    // Toggle: if the stage window is open, close it
    const existing = stageWindowRef.current;
    if (existing && !existing.closed) {
      existing.close();
      stageWindowRef.current = null;
      setIsStageWindowOpen(false);
      return;
    }
    await handleOpenStageScreenRef.current?.();
  }, []);

  const handleOpenStageScreen = useCallback(async () => {
    const width = 1280;
    const height = 720;

    const scr = window.screen as any;
    let left = (scr.availLeft ?? 0) + scr.availWidth - width;
    let top = scr.availTop ?? 0;
    let placedOnSecondScreen = false;

    // Use the Window Management API when available for true second-monitor placement
    try {
      if ('getScreenDetails' in window) {
        const details = await (window as any).getScreenDetails();
        const screens: any[] = details.screens || [];
        if (screens.length > 1) {
          const other =
            screens.find((s) => s !== details.currentScreen && (s.availWidth >= 1024 || s.width >= 1024)) ||
            screens.find((s) => s !== details.currentScreen);
          if (other) {
            const w = Math.min(width, other.availWidth || other.width);
            const h = Math.min(height, other.availHeight || other.height);
            left = other.availLeft + Math.max(0, Math.floor(((other.availWidth || other.width) - w) / 2));
            top = other.availTop + Math.max(0, Math.floor(((other.availHeight || other.height) - h) / 2));
            placedOnSecondScreen = true;
          }
        }
      }
    } catch {
      // Permission denied or API unavailable — fall through to heuristic below
    }

    if (!placedOnSecondScreen) {
      // Heuristic: if the OS reports a multi-monitor extended desktop, place the
      // window just past the primary screen's right edge (lands on screen 2).
      const extended = (window.screen as any).isExtended === true;
      if (extended) {
        left = (scr.availLeft ?? 0) + scr.availWidth;
        top = scr.availTop ?? 0;
      } else {
        left = (scr.availLeft ?? 0) + Math.max(0, scr.availWidth - width);
        top = scr.availTop ?? 0;
      }
    }

    const stageUrl = `${window.location.origin}/?view=stage&room=${encodeURIComponent(roomId)}&fs=1`;

    const windowFeatures = [
      `width=${width}`,
      `height=${height}`,
      `left=${Math.max(-32000, Math.min(left, 32000))}`,
      `top=${Math.max(-32000, Math.min(top, 32000))}`,
      `menubar=no`,
      `toolbar=no`,
      `location=no`,
      `status=no`,
      `resizable=yes`,
      `scrollbars=no`,
    ].join(',');

    const newWindow = window.open(stageUrl, `SanctuaryStage_${roomId}`, windowFeatures);

    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
      // Fallback if popup is blocked or window fails to open
      window.open(stageUrl, '_blank');
    } else {
      stageWindowRef.current = newWindow;
      setIsStageWindowOpen(true);

      // Installed PWAs (standalone display mode) IGNORE window.open position/size
      // features — Chrome places the new app window wherever it likes. Force the
      // computed second-monitor placement after the fact. moveTo/resizeTo are
      // permitted cross-window here because the target is same-origin and we are
      // still inside the user-gesture call stack.
      // A short retry handles the PWA window finishing its async creation.
      let attempts = 0;
      const placeTimer = setInterval(() => {
        attempts += 1;
        try {
          if (newWindow.closed) {
            clearInterval(placeTimer);
            return;
          }
          // Move first (some engines reset size on move), then size.
          newWindow.moveTo(left, top);
          newWindow.resizeTo(width, height);
          // Verify placement landed; stop retrying once it sticks.
          if (attempts >= 1 && Math.abs(newWindow.screenX - left) <= 8 && Math.abs(newWindow.screenY - top) <= 8) {
            clearInterval(placeTimer);
          }
        } catch {
          clearInterval(placeTimer);
        }
        if (attempts >= 10) clearInterval(placeTimer);
      }, 150);
    }
  }, [roomId]);

  // Reference so the toggle can always reach the latest open logic
  const handleOpenStageScreenRef = useRef<(() => void | Promise<void>) | null>(null);
  handleOpenStageScreenRef.current = handleOpenStageScreen;

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
          setIsShareModalOpen(true);
        }
      }
      // 'T' / 't': Theme Modal
      else if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        setIsThemeModalOpen(true);
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
    speaker?: string
  ) => {
    setDuration(totalSeconds, title, speaker);
    if (title === undefined || speaker === undefined) {
        // If no title/speaker provided, just use the duration
        // (Logic handled by onSetDuration inside useTimerSync)
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
        onToggleStageScreen={handleToggleStageScreen}
        isStageWindowOpen={isStageWindowOpen}
        onOpenNdiModal={() => setIsNdiModalOpen(true)}
        onOpenChurchLogoModal={() => setIsChurchLogoModalOpen(true)}
        onOpenInteroperabilityModal={() => setIsInteroperabilityModalOpen(true)}
        onOpenShareModal={() => setIsShareModalOpen(true)}
        onOpenThemeModal={() => setIsThemeModalOpen(true)}
        onOpenQuickSetup={() => setIsQuickEditorOpen(true)}
        connected={connected}
        roomId={roomId}
        churchLogo={state.churchLogo}
        onLogout={logout}
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
          onSetThresholds={setThresholds}
          onSetTitleAndSpeaker={setTitleAndSpeaker}
          onOpenShareModal={() => setIsShareModalOpen(true)}
          onOpenThemeModal={() => setIsThemeModalOpen(true)}
          onOpenQuickSetup={() => setIsQuickEditorOpen(true)}
          onOpenNdiModal={() => setIsNdiModalOpen(true)}
          onOpenChurchLogoModal={() => setIsChurchLogoModalOpen(true)}
          onOpenInteroperabilityModal={() => setIsInteroperabilityModalOpen(true)}
          onToggleStageScreen={handleToggleStageScreen}
          isStageWindowOpen={isStageWindowOpen}
          getSchedules={getSchedules}
          saveSchedule={saveSchedule}
          deleteSchedule={deleteSchedule}
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
