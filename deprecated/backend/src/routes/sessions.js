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

// Helper function to hash strings for on-chain storage
function hashString(str) {
  return crypto.createHash('sha256').update(str).digest('hex');
}

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
    const encryptionKey = crypto.randomBytes(32).toString('hex');

    // Create session on blockchain with all required parameters
    const { txHash, objectId } = await createPrintSession({
      documentHash: document.hashSha256,
      documentCid: document.hashSha256, // Use hash as CID for now (no IPFS in normal backend)
      filename: document.filename,
      fileSize: document.size,
      sessionId: crypto.randomUUID(),
      oneTimeTokenHash: hashString(oneTimeToken),
      encryptionKeyHash: hashString(encryptionKey),
      expiresAt: expiresAt.getTime(),
    });

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
    logger.error({ 
      error: error.message, 
      stack: error.stack,
      name: error.name 
    }, 'Failed to create session');
    res.status(500).json({ 
      error: 'Failed to create session',
      details: error.message 
    });
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

// New endpoint: Get shareable link for print session
router.get('/:id/link', requireAuth, async (req, res) => {
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

    // Generate shareable link
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const shareableLink = `${baseUrl}/agent?sessionId=${session.id}&token=${session.oneTimeToken}`;

    res.json({
      link: shareableLink,
      sessionId: session.id,
      expiresAt: session.expiresAt,
    });
  } catch (error) {
    logger.error({ error }, 'Failed to generate link');
    res.status(500).json({ error: 'Failed to generate link' });
  }
});

export default router;
