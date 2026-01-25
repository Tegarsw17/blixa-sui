import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import os from 'os';
import { logger } from './utils/logger.js';
import documentRoutes from './routes/documents.js';
import sessionRoutes from './routes/sessions.js';
import agentRoutes from './routes/agent.js';
import authRoutes from './routes/auth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/agent', agentRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, '0.0.0.0', () => {
  const networkInterfaces = os.networkInterfaces();
  const addresses = [];
  
  for (const name of Object.keys(networkInterfaces)) {
    for (const net of networkInterfaces[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        addresses.push(net.address);
      }
    }
  }
  
  const primaryIP = addresses[0] || 'localhost';
  logger.info(`BLIXA Backend running on http://${primaryIP}:${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`Port from .env: ${process.env.PORT || 'not set (using default 3001)'}`);
});
