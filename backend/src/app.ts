import express from 'express';
import cors from 'cors';
import { config } from './config/env';
import authRoutes from './modules/auth/auth.routes';
import projectRoutes from './modules/projects/project.routes';
import taskRoutes from './modules/tasks/task.routes';
import dashboardRoutes from './modules/users/dashboard.routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

const app = express();

// CORS: Why needed?
// Browsers block cross-origin requests by default (Same Origin Policy).
// Our frontend runs on a different origin than the backend.
// CORS headers tell the browser: "This server allows requests from these origins."
app.use(
  cors({
    origin: [
      config.frontendUrl,
      'http://localhost:5173',
      'http://localhost:4173',
    ].filter(Boolean),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check — Railway uses this to verify the service is running
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/projects/:projectId/tasks', taskRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Error handlers must be last
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
