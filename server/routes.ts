import { Request, Response, NextFunction, Router } from 'express';
import {
  ServerTimerState,
  RoomAction,
  Schedule
} from './types';
import { RoomManager } from './roomManager';
import { recommendedThresholds } from './config';

export function createRouter(roomManager: RoomManager): Router {
  const router = Router();

  // Security Middleware: Check for API Key in headers
  const authenticateController = (req: Request, res: Response, next: NextFunction) => {
    const apiKey = req.headers['x-api-key'];
    const validApiKey = process.env.CONTROLLER_API_KEY || 'default-secret-key';

    // Protect POST /action and Schedule management routes
    const isControllerAction = req.method === 'POST' && 
      (req.path.includes('/action') || req.path.includes('/schedules'));

    if (isControllerAction) {
      if (!apiKey || apiKey !== validApiKey) {
        return res.status(401).json({ error: 'Unauthorized: Invalid or missing API Key' });
      }
    }
    next();
  };

  router.use(authenticateController);

  // --- Timer API Endpoints ---

  router.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', roomsCount: roomManager.getAllRooms().size });
  });

  router.get('/rooms/:roomId/state', (req: Request, res: Response) => {
    const roomId = (req.params.roomId || 'main').toLowerCase();
    const room = roomManager.getOrCreateRoom(roomId);
    res.json(roomManager.getSanitizedState(room));
  });

  router.post('/rooms/:roomId/action', (req: Request, res: Response) => {
    const roomId = (req.params.roomId || 'main').toLowerCase();
    const room = roomManager.getOrCreateRoom(roomId);
    const action: RoomAction = req.body;
    const now = Date.now();

    try {
      switch (action.type) {
        case 'START': {
          if (!room.isRunning) {
            room.isRunning = true;
            room.endsAt = now + room.remainingSeconds * 1000;
            room.lastUpdatedAt = now;
            room.version++;
          }
          break;
        }
        case 'PAUSE': {
          if (room.isRunning) {
            room.remainingSeconds = roomManager.calculateCurrentRemaining(room);
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
          // Auto-scale warning thresholds to the new session length
          const recommended = recommendedThresholds(total);
          room.themeConfig = { ...room.themeConfig, ...recommended };
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
          const current = roomManager.calculateCurrentRemaining(room);
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
            // Auto-scale warning thresholds to the preset length
            room.themeConfig = {
              ...room.themeConfig,
              ...recommendedThresholds(room.totalDurationSeconds),
            };
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
        case 'UPDATE_THEME': {
          if (action.themeConfig && typeof action.themeConfig === 'object') {
            room.themeConfig = {
              ...room.themeConfig,
              ...action.themeConfig,
            };
            room.lastUpdatedAt = now;
            room.version++;
          }
          break;
        }
        case 'SET_THRESHOLDS': {
          const w1 = parseInt(action.warning1Seconds, 10);
          const w2 = parseInt(action.warning2Seconds, 10);
          if (w1 > 0 && w2 > 0 && w1 > w2) {
            room.themeConfig = {
              ...room.themeConfig,
              warning1Seconds: w1,
              warning2Seconds: w2,
            };
            room.lastUpdatedAt = now;
            room.version++;
          }
          break;
        }
        case 'UPDATE_CHURCH_LOGO': {
          if (action.logo && typeof action.logo === 'object') {
            room.churchLogo = {
              ...room.churchLogo,
              ...action.logo,
            };
            room.lastUpdatedAt = now;
            room.version++;
          }
          break;
        }
        case 'UPDATE_NDI_CONFIG': {
          if (action.ndi && typeof action.ndi === 'object') {
            room.ndiConfig = {
              ...room.ndiConfig,
              ...action.ndi,
            };
            room.lastUpdatedAt = now;
            room.version++;
          }
          break;
        }
        case 'IMPORT_STATE': {
          if (action.state && typeof action.state === 'object') {
            const s = action.state;
            if (s.title) room.title = String(s.title);
            if (s.speaker !== undefined) room.speaker = String(s.speaker);
            if (s.totalDurationSeconds) room.totalDurationSeconds = Number(s.totalDurationSeconds);
            if (s.remainingSeconds !== undefined) room.remainingSeconds = Number(s.remainingSeconds);
            if (s.overtimeEnabled !== undefined) room.overtimeEnabled = Boolean(s.overtimeEnabled);
            if (s.soundAlertsEnabled !== undefined) room.soundAlertsEnabled = Boolean(s.soundAlertsEnabled);
            if (s.themeConfig) room.themeConfig = { ...room.themeConfig, ...s.themeConfig };
            if (s.churchLogo) room.churchLogo = { ...room.churchLogo, ...s.churchLogo };
            if (s.ndiConfig) room.ndiConfig = { ...room.ndiConfig, ...s.ndiConfig };
            room.lastUpdatedAt = now;
            room.version++;
          }
          break;
        }
        default:
          return res.status(400).json({ error: `Unknown action type: ${action.type}` });
      }

      roomManager.broadcastRoomState(roomId);
      res.json(roomManager.getSanitizedState(room));
    } catch (err) {
      console.error('Error processing action:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // --- Schedule API Endpoints ---

  router.get('/rooms/:roomId/schedules', async (req, res) => {
    const roomId = (req.params.roomId || 'main').toLowerCase();
    try {
      const schedules = await roomManager.getStorage().getSchedules(roomId);
      res.json(schedules);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch schedules' });
    }
  });

  router.post('/rooms/:roomId/schedules', async (req, res) => {
    const roomId = (req.params.roomId || 'main').toLowerCase();
    try {
      const schedule = await roomManager.getStorage().saveSchedule(roomId, req.body);
      res.status(201).json(schedule);
    } catch (err) {
      res.status(400).json({ error: 'Failed to save schedule' });
    }
  });

  router.delete('/rooms/:roomId/schedules/:id', async (req, res) => {
    const roomId = (req.params.roomId || 'main').toLowerCase();
    const { id } = req.params;
    try {
      await roomManager.getStorage().deleteSchedule(roomId, id);
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ error: 'Failed to delete schedule' });
    }
  });

  // --- SSE ---

  router.get('/rooms/:roomId/events', (req: Request, res: Response) => {
    const roomId = (req.params.roomId || 'main').toLowerCase();
    const room = roomManager.getOrCreateRoom(roomId);

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no',
      Connection: 'keep-alive',
    });

    res.write(`data: ${JSON.stringify(roomManager.getSanitizedState(room))}\n\n`);

    const keepalive = setInterval(() => {
      try {
        res.write(': keepalive\n\n');
      } catch {
        clearInterval(keepalive);
      }
    }, 15000);

    roomManager.addSseClient(roomId, res);

    req.on('close', () => {
      clearInterval(keepalive);
      roomManager.removeSseClient(roomId, res);
    });
  });

  // --- Friendly URL Redirects ---

  router.get(['/stage', '/stage/', '/stage/:roomId', '/display', '/display/', '/display/:roomId'], (req: Request, res: Response) => {
    const targetRoom = req.params.roomId || (req.query.room as string) || 'main';
    res.redirect(`/?view=stage&room=${encodeURIComponent(targetRoom)}`);
  });

  router.get(['/ndi', '/ndi/', '/ndi/:roomId'], (req: Request, res: Response) => {
    const targetRoom = req.params.roomId || (req.query.room as string) || 'main';
    const layout = req.query.layout || 'lower-third';
    const bg = req.query.bg || 'transparent';
    res.redirect(`/?view=ndi&room=${encodeURIComponent(targetRoom)}&layout=${encodeURIComponent(layout as string)}&bg=${encodeURIComponent(bg as string)}`);
  });

  return router;
}
