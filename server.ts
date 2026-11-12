import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { InMemoryStorage } from './server/storage';
import { RoomManager } from './server/roomManager';
import { createRouter } from './server/routes';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env so CONTROLLER_API_KEY / PORT / HMR_PORT work without shell env setup.
// (tsx does not auto-load .env; Vite handles it separately for VITE_* client vars.)
try {
  (process as any).loadEnvFile?.();
} catch {
  // No .env file present — fall back to shell environment / defaults
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  // Allow setting the Vite HMR/WebSocket port via environment variable to avoid EADDRINUSE conflicts
  const HMR_PORT = process.env.HMR_PORT ? parseInt(process.env.HMR_PORT, 10) : 24678;
  const isProduction = process.env.NODE_ENV === 'production';

  // Initialize modular components
  const storage = new InMemoryStorage();
  const roomManager = new RoomManager(storage);
  
  app.use(express.json());

  // Use the modular router
  app.use('/api', createRouter(roomManager));

  // Direct friendly URL routes for Stage Display
  app.get(['/stage', '/stage/', '/stage/:roomId', '/display', '/display/', '/display/:roomId'], (req: Request, res: Response) => {
    const targetRoom = req.params.roomId || (req.query.room as string) || 'main';
    res.redirect(`/?view=stage&room=${encodeURIComponent(targetRoom)}`);
  });

  // Direct friendly URL routes for NDI Video Output
  app.get(['/ndi', '/ndi/', '/ndi/:roomId'], (req: Request, res: Response) => {
    const targetRoom = req.params.roomId || (req.query.room as string) || 'main';
    const layout = req.query.layout || 'lower-third';
    const bg = req.query.bg || 'transparent';
    res.redirect(`/?view=ndi&room=${encodeURIComponent(targetRoom)}&layout=${encodeURIComponent(layout as string)}&bg=${encodeURIComponent(bg as string)}`);
  });

  // Mount Vite or static server
  if (!isProduction) {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: {
          port: HMR_PORT
        }
      },
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

  // Start the room tick loop
  roomManager.startTickLoop();

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Church Sanctuary Timer server active on http://0.0.0.0:${PORT} (HMR Port: ${HMR_PORT})`);
    if (!process.env.CONTROLLER_API_KEY) {
      console.warn(
        'WARNING: CONTROLLER_API_KEY is not set — using the built-in default key. ' +
        'Set a strong key in your environment (and a matching VITE_CONTROLLER_API_KEY for the console) before exposing this server beyond localhost.'
      );
    }
  });
}

startServer().catch((err) => {
  console.error('Failed to start church timer server:', err);
  process.exit(1);
});
