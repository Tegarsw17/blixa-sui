import express from 'express';
import multer from 'multer';
import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';
import { encryptFile, hashFile, generateKey } from '../utils/encryption.js';
import { requireAuth } from './auth.js';
import { logger } from '../utils/logger.js';

const router = express.Router();
const prisma = new PrismaClient();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files allowed'));
    }
  },
});

const STORAGE_PATH = process.env.STORAGE_PATH || './storage/vault';

// Ensure storage directory exists
await fs.mkdir(STORAGE_PATH, { recursive: true });

router.post('/upload', requireAuth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileBuffer = req.file.buffer;
    const fileHash = hashFile(fileBuffer);
    const encryptionKey = generateKey();
    const encryptedBuffer = encryptFile(fileBuffer, encryptionKey);

    const filename = `${Date.now()}-${req.file.originalname}`;
    const storagePath = path.join(STORAGE_PATH, filename);

    await fs.writeFile(storagePath, encryptedBuffer);

    const document = await prisma.document.create({
      data: {
        ownerId: req.userAddress,
        filename: req.file.originalname,
        size: req.file.size,
        hashSha256: fileHash,
        storagePath,
        encryptedKey: encryptionKey,
      },
    });

    logger.info({ documentId: document.id }, 'Document uploaded');

    res.json({
      id: document.id,
      filename: document.filename,
      size: document.size,
      hash: document.hashSha256,
      createdAt: document.createdAt,
    });
  } catch (error) {
    logger.error({ error }, 'Upload failed');
    res.status(500).json({ error: 'Upload failed' });
  }
});

router.get('/:id', requireAuth, async (req, res) => {
  try {
    const document = await prisma.document.findUnique({
      where: { id: req.params.id },
      include: { sessions: true },
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    if (document.ownerId !== req.userAddress) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({
      id: document.id,
      filename: document.filename,
      size: document.size,
      hash: document.hashSha256,
      createdAt: document.createdAt,
      sessions: document.sessions,
    });
  } catch (error) {
    logger.error({ error }, 'Failed to get document');
    res.status(500).json({ error: 'Failed to get document' });
  }
});

export default router;
