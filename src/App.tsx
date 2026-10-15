import { useState, useEffect } from 'react';
import { useTimerSync } from './hooks/useTimerSync';
import { StageDisplay } from './components/StageDisplay';
import { Controller } from './components/Controller';
import { Header } from './components/Header';
import { ShareModal } from './components/ShareModal';
import { ThemeModal } from './components/ThemeModal';

export default function App() {
  // Parse query params for room and view mode
  const [currentView, setCurrentView] = useState<'controller' | 'stage'>('controller');
  const [roomId, setRoomId] = useState<string>('main');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const viewParam = params.get('view') || params.get('mode');
      const roomParam = params.get('room') || 'main';

      setRoomId(roomParam);

      if (viewParam === 'stage') {
        setCurrentView('stage');
      }
    }
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
  } = useTimerSync(roomId);

  const handleOpenStageScreen = () => {
    const width = 1280;
    const height = 720;
    const left = window.screen.width ? window.screen.width : 200;
    const stageUrl = `${window.location.origin}/?view=stage&room=${roomId}`;
    window.open(
      stageUrl,
      `SanctuaryStage_${roomId}`,
      `width=${width},height=${height},left=${left},top=0,menubar=no,toolbar=no,location=no,status=no`
    );
  };

  // If pure stage display mode is requested (e.g. via direct stage URL or popup)
  if (currentView === 'stage') {
    return (
      <StageDisplay
        state={state}
        connected={connected}
        onAdjustTime={adjustTime}
        isStandalone={true}
      />
    );
  }

  // Otherwise render Director Console
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Header
        currentView={currentView}
        onSelectView={setCurrentView}
        onOpenStageScreen={handleOpenStageScreen}
        onOpenShareModal={() => setIsShareModalOpen(true)}
        onOpenThemeModal={() => setIsThemeModalOpen(true)}
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
        />
      </main>

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
    </div>
  );
}
