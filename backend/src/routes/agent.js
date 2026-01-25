import express from 'express';
import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import { decryptFile } from '../utils/encryption.js';
import { markPrinted, destroySession } from '../utils/sui.js';
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
      return res.status(404).json({ error: 'Session not found' });
    }

    if (session.oneTimeToken !== token) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    if (session.status !== 'CREATED') {
      return res.status(400).json({ error: 'Session already used or expired' });
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

    // Mark as printed on blockchain
    const txPrint = await markPrinted(session.suiObjectId);

    // Update session
    await prisma.printSession.update({
      where: { id: sessionId },
      data: {
        status: 'PRINTED',
        printedAt: new Date(),
        suiTxPrint: txPrint,
      },
    });

    await prisma.printEvent.create({
      data: {
        sessionId,
        agentId: req.ip,
        eventType: 'PRINTED',
        result: result || 'success',
        notes: `Print completed. Tx: ${txPrint}`,
      },
    });

    // Delete file from storage
    try {
      await fs.unlink(session.document.storagePath);
      logger.info({ sessionId }, 'File deleted from vault');
    } catch (error) {
      logger.error({ error }, 'Failed to delete file');
    }

    // Destroy session on blockchain
    const txDestroy = await destroySession(session.suiObjectId, 'printed');

    await prisma.printSession.update({
      where: { id: sessionId },
      data: { suiTxDestroy: txDestroy },
    });

    logger.info({ sessionId, txPrint, txDestroy }, 'Print completed');

    res.json({
      success: true,
      status: 'PRINTED',
      suiTxPrint: txPrint,
      suiTxDestroy: txDestroy,
    });
  } catch (error) {
    logger.error({ error }, 'Failed to complete print');
    res.status(500).json({ error: 'Failed to complete print' });
  }
});

export default router;
