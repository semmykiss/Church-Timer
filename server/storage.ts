import { ServerTimerState, Schedule } from './types';

export interface RoomStorage {
  get(roomId: string): ServerTimerState | undefined;
  set(roomId: string, state: ServerTimerState): void;
  getAll(): Map<string, ServerTimerState>;
  
  getSchedules(roomId: string): Promise<Schedule[]>;
  saveSchedule(roomId: string, schedule: Omit<Schedule, 'id' | 'createdAt'>): Promise<Schedule>;
  updateSchedule(roomId: string, id: string, schedule: Partial<Schedule>): Promise<Schedule>;
  deleteSchedule(roomId: string, id: string): Promise<void>;
}

export class InMemoryStorage implements RoomStorage {
  private rooms = new Map<string, ServerTimerState>();
  private schedules = new Map<string, Map<string, Schedule>>();

  // --- Room Methods ---
  get(roomId: string): ServerTimerState | undefined {
    return this.rooms.get(roomId);
  }

  set(roomId: string, state: ServerTimerState): void {
    this.rooms.set(roomId, state);
  }

  getAll(): Map<string, ServerTimerState> {
    return this.rooms;
  }

  // --- Schedule Methods ---
  async getSchedules(roomId: string): Promise<Schedule[]> {
    const roomSchedules = this.schedules.get(roomId);
    if (!roomSchedules) return [];
    return Array.from(roomSchedules.values()).sort((a, b) => b.createdAt - a.createdAt);
  }

  async saveSchedule(roomId: string, scheduleData: Omit<Schedule, 'id' | 'createdAt'>): Promise<Schedule> {
    if (!this.schedules.has(roomId)) {
      this.schedules.set(roomId, new Map());
    }
    
    const newSchedule: Schedule = {
      ...scheduleData,
      id: `sched-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: Date.now(),
    };

    this.schedules.get(roomId)!.set(newSchedule.id, newSchedule);
    return newSchedule;
  }

  async updateSchedule(roomId: string, id: string, scheduleUpdate: Partial<Schedule>): Promise<Schedule> {
    const roomSchedules = this.schedules.get(roomId);
    if (!roomSchedules || !roomSchedules.has(id)) {
      throw new Error('Schedule not found');
    }

    const existing = roomSchedules.get(id)!;
    const updated = { ...existing, ...scheduleUpdate };
    roomSchedules.set(id, updated);
    return updated;
  }

  async deleteSchedule(roomId: string, id: string): Promise<void> {
    const roomSchedules = this.schedules.get(roomId);
    if (roomSchedules) {
      roomSchedules.delete(id);
    }
  }
}
