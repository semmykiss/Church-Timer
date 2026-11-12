import { Response } from 'express';
import { ServerTimerState } from './types';
import { 
  DEFAULT_THEME_CONFIG, 
  DEFAULT_CHURCH_LOGO, 
  DEFAULT_NDI_CONFIG 
} from './config';
import { RoomStorage } from './storage';

export class RoomManager {
  private storage: RoomStorage;
  private sseClients = new Map<string, Set<Response>>();

  constructor(storage: RoomStorage) {
    this.storage = storage;
  }

  // Expose storage for schedule management in routes
  public getStorage(): RoomStorage {
    return this.storage;
  }

  public getOrCreateRoom(roomId: string): ServerTimerState {
    const normalizedId = roomId.trim().toLowerCase() || 'main';
    let room = this.storage.get(normalizedId);
    
    if (!room) {
      room = {
        roomId: normalizedId,
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
      };
      this.storage.set(normalizedId, room);
    }
    return room;
  }

  public calculateCurrentRemaining(state: ServerTimerState): number {
    if (!state.isRunning || !state.endsAt) {
      return state.remainingSeconds;
    }
    const now = Date.now();
    const diffSec = Math.round((state.endsAt - now) / 1000);
    return diffSec;
  }

  public getSanitizedState(state: ServerTimerState): ServerTimerState {
    const currentRemaining = this.calculateCurrentRemaining(state);
    return {
      ...state,
      remainingSeconds: currentRemaining,
    };
  }

  public broadcastRoomState(roomId: string): void {
    const state = this.storage.get(roomId);
    if (!state) return;
    
    const clients = this.sseClients.get(roomId);
    if (!clients || clients.size === 0) return;

    const payload = JSON.stringify(this.getSanitizedState(state));
    const sseData = `data: ${payload}\n\n`;

    for (const client of clients) {
      try {
        client.write(sseData);
      } catch {
        clients.delete(client);
      }
    }
  }

  public addSseClient(roomId: string, res: Response): void {
    if (!this.sseClients.has(roomId)) {
      this.sseClients.set(roomId, new Set());
    }
    this.sseClients.get(roomId)!.add(res);
  }

  public removeSseClient(roomId: string, res: Response): void {
    const clients = this.sseClients.get(roomId);
    if (clients) {
      clients.delete(res);
      if (clients.size === 0) {
        this.sseClients.delete(roomId);
      }
    }
  }

  public startTickLoop(): void {
    setInterval(() => {
      for (const [roomId, room] of this.storage.getAll().entries()) {
        if (room.isRunning) {
          room.remainingSeconds = this.calculateCurrentRemaining(room);
          this.broadcastRoomState(roomId);
        }
      }
    }, 1000);
  }

  public getAllRooms(): Map<string, ServerTimerState> {
    return this.storage.getAll();
  }
}
