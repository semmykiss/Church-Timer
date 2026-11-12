import { useState, useEffect, useRef, useCallback } from 'react';
import {
  TimerState,
  TimerAction,
  getTimerColorStatus,
  TimerColorStatus,
  ChurchPreset,
  TimerThemeConfig,
  DEFAULT_THEME_CONFIG,
  ChurchLogoConfig,
  DEFAULT_CHURCH_LOGO,
  NdiConfig,
  DEFAULT_NDI_CONFIG,
  recommendedThresholds,
  Schedule
} from '../types/timer';
import { playChime } from '../utils/audio';

export interface TimerSyncReturn {
  state: TimerState;
  connected: boolean;
  colorStatus: TimerColorStatus;
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  setDuration: (totalSeconds: number, title?: string, speaker?: string) => void;
  adjustTime: (deltaSeconds: number) => void;
  loadPreset: (preset: ChurchPreset | Schedule) => void;
  sendStageMessage: (text: string, flash: boolean) => void;
  clearStageMessage: () => void;
  toggleBlackout: (isBlackout?: boolean) => void;
  toggleSound: (enabled?: boolean) => void;
  toggleOvertime: (enabled?: boolean) => void;
  setTitleAndSpeaker: (title: string, speaker?: string) => void;
  updateTheme: (themeConfig: Partial<TimerThemeConfig>) => void;
  updateChurchLogo: (logo: Partial<ChurchLogoConfig>) => void;
  updateNdiConfig: (ndi: Partial<NdiConfig>) => void;
  setThresholds: (warning1Seconds: number, warning2Seconds: number) => void;
  importState: (stateToImport: Partial<TimerState>) => void;
  getSchedules: () => Promise<Schedule[]>;
  saveSchedule: (schedule: Omit<Schedule, 'id' | 'createdAt'>) => Promise<Schedule>;
  deleteSchedule: (id: string) => Promise<void>;
}

// Must match the server's CONTROLLER_API_KEY (env on both ends; shared default for local dev).
// Without this header the server rejects every controller action with 401 and the UI
// silently degrades to local-only state — stage displays on other devices would see nothing.
const CONTROLLER_API_KEY =
  (import.meta.env?.VITE_CONTROLLER_API_KEY as string | undefined) || 'default-secret-key';

export function useTimerSync(roomId: string = 'main'): TimerSyncReturn {
  const normalizedRoomId = (roomId || 'main').toLowerCase();
  const [state, setState] = useState<TimerState>({
    roomId: normalizedRoomId,
    title: 'The Sermon / Word',
    speaker: 'Senior Pastor',
    totalDurationSeconds: 2100,
    remainingSeconds: 2100,
    isRunning: false,
    endsAt: null,
    lastUpdatedAt: Date.now(),
    stageMessage: null,
    isBlackout: false,
    overtimeEnabled: true,
    soundAlertsEnabled: true,
    clockModeEnabled: true,
    themeConfig: { ...DEFAULT_THEME_CONFIG },
    churchLogo: { ...DEFAULT_CHURCH_LOGO },
    ndiConfig: { ...DEFAULT_NDI_CONFIG },
    version: 1,
  });
  
  const [connected, setConnected] = useState(false);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);
  const chimeTrackerRef = useRef<{ amber: boolean; red: boolean; timeup: boolean }>({
    amber: false,
    red: false,
    timeup: false,
  });

  // Calculate local remaining seconds precisely against endsAt
  const computeRemaining = useCallback((currentState: TimerState): number => {
    if (!currentState.isRunning || !currentState.endsAt) {
      return currentState.remainingSeconds;
    }
    const diff = Math.round((currentState.endsAt - Date.now()) / 1000);
    return diff;
  }, []);

  // Handle BroadcastChannel for instant multi-window/second-screen communication on the same device
  useEffect(() => {
    if (typeof window === 'undefined' || !window.BroadcastChannel) return;

    const bc = new BroadcastChannel(`church_timer_${normalizedRoomId}`);
    broadcastChannelRef.current = bc;

    bc.onmessage = (event) => {
      if (event.data && typeof event.data === 'object') {
        const incomingState = event.data as TimerState;
        setState((prev) => {
          if (incomingState.version >= prev.version) {
            return incomingState;
          }
          return prev;
        });
      }
    };

    return () => {
      bc.close();
      broadcastChannelRef.current = null;
    };
  }, [normalizedRoomId]);

  // Connect to SSE for real-time online syncing across devices and URLs
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

    function connect() {
      try {
        eventSource = new EventSource(`/api/rooms/${normalizedRoomId}/events`);

        eventSource.onopen = () => {
          setConnected(true);
        };

        eventSource.onmessage = (event) => {
          try {
            const serverState = JSON.parse(event.data) as TimerState;
            setState((prev) => {
              // Only update if server state has fresh timestamp or newer version
              if (serverState.version >= prev.version || serverState.lastUpdatedAt >= prev.lastUpdatedAt) {
                return serverState;
              }
              return prev;
            });
          } catch (err) {
            console.error('Failed to parse SSE timer event:', err);
          }
        };

        eventSource.onerror = () => {
          setConnected(false);
          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }
          reconnectTimeout = setTimeout(connect, 3000);
        };
      } catch (err) {
        console.warn('SSE connection failed to initialize:', err);
        reconnectTimeout = setTimeout(connect, 3000);
      }
    }

    // Immediate initial REST fetch for zero-delay hydration
    const fetchFreshState = async () => {
      try {
        const res = await fetch(`/api/rooms/${normalizedRoomId}/state`);
        if (res.ok) {
          const data = (await res.json()) as TimerState;
          setState((prev) => {
            if (data.version >= prev.version || data.lastUpdatedAt >= prev.lastUpdatedAt) {
              return data;
            }
            return prev;
          });
          setConnected(true);
        }
      } catch {
        // network issue
      }
    };

    fetchFreshState();
    const pollInterval = setInterval(fetchFreshState, 2500);

    connect();

    return () => {
      clearInterval(pollInterval);
      if (eventSource) {
        eventSource.close();
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, [normalizedRoomId]);

  // High precision client-side tick loop
  useEffect(() => {
    if (!state.isRunning) {
      chimeTrackerRef.current = { amber: false, red: false, timeup: false };
      return;
    }

    const interval = setInterval(() => {
      setState((prev) => {
        if (!prev.isRunning || !prev.endsAt) return prev;
        const currentRemaining = Math.round((prev.endsAt - Date.now()) / 1000);

        if (prev.soundAlertsEnabled) {
          const w1 = prev.themeConfig?.warning1Seconds ?? 60;
          const w2 = prev.themeConfig?.warning2Seconds ?? 30;
          if (currentRemaining <= w1 && currentRemaining > w2 && !chimeTrackerRef.current.amber) {
            playChime('amber');
            chimeTrackerRef.current.amber = true;
          }
          if (currentRemaining <= w2 && currentRemaining > 0 && !chimeTrackerRef.current.red) {
            playChime('red');
            chimeTrackerRef.current.red = true;
          }
          if (currentRemaining <= 0 && !chimeTrackerRef.current.timeup) {
            playChime('timeup');
            chimeTrackerRef.current.timeup = true;
          }
        }

        return {
          ...prev,
          remainingSeconds: currentRemaining,
        };
      });
    }, 250);

    return () => clearInterval(interval);
  }, [state.isRunning, state.endsAt, state.soundAlertsEnabled]);

  // Dispatch action to server and local BroadcastChannel
  const dispatchAction = useCallback(
    async (action: TimerAction) => {
      const now = Date.now();
      setState((prev) => {
        let updated = { ...prev, lastUpdatedAt: now, version: prev.version + 1 };

        switch (action.type) {
          case 'START':
            if (!prev.isRunning) {
              const currentRem = computeRemaining(prev);
              updated.isRunning = true;
              updated.endsAt = now + currentRem * 1000;
              updated.remainingSeconds = currentRem;
            }
            break;
          case 'PAUSE':
            if (prev.isRunning) {
              const currentRem = computeRemaining(prev);
              updated.isRunning = false;
              updated.endsAt = null;
              updated.remainingSeconds = currentRem;
            }
            break;
          case 'RESET':
            updated.isRunning = false;
            updated.endsAt = null;
            updated.remainingSeconds = prev.totalDurationSeconds;
            updated.stageMessage = null;
            break;
          case 'SET_DURATION':
            const total = Math.max(1, action.totalSeconds);
            updated.totalDurationSeconds = total;
            updated.remainingSeconds = total;
            // Auto-scale warning thresholds to the new session length
            updated.themeConfig = { ...prev.themeConfig, ...recommendedThresholds(total) };
            if (prev.isRunning) {
              updated.endsAt = now + total * 1000;
            }
            if (action.title) updated.title = action.title;
            if (action.speaker !== undefined) updated.speaker = action.speaker;
            break;
          case 'ADJUST_TIME':
            const currentRem = computeRemaining(prev);
            const adjusted = currentRem + action.deltaSeconds;
            updated.remainingSeconds = adjusted;
            if (prev.isRunning) {
              updated.endsAt = (prev.endsAt || now) + action.deltaSeconds * 1000;
            }
            break;
          case 'SET_TITLE':
            if (action.title) updated.title = action.title;
            if (action.speaker !== undefined) updated.speaker = action.speaker;
            break;
          case 'LOAD_PRESET': {
            const p = action.preset;
            const totalSec = (p.durationMinutes || 0) * 60 + (p.durationSeconds || 0);
            const totalDur = totalSec > 0 ? totalSec : 300;
            updated.totalDurationSeconds = totalDur;
            updated.remainingSeconds = totalDur;
            // Auto-scale warning thresholds to the preset length
            updated.themeConfig = { ...prev.themeConfig, ...recommendedThresholds(totalDur) };
            updated.title = p.title;
            updated.speaker = p.speaker || '';
            updated.isRunning = false;
            updated.endsAt = null;
            updated.stageMessage = null;
            break;
          }
          case 'SEND_STAGE_MESSAGE':
            updated.stageMessage = {
              id: `msg-${Date.now()}`,
              text: action.text,
              active: true,
              flash: Boolean(action.flash),
              createdAt: Date.now(),
            };
            break;
          case 'CLEAR_STAGE_MESSAGE':
            updated.stageMessage = null;
            break;
          case 'TOGGLE_BLACKOUT':
            updated.isBlackout = action.isBlackout !== undefined ? action.isBlackout : !prev.isBlackout;
            break;
          case 'TOGGLE_SOUND':
            updated.soundAlertsEnabled = action.enabled !== undefined ? action.enabled : !prev.soundAlertsEnabled;
            break;
          case 'TOGGLE_OVERTIME':
            updated.overtimeEnabled = action.enabled !== undefined ? action.enabled : !prev.overtimeEnabled;
            break;
          case 'UPDATE_THEME':
            updated.themeConfig = {
              ...prev.themeConfig,
              ...action.themeConfig,
            };
            break;
          case 'UPDATE_CHURCH_LOGO':
            updated.churchLogo = {
              ...prev.churchLogo,
              ...action.logo,
            };
            break;
          case 'UPDATE_NDI_CONFIG':
            updated.ndiConfig = {
              ...prev.ndiConfig,
              ...action.ndi,
            };
            break;
          case 'SET_THRESHOLDS':
            if (action.warning1Seconds > 0 && action.warning2Seconds > 0 && action.warning1Seconds > action.warning2Seconds) {
              updated.themeConfig = {
                ...prev.themeConfig,
                warning1Seconds: action.warning1Seconds,
                warning2Seconds: action.warning2Seconds,
              };
            }
            break;
          case 'IMPORT_STATE':
            updated = {
              ...prev,
              ...action.state,
              lastUpdatedAt: now,
              version: prev.version + 1,
            };
            break;
        }

        if (broadcastChannelRef.current) {
          try {
            broadcastChannelRef.current.postMessage(updated);
          } catch {}
        }
        return updated;
      });

      try {
      const response = await fetch(`/api/rooms/${normalizedRoomId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': CONTROLLER_API_KEY },
        body: JSON.stringify(action),
      });
        if (response.ok) {
          const serverState = await response.json();
          setState(serverState);
        }
      } catch (err) {
        console.warn('Network action failed, running locally:', err);
      }
    },
    [normalizedRoomId, computeRemaining]
  );

  const startTimer = useCallback(() => dispatchAction({ type: 'START' }), [dispatchAction]);
  const pauseTimer = useCallback(() => dispatchAction({ type: 'PAUSE' }), [dispatchAction]);
  const resetTimer = useCallback(() => dispatchAction({ type: 'RESET' }), [dispatchAction]);
  const setDuration = useCallback(
    (totalSeconds: number, title?: string, speaker?: string) =>
      dispatchAction({ type: 'SET_DURATION', totalSeconds, title, speaker }),
    [dispatchAction]
  );
  const adjustTime = useCallback((deltaSeconds: number) => dispatchAction({ type: 'ADJUST_TIME', deltaSeconds }), [dispatchAction]);
  const loadPreset = useCallback((preset: ChurchPreset | Schedule) => dispatchAction({ type: 'LOAD_PRESET', preset }), [dispatchAction]);
  const sendStageMessage = useCallback(
    (text: string, flash: boolean = false) => dispatchAction({ type: 'SEND_STAGE_MESSAGE', text, flash }),
    [dispatchAction]
  );
  const clearStageMessage = useCallback(() => dispatchAction({ type: 'CLEAR_STAGE_MESSAGE' }), [dispatchAction]);
  const setThresholds = useCallback(
    (warning1Seconds: number, warning2Seconds: number) =>
      dispatchAction({ type: 'SET_THRESHOLDS', warning1Seconds, warning2Seconds }),
    [dispatchAction]
  );
  const toggleBlackout = useCallback(
    (isBlackout?: boolean) => dispatchAction({ type: 'TOGGLE_BLACKOUT', isBlackout }),
    [dispatchAction]
  );
  const toggleSound = useCallback(
    (enabled?: boolean) => dispatchAction({ type: 'TOGGLE_SOUND', enabled }),
    [dispatchAction]
  );
  const toggleOvertime = useCallback(
    (enabled?: boolean) => dispatchAction({ type: 'TOGGLE_OVERTIME', enabled }),
    [dispatchAction]
  );
  const setTitleAndSpeaker = useCallback(
    (title: string, speaker?: string) => dispatchAction({ type: 'SET_TITLE', title, speaker }),
    [dispatchAction]
  );
  const updateTheme = useCallback(
    (themeConfig: Partial<TimerThemeConfig>) => dispatchAction({ type: 'UPDATE_THEME', themeConfig }),
    [dispatchAction]
  );
  const updateChurchLogo = useCallback(
    (logo: Partial<ChurchLogoConfig>) => dispatchAction({ type: 'UPDATE_CHURCH_LOGO', logo }),
    [dispatchAction]
  );
  const updateNdiConfig = useCallback(
    (ndi: Partial<NdiConfig>) => dispatchAction({ type: 'UPDATE_NDI_CONFIG', ndi }),
    [dispatchAction]
  );
  const importState = useCallback(
    (stateToImport: Partial<TimerState>) => dispatchAction({ type: 'IMPORT_STATE', state: stateToImport }),
    [dispatchAction]
  );

  // Schedule management methods
  const getSchedules = async (): Promise<Schedule[]> => {
    try {
      const res = await fetch(`/api/rooms/${normalizedRoomId}/schedules`);
      if (res.ok) return await res.json();
      return [];
    } catch {
      return [];
    }
  };

  const saveSchedule = async (schedule: Omit<Schedule, 'id' | 'createdAt'>): Promise<Schedule> => {
    const res = await fetch(`/api/rooms/${normalizedRoomId}/schedules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': CONTROLLER_API_KEY },
      body: JSON.stringify(schedule),
    });
    if (!res.ok) throw new Error('Failed to save schedule');
    return res.json();
  };

  const deleteSchedule = async (id: string): Promise<void> => {
    const res = await fetch(`/api/rooms/${normalizedRoomId}/schedules/${id}`, {
      method: 'DELETE',
      headers: { 'x-api-key': CONTROLLER_API_KEY },
    });
    if (!res.ok) throw new Error('Failed to delete schedule');
  };

  const colorStatus: TimerColorStatus = getTimerColorStatus(
    state.remainingSeconds,
    state.themeConfig?.warning1Seconds ?? 60,
    state.themeConfig?.warning2Seconds ?? 30
  );

  return {
    state,
    connected,
    colorStatus,
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
    setThresholds,
    importState,
    getSchedules,
    saveSchedule,
    deleteSchedule
  };
}

// Format seconds into MM:SS or HH:MM:SS
export function formatTimeDisplay(totalSeconds: number): { formatted: string; isNegative: boolean; hours: number; minutes: number; seconds: number } {
  const isNegative = totalSeconds < 0;
  const absSeconds = Math.abs(totalSeconds);
  const hours = Math.floor(absSeconds / 3600);
  const minutes = Math.floor((absSeconds % 3600) / 60);
  const seconds = absSeconds % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');

  let formatted = '';
  if (hours > 0) {
    formatted = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  } else {
    formatted = `${pad(minutes)}:${pad(seconds)}`;
  }

  if (isNegative) {
    formatted = `+${formatted}`; // overtime display: +01:23
  }

  return { formatted, isNegative, hours, minutes, seconds };
}
