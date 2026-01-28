import express from 'express';
import { verifyZkLoginSignature, getZkLoginAddress } from '../utils/zklogin.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// zkLogin authentication
router.post('/zklogin/verify', async (req, res) => {
  try {
    const { zkProof, ephemeralPublicKey, maxEpoch, jwtRandomness, userSalt } = req.body;

    if (!zkProof || !ephemeralPublicKey) {
      return res.status(400).json({ error: 'Missing required zkLogin fields' });
    }

    // Verify zkLogin proof
    const isValid = await verifyZkLoginSignature({
      zkProof,
      ephemeralPublicKey,
      maxEpoch,
      jwtRandomness,
      userSalt
    });

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid zkLogin proof' });
    }

    // Get Sui address from zkLogin
    const address = getZkLoginAddress(ephemeralPublicKey, userSalt);

    // Generate session token (simplified for MVP)
    const sessionToken = btoa(`${address}:${Date.now()}`);

    logger.info({ address }, 'zkLogin authenticated');

    res.json({
      success: true,
      address,
      sessionToken,
    });
  } catch (error) {
    logger.error({ error }, 'zkLogin auth error');
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// Get nonce for zkLogin
router.get('/zklogin/nonce', async (req, res) => {
  try {
    const { ephemeralPublicKey } = req.query;
    
    if (!ephemeralPublicKey) {
      return res.status(400).json({ error: 'ephemeralPublicKey required' });
    }

    // Generate nonce for zkLogin
    const nonce = await generateZkLoginNonce(ephemeralPublicKey);

    res.json({ nonce });
  } catch (error) {
    logger.error({ error }, 'Nonce generation error');
    res.status(500).json({ error: 'Failed to generate nonce' });
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
    const decoded = atob(token);
    const [address] = decoded.split(':');
    
    req.userAddress = address;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
}

export default router;
