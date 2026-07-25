import dotenv from 'dotenv';
import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import authRoutes from './routes/auth';
import departmentRoutes from './routes/departments';
import taskRoutes from './routes/tasks';
import dashboardRoutes from './routes/dashboard';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/navy-task-dashboard';

// Allow wildcard (*) for dev LAN access, or a specific origin in production
const corsOrigin = CLIENT_URL === '*' ? true : CLIENT_URL;

app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
  })
);
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.use((_req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global error handler — catches any unhandled errors thrown in route handlers
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err);
  const message = err instanceof Error ? err.message : 'Internal server error';
  res.status(500).json({ message });
});

async function start() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
