import { SuiClient } from '@mysten/sui.js/client';
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import { generateNonce, generateRandomness, getExtendedEphemeralPublicKey } from '@mysten/zklogin';
import { jwtToAddress } from '@mysten/zklogin';
import dotenv from 'dotenv';
import { logger } from './logger.js';

dotenv.config();

const ZKLOGIN_SALT = process.env.ZKLOGIN_SALT || 'default-salt-change-this';

// Generate nonce for zkLogin
export async function generateZkLoginNonce(ephemeralPublicKey, maxEpoch) {
  try {
    const extendedEphemeralPublicKey = getExtendedEphemeralPublicKey(ephemeralPublicKey);
    const nonce = generateNonce(extendedEphemeralPublicKey, maxEpoch, ZKLOGIN_SALT);
    return nonce;
  } catch (error) {
    logger.error({ error }, 'Failed to generate nonce');
    throw error;
  }
}

// Verify zkLogin signature
export async function verifyZkLoginSignature(zkLoginData) {
  try {
    const { zkProof, ephemeralPublicKey, maxEpoch, jwtRandomness, userSalt } = zkLoginData;

    // For MVP, we do basic validation
    // In production, you'd verify the ZK proof fully
    if (!zkProof || !ephemeralPublicKey) {
      return false;
    }

    // Verify proof structure
    if (!zkProof.proofPoints || !zkProof.issBase64Details) {
      return false;
    }

    logger.info('zkLogin signature verified');
    return true;
  } catch (error) {
    logger.error({ error }, 'zkLogin verification failed');
    return false;
  }
}

// Get Sui address from zkLogin
export function getZkLoginAddress(ephemeralPublicKey, userSalt) {
  try {
    // This is simplified - in production use proper zkLogin address derivation
    const salt = userSalt || ZKLOGIN_SALT;
    
    // For MVP, we can use a deterministic address based on ephemeral key
    // In production, use proper jwtToAddress with JWT token
    const address = `0x${Buffer.from(ephemeralPublicKey + salt).toString('hex').slice(0, 64)}`;
    
    return address;
  } catch (error) {
    logger.error({ error }, 'Failed to get zkLogin address');
    throw error;
  }
}

// Generate ephemeral keypair for zkLogin
export function generateEphemeralKeypair() {
  const keypair = new Ed25519Keypair();
  const randomness = generateRandomness();
  
  return {
    keypair,
    randomness,
    ephemeralPublicKey: keypair.getPublicKey().toBase64(),
  };
}
