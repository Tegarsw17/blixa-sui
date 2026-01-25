import fs from 'fs/promises';
import path from 'path';
import { logger } from './logger.js';
import { sessionCache, fileCache } from './cache.js';

const TEMP_STORAGE_PATH = process.env.TEMP_STORAGE_PATH || './temp';

// Cleanup expired files from temp storage
export async function cleanupExpiredFiles() {
  try {
    const files = await fs.readdir(TEMP_STORAGE_PATH);
    const now = Date.now();
    let cleaned = 0;

    for (const file of files) {
      const filePath = path.join(TEMP_STORAGE_PATH, file);
      const stats = await fs.stat(filePath);
      
      // Delete files older than 15 minutes
      const age = now - stats.mtimeMs;
      if (age > 15 * 60 * 1000) {
        await fs.unlink(filePath);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.info({ cleaned }, 'Cleaned up expired temp files');
    }

    // Log cache stats
    const sessionKeys = sessionCache.keys();
    const fileKeys = fileCache.keys();
    logger.info({ 
      sessions: sessionKeys.length, 
      files: fileKeys.length 
    }, 'Cache stats');

  } catch (error) {
    logger.error({ error }, 'Cleanup error');
  }
}

// Ensure temp directory exists
export async function ensureTempDir() {
  try {
    await fs.mkdir(TEMP_STORAGE_PATH, { recursive: true });
  } catch (error) {
    logger.error({ error }, 'Failed to create temp directory');
  }
}
