import { SuiClient, getFullnodeUrl } from '@mysten/sui.js/client';
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { decodeSuiPrivateKey } from '@mysten/sui.js/cryptography';
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
  
  try {
    // Decode the Bech32 private key (suiprivkey1...)
    const { schema, secretKey } = decodeSuiPrivateKey(privateKey);
    
    // Create keypair based on the schema
    if (schema === 'ED25519') {
      return Ed25519Keypair.fromSecretKey(secretKey);
    }
    
    throw new Error(`Unsupported key schema: ${schema}`);
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to parse private key');
    throw new Error(`Invalid SUI_PRIVATE_KEY format: ${error.message}`);
  }
}

export async function createPrintSession(params) {
  try {
    const {
      documentHash,
      documentCid,
      filename,
      fileSize,
      sessionId,
      oneTimeTokenHash,
      encryptionKeyHash,
      expiresAt
    } = params;

    const keypair = getKeypair();
    const tx = new TransactionBlock();

    tx.moveCall({
      target: `${packageId}::print_session::create_session`,
      arguments: [
        tx.pure.string(documentHash),
        tx.pure.string(documentCid),
        tx.pure.string(filename),
        tx.pure.u64(fileSize),
        tx.pure.string(sessionId),
        tx.pure.string(oneTimeTokenHash),
        tx.pure.string(encryptionKeyHash),
        tx.pure.u64(expiresAt),
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
    logger.error({ 
      error: error.message, 
      stack: error.stack,
      name: error.name 
    }, 'Failed to create print session on-chain');
    throw error;
  }
}

export async function markPrintedAndDestroy(objectId, tokenHash, reason) {
  try {
    const keypair = getKeypair();
    const tx = new TransactionBlock();

    // Call mark_printed first
    tx.moveCall({
      target: `${packageId}::print_session::mark_printed`,
      arguments: [
        tx.object(objectId),
        tx.pure.string(tokenHash),
      ],
    });

    // Then destroy in the same transaction
    tx.moveCall({
      target: `${packageId}::print_session::destroy_session`,
      arguments: [
        tx.object(objectId),
        tx.pure.string(reason),
      ],
    });

    const result = await suiClient.signAndExecuteTransactionBlock({
      signer: keypair,
      transactionBlock: tx,
      options: {
        showEffects: true,
      },
    });

    logger.info({ 
      digest: result.digest, 
      objectId 
    }, 'Session marked as printed and destroyed on-chain');
    
    return result.digest;
  } catch (error) {
    logger.error({ 
      error: error.message,
      stack: error.stack,
      objectId,
      tokenHash,
      reason
    }, 'Failed to mark printed and destroy on-chain');
    throw error;
  }
}

export async function markPrinted(objectId, tokenHash) {
  try {
    const keypair = getKeypair();
    const tx = new TransactionBlock();

    tx.moveCall({
      target: `${packageId}::print_session::mark_printed`,
      arguments: [
        tx.object(objectId),
        tx.pure.string(tokenHash),
      ],
    });

    const result = await suiClient.signAndExecuteTransactionBlock({
      signer: keypair,
      transactionBlock: tx,
      options: {
        showEffects: true,
      },
    });

    logger.info({ digest: result.digest, objectId }, 'Session marked as printed on-chain');
    return result.digest;
  } catch (error) {
    logger.error({ 
      error: error.message,
      stack: error.stack,
      objectId,
      tokenHash 
    }, 'Failed to mark printed on-chain');
    throw error;
  }
}

export async function destroySession(objectId, reason) {
  try {
    const keypair = getKeypair();
    const tx = new TransactionBlock();

    tx.moveCall({
      target: `${packageId}::print_session::destroy_session`,
      arguments: [
        tx.object(objectId),
        tx.pure.string(reason),
      ],
    });

    const result = await suiClient.signAndExecuteTransactionBlock({
      signer: keypair,
      transactionBlock: tx,
      options: {
        showEffects: true,
      },
    });

    logger.info({ digest: result.digest, objectId, reason }, 'Session destroyed on-chain');
    return result.digest;
  } catch (error) {
    logger.error({ 
      error: error.message,
      stack: error.stack,
      objectId,
      reason 
    }, 'Failed to destroy session on-chain');
    throw error;
  }
}

export async function verifyWalletSignature(address, signature, message) {
  // Implementasi verifikasi signature dari Sui wallet
  // Untuk MVP, bisa simplified
  return true;
}
