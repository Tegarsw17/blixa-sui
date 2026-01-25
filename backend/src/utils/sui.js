import { SuiClient, getFullnodeUrl } from '@mysten/sui.js/client';
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import dotenv from 'dotenv';
import { logger } from './logger.js';

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

export async function createPrintSession(sessionId, documentHash, expiresAt) {
  try {
    const keypair = getKeypair();
    const tx = new TransactionBlock();

    tx.moveCall({
      target: `${packageId}::print_session::create_session`,
      arguments: [
        tx.pure(documentHash),
        tx.pure(sessionId),
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

export async function markPrinted(objectId) {
  try {
    const keypair = getKeypair();
    const tx = new TransactionBlock();

    tx.moveCall({
      target: `${packageId}::print_session::mark_printed`,
      arguments: [tx.object(objectId)],
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

export async function verifyWalletSignature(address, signature, message) {
  // Implementasi verifikasi signature dari Sui wallet
  // Untuk MVP, bisa simplified
  return true;
}
