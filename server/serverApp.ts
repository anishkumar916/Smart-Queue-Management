import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

import { connectDB, isConnectedToMongo } from './config/db';
import { initSocketIO } from './services/socketService';
import { seedDatabase } from './utils/seedData';

// Route imports
import authRoutes from './routes/authRoutes';
import tokenRoutes from './routes/tokenRoutes';
import queueRoutes from './routes/queueRoutes';
import organizationRoutes from './routes/organizationRoutes';
import branchRoutes from './routes/branchRoutes';
import serviceRoutes from './routes/serviceRoutes';
import counterRoutes from './routes/counterRoutes';
import adminRoutes from './routes/adminRoutes';
import notificationRoutes from './routes/notificationRoutes';
import { errorHandler } from './middleware/errorMiddleware';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Root project directory where package.json and index.html reside
const projectRoot = fs.existsSync(path.resolve(process.cwd(), 'index.html'))
  ? process.cwd()
  : fs.existsSync(path.resolve(__dirname, 'index.html'))
    ? __dirname
    : path.resolve(__dirname, '..');

export async function startServer() {
  const app = express();
  const server = http.createServer(app);

  // Setup Socket.IO
  const io = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
    }
  });

  initSocketIO(io);

  // Core Middlewares
  app.use(cors({
    origin: '*',
    credentials: true
  }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Connect Database & Seed
  await connectDB();
  await seedDatabase();

  // Mount API Endpoints
  app.use('/api/auth', authRoutes);
  app.use('/api/tokens', tokenRoutes);
  app.use('/api/queue', queueRoutes);
  app.use('/api/organizations', organizationRoutes);
  app.use('/api/branches', branchRoutes);
  app.use('/api/services', serviceRoutes);
  app.use('/api/counters', counterRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/notifications', notificationRoutes);

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'UP',
      timestamp: new Date().toISOString(),
      service: 'Smart Queue Management & Waiting Time Prediction System',
      database: {
        connected: isConnectedToMongo,
        type: isConnectedToMongo ? 'MongoDB' : 'In-Memory Engine',
        status: isConnectedToMongo ? 'Connected to MongoDB' : 'In-Memory Engine Active (Provide MONGO_URI in .env to connect external MongoDB)'
      }
    });
  });

  // Global error handler for API
  app.use('/api', errorHandler);

  // Development vs Production Frontend Serving
  const isTsxRuntime = process.execArgv.some((arg) => arg.includes('tsx')) || process.env.__TSX_SPAWNED === '1';
  const distPath = path.resolve(projectRoot, 'dist');
  const distIndexHtml = path.resolve(distPath, 'index.html');
  const indexHtmlPath = path.resolve(projectRoot, 'index.html');
  const isProduction = process.env.NODE_ENV === 'production' || (!isTsxRuntime && fs.existsSync(distIndexHtml));

  if (!isProduction) {
    try {
      const vite = await createViteServer({
        server: {
          middlewareMode: true,
          hmr: false,
          watch: null
        },
        appType: 'spa',
        root: projectRoot
      });
      app.use(vite.middlewares);

      // SPA fallback for Vite dev mode
      app.use('*', async (req, res, next) => {
        const url = req.originalUrl;
        if (url.startsWith('/api')) return next();
        try {
          let template = fs.readFileSync(indexHtmlPath, 'utf-8');
          template = await vite.transformIndexHtml(url, template);
          res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
        } catch (e) {
          if (fs.existsSync(distIndexHtml)) {
            return res.sendFile(distIndexHtml);
          }
          vite.ssrFixStacktrace(e as Error);
          next(e);
        }
      });
    } catch (viteErr) {
      console.error('Vite middleware initialization failed, falling back to static build:', viteErr);
      app.use(express.static(distPath));
      app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api')) return next();
        res.sendFile(distIndexHtml);
      });
    }
  } else {
    app.use(express.static(distPath));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) {
        return next();
      }
      res.sendFile(distIndexHtml);
    });
  }

  const PORT = parseInt(process.env.PORT || '3000', 10);
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`=======================================================`);
    console.log(`🚀 Smart Queue System running on http://0.0.0.0:${PORT}`);
    console.log(`📡 WebSocket & REST API active on port ${PORT}`);
    console.log(`=======================================================`);
  });

  return server;
}

// Automatically start if executed directly
startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
