import express from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import QRCode from 'qrcode';
import { requireAuth } from './auth.js';
import { createPrintSession } from '../utils/sui.js';
import { logger } from '../utils/logger.js';

const router = express.Router();
const prisma = new PrismaClient();

const SESSION_EXPIRY_MINUTES = parseInt(process.env.SESSION_EXPIRY_MINUTES || '10');

router.post('/create', requireAuth, async (req, res) => {
  try {
    const { documentId, expiresIn } = req.body;

    if (!documentId) {
      return res.status(400).json({ error: 'documentId required' });
    }

    const document = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    if (document.ownerId !== req.userAddress) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const expiryMinutes = expiresIn || SESSION_EXPIRY_MINUTES;
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);
    const oneTimeToken = crypto.randomBytes(32).toString('hex');

    // Create session on blockchain
    const { txHash, objectId } = await createPrintSession(
      oneTimeToken,
      document.hashSha256,
      expiresAt.getTime()
    );

    const session = await prisma.printSession.create({
      data: {
        documentId,
        ownerId: req.userAddress,
        status: 'CREATED',
        expiresAt,
        oneTimeToken,
        suiObjectId: objectId,
        suiTxCreate: txHash,
      },
    });

    await prisma.printEvent.create({
      data: {
        sessionId: session.id,
        eventType: 'CREATED',
        notes: `Session created with tx: ${txHash}`,
      },
    });

    logger.info({ sessionId: session.id, txHash }, 'Print session created');

    res.json({
      id: session.id,
      status: session.status,
      expiresAt: session.expiresAt,
      suiTxCreate: txHash,
      suiObjectId: objectId,
    });
  } catch (error) {
    logger.error({ error }, 'Failed to create session');
    res.status(500).json({ error: 'Failed to create session' });
  }
});

router.get('/:id', requireAuth, async (req, res) => {
  try {
    const session = await prisma.printSession.findUnique({
      where: { id: req.params.id },
      include: {
        document: true,
        events: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (session.ownerId !== req.userAddress) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({
      id: session.id,
      status: session.status,
      expiresAt: session.expiresAt,
      printedAt: session.printedAt,
      document: {
        filename: session.document.filename,
        size: session.document.size,
      },
      suiTxCreate: session.suiTxCreate,
      suiTxPrint: session.suiTxPrint,
      suiTxDestroy: session.suiTxDestroy,
      events: session.events,
    });
  } catch (error) {
    logger.error({ error }, 'Failed to get session');
    res.status(500).json({ error: 'Failed to get session' });
  }
});

router.get('/:id/qr', requireAuth, async (req, res) => {
  try {
    const session = await prisma.printSession.findUnique({
      where: { id: req.params.id },
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (session.ownerId !== req.userAddress) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (session.status !== 'CREATED') {
      return res.status(400).json({ error: 'Session not available' });
    }

    const qrPayload = JSON.stringify({
      sessionId: session.id,
      token: session.oneTimeToken,
    });

    const qrImage = await QRCode.toDataURL(qrPayload);

    res.json({
      qrCode: qrImage,
      payload: qrPayload,
    });
  } catch (error) {
    logger.error({ error }, 'Failed to generate QR');
    res.status(500).json({ error: 'Failed to generate QR' });
  }
});

export default router;
