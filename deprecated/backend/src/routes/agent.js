import express from 'express';
import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import crypto from 'crypto';
import { decryptFile } from '../utils/encryption.js';
import { markPrintedAndDestroy } from '../utils/sui.js';
import { logger } from '../utils/logger.js';

const router = express.Router();
const prisma = new PrismaClient();

// Print Agent claim session
router.post('/sessions/:id/claim', async (req, res) => {
  try {
    const { token } = req.body;
    const sessionId = req.params.id;

    if (!token) {
      return res.status(400).json({ error: 'Token required' });
    }

    const session = await prisma.printSession.findUnique({
      where: { id: sessionId },
      include: { document: true },
    });

    if (!session) {
      return res.status(404).json({ 
        error: 'Session tidak ditemukan. Session mungkin sudah dihapus setelah print selesai.' 
      });
    }

    if (session.oneTimeToken !== token) {
      return res.status(401).json({ 
        error: 'Token tidak valid. Pastikan link yang digunakan benar.' 
      });
    }

    if (session.status !== 'CREATED') {
      const statusMessage = session.status === 'PRINTED' 
        ? 'Session sudah di-print dan dihapus secara permanen. Link tidak dapat digunakan lagi.'
        : session.status === 'EXPIRED'
        ? 'Session sudah kadaluarsa. Silakan buat session baru.'
        : 'Session tidak tersedia atau sudah digunakan.';
      
      return res.status(400).json({ error: statusMessage });
    }

    if (new Date() > session.expiresAt) {
      await prisma.printSession.update({
        where: { id: sessionId },
        data: { status: 'EXPIRED' },
      });
      return res.status(400).json({ error: 'Session expired' });
    }

    await prisma.printEvent.create({
      data: {
        sessionId,
        agentId: req.ip,
        eventType: 'CLAIMED',
        notes: 'Agent claimed session',
      },
    });

    logger.info({ sessionId }, 'Session claimed by agent');

    res.json({
      success: true,
      sessionId,
      document: {
        filename: session.document.filename,
        size: session.document.size,
      },
    });
  } catch (error) {
    logger.error({ error }, 'Failed to claim session');
    res.status(500).json({ error: 'Failed to claim session' });
  }
});

// Stream file to agent
router.get('/sessions/:id/stream', async (req, res) => {
  try {
    const { token } = req.query;
    const sessionId = req.params.id;

    const session = await prisma.printSession.findUnique({
      where: { id: sessionId },
      include: { document: true },
    });

    if (!session || session.oneTimeToken !== token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (session.status !== 'CREATED') {
      return res.status(400).json({ error: 'Session not available' });
    }

    const encryptedBuffer = await fs.readFile(session.document.storagePath);
    const decryptedBuffer = decryptFile(
      encryptedBuffer,
      session.document.encryptedKey
    );

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${session.document.filename}"`
    );
    res.send(decryptedBuffer);

    logger.info({ sessionId }, 'File streamed to agent');
  } catch (error) {
    logger.error({ error }, 'Failed to stream file');
    res.status(500).json({ error: 'Failed to stream file' });
  }
});

// Complete print
router.post('/sessions/:id/complete', async (req, res) => {
  try {
    const { token, result } = req.body;
    const sessionId = req.params.id;

    const session = await prisma.printSession.findUnique({
      where: { id: sessionId },
      include: { document: true },
    });

    if (!session || session.oneTimeToken !== token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (session.status !== 'CREATED') {
      return res.status(400).json({ error: 'Session not available' });
    }

    // Mark as printed and destroy in ONE transaction to avoid version conflict
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const txHash = await markPrintedAndDestroy(session.suiObjectId, tokenHash, 'printed');

    // Update session with both tx hashes (same tx for both operations)
    await prisma.printSession.update({
      where: { id: sessionId },
      data: {
        status: 'PRINTED',
        printedAt: new Date(),
        suiTxPrint: txHash,
        suiTxDestroy: txHash, // Same transaction
      },
    });

    await prisma.printEvent.create({
      data: {
        sessionId,
        agentId: req.ip,
        eventType: 'PRINTED',
        result: result || 'success',
        notes: `Print completed and session destroyed. Tx: ${txHash}`,
      },
    });

    // Delete file from storage
    try {
      await fs.unlink(session.document.storagePath);
      logger.info({ sessionId }, 'File deleted from vault');
    } catch (error) {
      logger.error({ error }, 'Failed to delete file');
    }

    logger.info({ sessionId, txHash }, 'Print completed and session destroyed');

    res.json({
      success: true,
      status: 'PRINTED',
      suiTxHash: txHash,
    });
  } catch (error) {
    logger.error({ error }, 'Failed to complete print');
    res.status(500).json({ error: 'Failed to complete print' });
  }
});

export default router;
