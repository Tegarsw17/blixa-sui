import express from 'express';
import { verifyWalletSignature } from '../utils/sui.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// Auth dengan Sui wallet
router.post('/wallet/verify', async (req, res) => {
  try {
    const { address, signature, message } = req.body;

    if (!address || !signature || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const isValid = await verifyWalletSignature(address, signature, message);

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Generate session token (simplified untuk MVP)
    const sessionToken = Buffer.from(`${address}:${Date.now()}`).toString('base64');

    logger.info({ address }, 'Wallet authenticated');

    res.json({
      success: true,
      address,
      sessionToken,
    });
  } catch (error) {
    logger.error({ error }, 'Auth error');
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// Middleware untuk verify auth
export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ error: 'No authorization header' });
  }

  try {
    const token = authHeader.replace('Bearer ', '');
    const decoded = Buffer.from(token, 'base64').toString();
    const [address] = decoded.split(':');
    
    req.userAddress = address;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
}

export default router;
