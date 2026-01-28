import express from 'express';
import { downloadFromIPFS, unpinFromIPFS } from '../utils/ipfs.js';
import { decryptFile } from '../utils/encryption.js';
import { markPrinted, destroySession } from '../utils/sui.js';
import { logger } from '../utils/logger.js';
import { getSession, deleteSession } from '../utils/cache.js';

const router = express.Router();

// Print Agent claim session (validate QR data)
router.post('/sessions/:id/claim', async (req, res) => {
  try {
    const { token, objectId } = req.body;
    const sessionId = req.params.id;

    if (!token || !objectId) {
      return res.status(400).json({ error: 'Token and objectId required' });
    }

    // Get session from cache
    const session = getSession(sessionId);

    if (!session) {
      return res.status(404).json({ error: 'Session not found or expired' });
    }

    if (session.oneTimeToken !== token) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    if (session.status !== 'CREATED') {
      return res.status(400).json({ error: 'Session already used or expired' });
    }

    if (new Date() > new Date(session.expiresAt)) {
      return res.status(400).json({ error: 'Session expired' });
    }

    logger.info({ sessionId }, 'Session claimed by agent');

    res.json({
      success: true,
      sessionId,
      objectId: session.objectId,
      filename: session.filename,
      cid: session.cid,
    });
  } catch (error) {
    logger.error({ error }, 'Failed to claim session');
    res.status(500).json({ error: 'Failed to claim session' });
  }
});

// Stream file to agent (download from IPFS and decrypt)
router.get('/sessions/:id/stream', async (req, res) => {
  try {
    const { token, encryptionKey, cid } = req.query;
    const sessionId = req.params.id;

    if (!token || !encryptionKey || !cid) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const session = getSession(sessionId);

    if (!session || session.oneTimeToken !== token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (session.status !== 'CREATED') {
      return res.status(400).json({ error: 'Session not available' });
    }

    // Download encrypted file from IPFS
    logger.info({ sessionId, cid }, 'Downloading from IPFS');
    const encryptedBuffer = await downloadFromIPFS(cid);

    // Decrypt file
    const decryptedBuffer = decryptFile(encryptedBuffer, encryptionKey);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${session.filename}"`
    );
    res.send(decryptedBuffer);

    logger.info({ sessionId }, 'File streamed to agent');
  } catch (error) {
    logger.error({ error }, 'Failed to stream file');
    res.status(500).json({ error: 'Failed to stream file' });
  }
});

// Complete print (mark as printed and cleanup)
router.post('/sessions/:id/complete', async (req, res) => {
  try {
    const { token, objectId, result } = req.body;
    const sessionId = req.params.id;

    const session = getSession(sessionId);

    if (!session || session.oneTimeToken !== token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (session.status !== 'CREATED') {
      return res.status(400).json({ error: 'Session not available' });
    }

    // Mark as printed on blockchain
    const txPrint = await markPrinted(objectId, token);

    // Update cache
    session.status = 'PRINTED';
    session.printedAt = new Date().toISOString();
    session.suiTxPrint = txPrint;

    // Unpin from IPFS (cleanup)
    try {
      await unpinFromIPFS(session.cid);
      logger.info({ sessionId, cid: session.cid }, 'File unpinned from IPFS');
    } catch (error) {
      logger.warn({ error }, 'Failed to unpin from IPFS');
    }

    // Destroy session on blockchain
    const txDestroy = await destroySession(objectId, 'printed');
    session.suiTxDestroy = txDestroy;
    session.status = 'DESTROYED';

    // Remove from cache
    deleteSession(sessionId);

    logger.info({ sessionId, txPrint, txDestroy }, 'Print completed');

    res.json({
      success: true,
      status: 'DESTROYED',
      suiTxPrint: txPrint,
      suiTxDestroy: txDestroy,
    });
  } catch (error) {
    logger.error({ error }, 'Failed to complete print');
    res.status(500).json({ error: 'Failed to complete print' });
  }
});

export default router;
