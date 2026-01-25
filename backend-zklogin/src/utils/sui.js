import { SuiClient, getFullnodeUrl } from '@mysten/sui.js/client';
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import dotenv from 'dotenv';
import { logger } from './logger.js';
import { hashToken } from './encryption.js';

dotenv.config();

const network = process.env.SUI_NETWORK || 'testnet';
const packageId = process.env.SUI_PACKAGE_ID;

export const suiClient = new SuiClient({ url: getFullnodeUrl(network) });

export function getKeypair() {
  const privateKey = process.env.SUI_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('SUI_PRIVATE_KEY not configured');
  }
  return Ed25519Keypair.fromSecretKey(privateKey);
}

// Create print session on-chain with full metadata
export async function createPrintSession(sessionData) {
  try {
    const { 
      sessionId, 
      documentHash, 
      documentCid,
      filename,
      fileSize,
      oneTimeToken,
      encryptionKey,
      expiresAt,
      ownerAddress 
    } = sessionData;

    const keypair = getKeypair();
    const tx = new TransactionBlock();

    // Hash sensitive data
    const tokenHash = hashToken(oneTimeToken);
    const keyHash = hashToken(encryptionKey);

    tx.moveCall({
      target: `${packageId}::print_session::create_session`,
      arguments: [
        tx.pure(documentHash),
        tx.pure(documentCid),
        tx.pure(filename),
        tx.pure(fileSize.toString()),
        tx.pure(sessionId),
        tx.pure(tokenHash),
        tx.pure(keyHash),
        tx.pure(expiresAt.toString()),
      ],
    });

    const result = await suiClient.signAndExecuteTransactionBlock({
      signer: keypair,
      transactionBlock: tx,
      options: {
        showEffects: true,
        showObjectChanges: true,
      },
    });

    logger.info({ digest: result.digest }, 'Print session created on-chain');

    const createdObject = result.objectChanges?.find(
      (change) => change.type === 'created'
    );

    return {
      txHash: result.digest,
      objectId: createdObject?.objectId,
    };
  } catch (error) {
    logger.error({ error }, 'Failed to create print session on-chain');
    throw error;
  }
}

// Mark session as printed (called by agent with token)
export async function markPrinted(objectId, token) {
  try {
    const keypair = getKeypair();
    const tx = new TransactionBlock();
    const tokenHash = hashToken(token);

    tx.moveCall({
      target: `${packageId}::print_session::mark_printed`,
      arguments: [
        tx.object(objectId),
        tx.pure(tokenHash),
      ],
    });

    const result = await suiClient.signAndExecuteTransactionBlock({
      signer: keypair,
      transactionBlock: tx,
    });

    logger.info({ digest: result.digest }, 'Session marked as printed on-chain');
    return result.digest;
  } catch (error) {
    logger.error({ error }, 'Failed to mark printed on-chain');
    throw error;
  }
}

// Destroy session
export async function destroySession(objectId, reason) {
  try {
    const keypair = getKeypair();
    const tx = new TransactionBlock();

    tx.moveCall({
      target: `${packageId}::print_session::destroy_session`,
      arguments: [tx.object(objectId), tx.pure(reason)],
    });

    const result = await suiClient.signAndExecuteTransactionBlock({
      signer: keypair,
      transactionBlock: tx,
    });

    logger.info({ digest: result.digest }, 'Session destroyed on-chain');
    return result.digest;
  } catch (error) {
    logger.error({ error }, 'Failed to destroy session on-chain');
    throw error;
  }
}

// Get session from blockchain
export async function getSessionFromChain(objectId) {
  try {
    const object = await suiClient.getObject({
      id: objectId,
      options: { showContent: true },
    });

    if (!object.data) {
      throw new Error('Session not found');
    }

    return object.data.content.fields;
  } catch (error) {
    logger.error({ error, objectId }, 'Failed to get session from chain');
    throw error;
  }
}
