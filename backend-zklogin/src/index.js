import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { logger } from './utils/logger.js';
import documentRoutes from './routes/documents.js';
import sessionRoutes from './routes/sessions.js';
import agentRoutes from './routes/agent.js';
import authRoutes from './routes/auth.js';
import { cleanupExpiredFiles } from './utils/cleanup.js';

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
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    mode: 'zkLogin + IPFS (No Database)'
  });
});

// Cleanup expired files every 5 minutes
setInterval(cleanupExpiredFiles, 5 * 60 * 1000);

app.listen(PORT, () => {
  logger.info(`BLIXA Backend (zkLogin + IPFS) running on port ${PORT}`);
  logger.info('No database required - all state on Sui blockchain');
});
