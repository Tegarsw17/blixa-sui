import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import QRCode from 'qrcode';
import { requireAuth } from './auth.js';
import { createPrintSession, getSessionFromChain } from '../utils/sui.js';
import { logger } from '../utils/logger.js';
import { cacheSession, getSession } from '../utils/cache.js';
import { getFile } from '../utils/cache.js';

const router = express.Router();

const SESSION_EXPIRY_MINUTES = parseInt(process.env.SESSION_EXPIRY_MINUTES || '10');

// Create print session - all data stored on blockchain
router.post('/create', requireAuth, async (req, res) => {
  try {
    const { documentId, expiresIn } = req.body;

    if (!documentId) {
      return res.status(400).json({ error: 'documentId required' });
    }

    // Get document metadata from cache
    const document = getFile(documentId);

    if (!document) {
      return res.status(404).json({ error: 'Document not found or expired' });
    }

    if (document.ownerId !== req.userAddress) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const sessionId = uuidv4();
    const expiryMinutes = expiresIn || SESSION_EXPIRY_MINUTES;
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);
    const oneTimeToken = crypto.randomBytes(32).toString('hex');

    // Create session on blockchain with all metadata
    const { txHash, objectId } = await createPrintSession({
      sessionId,
      documentHash: document.hash,
      documentCid: document.cid,
      filename: document.filename,
      fileSize: document.size,
      oneTimeToken,
      encryptionKey: document.encryptionKey,
      expiresAt: expiresAt.getTime(),
      ownerAddress: req.userAddress,
    });

    // Cache session data temporarily for quick access
    const sessionData = {
      id: sessionId,
      objectId,
      documentId,
      ownerId: req.userAddress,
      status: 'CREATED',
      expiresAt: expiresAt.toISOString(),
      oneTimeToken,
      encryptionKey: document.encryptionKey,
      cid: document.cid,
      filename: document.filename,
      suiTxCreate: txHash,
      createdAt: new Date().toISOString(),
    };

    cacheSession(sessionId, sessionData);

    logger.info({ sessionId, txHash, objectId }, 'Print session created');

    res.json({
      id: sessionId,
      objectId,
      status: 'CREATED',
      expiresAt: sessionData.expiresAt,
      suiTxCreate: txHash,
    });
  } catch (error) {
    logger.error({ error }, 'Failed to create session');
    res.status(500).json({ error: 'Failed to create session' });
  }
});

// Get session status (from cache or blockchain)
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const sessionId = req.params.id;

    // Try cache first
    let session = getSession(sessionId);

    if (!session) {
      return res.status(404).json({ error: 'Session not found or expired' });
    }

    if (session.ownerId !== req.userAddress) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Optionally fetch latest status from blockchain
    if (session.objectId) {
      try {
        const chainData = await getSessionFromChain(session.objectId);
        session.status = chainData.status === '0' ? 'CREATED' : 
                        chainData.status === '1' ? 'PRINTED' :
                        chainData.status === '2' ? 'DESTROYED' : 'EXPIRED';
      } catch (error) {
        logger.warn({ error }, 'Could not fetch from chain, using cache');
      }
    }

    res.json({
      id: session.id,
      objectId: session.objectId,
      status: session.status,
      expiresAt: session.expiresAt,
      printedAt: session.printedAt,
      filename: session.filename,
      suiTxCreate: session.suiTxCreate,
      suiTxPrint: session.suiTxPrint,
      suiTxDestroy: session.suiTxDestroy,
    });
  } catch (error) {
    logger.error({ error }, 'Failed to get session');
    res.status(500).json({ error: 'Failed to get session' });
  }
});

// Generate QR code with all necessary data
router.get('/:id/qr', requireAuth, async (req, res) => {
  try {
    const sessionId = req.params.id;
    const session = getSession(sessionId);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (session.ownerId !== req.userAddress) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (session.status !== 'CREATED') {
      return res.status(400).json({ error: 'Session not available' });
    }

    // QR contains everything needed: session ID, token, encryption key, IPFS CID
    const qrPayload = JSON.stringify({
      sessionId: session.id,
      objectId: session.objectId,
      token: session.oneTimeToken,
      encryptionKey: session.encryptionKey,
      cid: session.cid,
      filename: session.filename,
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
