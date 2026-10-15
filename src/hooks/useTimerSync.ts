import { useState, useEffect, useRef, useCallback } from 'react';
import { TimerState, TimerAction, getTimerColorStatus, TimerColorStatus, ChurchPreset } from '../types/timer';
import { playChime } from '../utils/audio';

const DEFAULT_STATE: TimerState = {
  roomId: 'main',
  title: 'The Sermon / Word',
  speaker: 'Senior Pastor',
  totalDurationSeconds: 2100, // 35 min
  remainingSeconds: 2100,
  isRunning: false,
  endsAt: null,
  lastUpdatedAt: Date.now(),
  stageMessage: null,
  isBlackout: false,
  overtimeEnabled: true,
  soundAlertsEnabled: true,
  clockModeEnabled: true,
  version: 1,
};

export function useTimerSync(roomId: string = 'main') {
  const normalizedRoomId = (roomId || 'main').toLowerCase();
  const [state, setState] = useState<TimerState>(() => {
    // Try to load cached state from localStorage if available
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(`church_timer_state_${normalizedRoomId}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          return { ...DEFAULT_STATE, ...parsed, roomId: normalizedRoomId };
        }
      } catch {
        // fallback
      }
    }
    return { ...DEFAULT_STATE, roomId: normalizedRoomId };
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

  // Save to local storage on state change
  useEffect(() => {
    try {
      localStorage.setItem(`church_timer_state_${normalizedRoomId}`, JSON.stringify(state));
    } catch {
      // ignore
    }
  }, [state, normalizedRoomId]);

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
          // Exponential backoff or retry after 3 seconds
          reconnectTimeout = setTimeout(connect, 3000);
        };
      } catch (err) {
        console.warn('SSE not supported or connection error, relying on local sync:', err);
        setConnected(false);
      }
    }

    connect();

    return () => {
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
      // Reset sound triggers when stopped or reset
      chimeTrackerRef.current = { amber: false, red: false, timeup: false };
      return;
    }

    const interval = setInterval(() => {
      setState((prev) => {
        if (!prev.isRunning || !prev.endsAt) return prev;
        const currentRemaining = Math.round((prev.endsAt - Date.now()) / 1000);

        // Sound alert triggers
        if (prev.soundAlertsEnabled) {
          if (currentRemaining <= 60 && currentRemaining > 30 && !chimeTrackerRef.current.amber) {
            playChime('amber');
            chimeTrackerRef.current.amber = true;
          }
          if (currentRemaining <= 30 && currentRemaining > 0 && !chimeTrackerRef.current.red) {
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
    }, 250); // fast 250ms interval ensures accurate second transitions

    return () => clearInterval(interval);
  }, [state.isRunning, state.endsAt, state.soundAlertsEnabled]);

  // Dispatch action to server and local BroadcastChannel
  const dispatchAction = useCallback(
    async (action: TimerAction) => {
      // Optimistic local update
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
        }

        // Broadcast to local tabs/windows immediately
        if (broadcastChannelRef.current) {
          try {
            broadcastChannelRef.current.postMessage(updated);
          } catch {
            // ignore
          }
        }
        return updated;
      });

      // Send to server API
      try {
        const response = await fetch(`/api/rooms/${normalizedRoomId}/action`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
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
  const loadPreset = useCallback((preset: ChurchPreset) => dispatchAction({ type: 'LOAD_PRESET', preset }), [dispatchAction]);
  const sendStageMessage = useCallback(
    (text: string, flash: boolean = false) => dispatchAction({ type: 'SEND_STAGE_MESSAGE', text, flash }),
    [dispatchAction]
  );
  const clearStageMessage = useCallback(() => dispatchAction({ type: 'CLEAR_STAGE_MESSAGE' }), [dispatchAction]);
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

  const colorStatus: TimerColorStatus = getTimerColorStatus(state.remainingSeconds);

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
