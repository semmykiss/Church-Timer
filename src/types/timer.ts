export interface StageMessage {
  id: string;
  text: string;
  active: boolean;
  flash: boolean;
  createdAt: number;
}

export interface ChurchPreset {
  id: string;
  title: string;
  speaker?: string;
  durationMinutes: number;
  durationSeconds?: number;
  category: 'worship' | 'word' | 'prayer' | 'announcements' | 'offering' | 'custom';
}

export interface ChurchServiceTemplate {
  id: string;
  name: string;
  description: string;
  items: ChurchPreset[];
}

export interface TimerState {
  roomId: string;
  title: string;
  speaker: string;
  totalDurationSeconds: number;
  remainingSeconds: number;
  isRunning: boolean;
  endsAt: number | null; // epoch timestamp ms
  lastUpdatedAt: number; // epoch timestamp ms
  stageMessage: StageMessage | null;
  isBlackout: boolean;
  overtimeEnabled: boolean;
  soundAlertsEnabled: boolean;
  clockModeEnabled: boolean; // if true when stopped, shows real-time clock
  version: number;
}

export type TimerAction =
  | { type: 'START' }
  | { type: 'PAUSE' }
  | { type: 'RESET' }
  | { type: 'SET_DURATION'; totalSeconds: number; title?: string; speaker?: string }
  | { type: 'ADJUST_TIME'; deltaSeconds: number }
  | { type: 'SET_TITLE'; title: string; speaker?: string }
  | { type: 'SEND_STAGE_MESSAGE'; text: string; flash?: boolean }
  | { type: 'CLEAR_STAGE_MESSAGE' }
  | { type: 'TOGGLE_BLACKOUT'; isBlackout?: boolean }
  | { type: 'TOGGLE_SOUND'; enabled?: boolean }
  | { type: 'TOGGLE_OVERTIME'; enabled?: boolean }
  | { type: 'LOAD_PRESET'; preset: ChurchPreset };

export type TimerColorStatus = 'green' | 'amber' | 'red' | 'time-up';

export function getTimerColorStatus(remainingSeconds: number): TimerColorStatus {
  if (remainingSeconds <= 0) {
    return 'time-up';
  }
  if (remainingSeconds <= 30) {
    return 'red';
  }
  if (remainingSeconds <= 60) {
    return 'amber';
  }
  return 'green';
}
