import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface StageMessage {
  id: string;
  text: string;
  active: boolean;
  flash: boolean;
  createdAt: number;
}

interface ServerTimerState {
  roomId: string;
  title: string;
  speaker: string;
  totalDurationSeconds: number;
  remainingSeconds: number;
  isRunning: boolean;
  endsAt: number | null; // target timestamp in ms
  lastUpdatedAt: number;
  stageMessage: StageMessage | null;
  isBlackout: boolean;
  overtimeEnabled: boolean;
  soundAlertsEnabled: boolean;
  clockModeEnabled: boolean;
  version: number;
}

// In-memory rooms
const rooms = new Map<string, ServerTimerState>();
const sseClients = new Map<string, Set<Response>>();

function getOrCreateRoom(roomId: string): ServerTimerState {
  const normalizedId = roomId.trim().toLowerCase() || 'main';
  let room = rooms.get(normalizedId);
  if (!room) {
    room = {
      roomId: normalizedId,
      title: 'The Sermon / Word',
      speaker: 'Senior Pastor',
      totalDurationSeconds: 2100, // 35 minutes default
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
    rooms.set(normalizedId, room);
  }
  return room;
}

function calculateCurrentRemaining(state: ServerTimerState): number {
  if (!state.isRunning || !state.endsAt) {
    return state.remainingSeconds;
  }
  const now = Date.now();
  const diffSec = Math.round((state.endsAt - now) / 1000);
  return diffSec;
}

function getSanitizedState(state: ServerTimerState): ServerTimerState {
  const currentRemaining = calculateCurrentRemaining(state);
  return {
    ...state,
    remainingSeconds: currentRemaining,
  };
}

function broadcastRoomState(roomId: string) {
  const state = rooms.get(roomId);
  if (!state) return;
  const clients = sseClients.get(roomId);
  if (!clients || clients.size === 0) return;

  const payload = JSON.stringify(getSanitizedState(state));
  const sseData = `data: ${payload}\n\n`;

  for (const client of clients) {
    try {
      client.write(sseData);
    } catch {
      clients.delete(client);
    }
  }
}

// Global 1-second tick loop to keep all running rooms in sync
setInterval(() => {
  for (const [roomId, room] of rooms.entries()) {
    if (room.isRunning) {
      room.remainingSeconds = calculateCurrentRemaining(room);
      broadcastRoomState(roomId);
    }
  }
}, 1000);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const isProduction = process.env.NODE_ENV === 'production';

  app.use(express.json());

  // API endpoints
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', uptime: process.uptime(), roomsCount: rooms.size });
  });

  // Get current state
  app.get('/api/rooms/:roomId/state', (req: Request, res: Response) => {
    const roomId = (req.params.roomId || 'main').toLowerCase();
    const room = getOrCreateRoom(roomId);
    res.json(getSanitizedState(room));
  });

  // Execute timer action
  app.post('/api/rooms/:roomId/action', (req: Request, res: Response) => {
    const roomId = (req.params.roomId || 'main').toLowerCase();
    const room = getOrCreateRoom(roomId);
    const action = req.body;
    const now = Date.now();

    switch (action.type) {
      case 'START': {
        if (!room.isRunning) {
          room.isRunning = true;
          // Calculate endsAt based on remaining seconds
          room.endsAt = now + room.remainingSeconds * 1000;
          room.lastUpdatedAt = now;
          room.version++;
        }
        break;
      }
      case 'PAUSE': {
        if (room.isRunning) {
          room.remainingSeconds = calculateCurrentRemaining(room);
          room.isRunning = false;
          room.endsAt = null;
          room.lastUpdatedAt = now;
          room.version++;
        }
        break;
      }
      case 'RESET': {
        room.isRunning = false;
        room.endsAt = null;
        room.remainingSeconds = room.totalDurationSeconds;
        room.lastUpdatedAt = now;
        room.stageMessage = null;
        room.version++;
        break;
      }
      case 'SET_DURATION': {
        const total = Math.max(1, parseInt(action.totalSeconds, 10) || 60);
        room.totalDurationSeconds = total;
        room.remainingSeconds = total;
        if (room.isRunning) {
          room.endsAt = now + total * 1000;
        }
        if (action.title) room.title = String(action.title);
        if (action.speaker !== undefined) room.speaker = String(action.speaker);
        room.lastUpdatedAt = now;
        room.version++;
        break;
      }
      case 'ADJUST_TIME': {
        const delta = parseInt(action.deltaSeconds, 10) || 0;
        const current = calculateCurrentRemaining(room);
        const updated = current + delta;
        room.remainingSeconds = updated;
        if (room.isRunning) {
          room.endsAt = (room.endsAt || now) + delta * 1000;
        }
        room.lastUpdatedAt = now;
        room.version++;
        break;
      }
      case 'SET_TITLE': {
        if (action.title) room.title = String(action.title);
        if (action.speaker !== undefined) room.speaker = String(action.speaker);
        room.lastUpdatedAt = now;
        room.version++;
        break;
      }
      case 'LOAD_PRESET': {
        const p = action.preset;
        if (p) {
          const totalSec = (p.durationMinutes || 0) * 60 + (p.durationSeconds || 0);
          room.totalDurationSeconds = totalSec > 0 ? totalSec : 300;
          room.remainingSeconds = room.totalDurationSeconds;
          room.title = p.title || 'Church Service';
          room.speaker = p.speaker || '';
          room.isRunning = false;
          room.endsAt = null;
          room.stageMessage = null;
          room.lastUpdatedAt = now;
          room.version++;
        }
        break;
      }
      case 'SEND_STAGE_MESSAGE': {
        if (action.text) {
          room.stageMessage = {
            id: `msg-${Date.now()}`,
            text: String(action.text),
            active: true,
            flash: Boolean(action.flash),
            createdAt: Date.now(),
          };
          room.lastUpdatedAt = now;
          room.version++;
        }
        break;
      }
      case 'CLEAR_STAGE_MESSAGE': {
        room.stageMessage = null;
        room.lastUpdatedAt = now;
        room.version++;
        break;
      }
      case 'TOGGLE_BLACKOUT': {
        room.isBlackout = action.isBlackout !== undefined ? Boolean(action.isBlackout) : !room.isBlackout;
        room.lastUpdatedAt = now;
        room.version++;
        break;
      }
      case 'TOGGLE_SOUND': {
        room.soundAlertsEnabled = action.enabled !== undefined ? Boolean(action.enabled) : !room.soundAlertsEnabled;
        room.lastUpdatedAt = now;
        room.version++;
        break;
      }
      case 'TOGGLE_OVERTIME': {
        room.overtimeEnabled = action.enabled !== undefined ? Boolean(action.enabled) : !room.overtimeEnabled;
        room.lastUpdatedAt = now;
        room.version++;
        break;
      }
      default:
        return res.status(400).json({ error: 'Unknown action type' });
    }

    const updatedState = getSanitizedState(room);
    broadcastRoomState(roomId);
    res.json(updatedState);
  });

  // Server-Sent Events (SSE) for live, instant synchronization across monitors & remote URLs
  app.get('/api/rooms/:roomId/events', (req: Request, res: Response) => {
    const roomId = (req.params.roomId || 'main').toLowerCase();
    const room = getOrCreateRoom(roomId);

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    });

    // Send initial state immediately
    res.write(`data: ${JSON.stringify(getSanitizedState(room))}\n\n`);

    if (!sseClients.has(roomId)) {
      sseClients.set(roomId, new Set());
    }
    const clientSet = sseClients.get(roomId)!;
    clientSet.add(res);

    req.on('close', () => {
      clientSet.delete(res);
    });
  });

  // Mount Vite or static server
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Church Sanctuary Timer server active on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start church timer server:', err);
  process.exit(1);
});
