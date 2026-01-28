/**
 * Blockchain service wrapper for Sui smart contract interactions
 * Handles all transactions with the PrintSession contract
 */

import { useSignAndExecuteTransaction, useSuiClient, useCurrentAccount } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { CONFIG } from './config';

// Smart contract function names
const CONTRACT_FUNCTIONS = {
  CREATE_SESSION: 'create_session',
  MARK_PRINTED: 'mark_printed',
  DESTROY_SESSION: 'destroy_session',
  MARK_EXPIRED: 'mark_expired',
} as const;

// Contract module name
const MODULE_NAME = 'print_session';
const PACKAGE_ID = CONFIG.PACKAGE_ID;

/**
 * Type definitions for session data
 */
export interface SessionData {
  objectId: string;
  owner: string;
  documentHash: string;
  documentCid: string; // Walrus blobId
  filename: string;
  fileSize: number;
  sessionId: string;
  oneTimeTokenHash: string;
  status: number; // 0=created, 1=printed, 2=destroyed, 3=expired
  createdAt: number;
  expiresAt: number;
  printedAt: number;
  encryptionKeyHash: string;
}

export interface CreateSessionParams {
  documentHash: string;
  documentCid: string; // Walrus blobId
  filename: string;
  fileSize: number;
  sessionId: string;
  oneTimeTokenHash: string;
  encryptionKeyHash: string;
  expiresAt: number;
}

/**
 * Hook for interacting with the PrintSession smart contract
 */
export function usePrintSessionContract() {
  const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  const suiClient = useSuiClient();
  const account = useCurrentAccount();

  return createPrintSessionService(suiClient, signAndExecuteTransaction, account?.address);
}

/**
 * Create a print session service instance
 * This can be used with or without React hooks
 */
export function createPrintSessionService(
  suiClient: any,
  signAndExecuteTransaction: any,
  currentAddress?: string
) {
  /**
   * Create a new print session on the blockchain
   */
  const createSession = async (params: CreateSessionParams) => {
    const tx = new Transaction();

    // Call the create_session function
    tx.moveCall({
      target: `${PACKAGE_ID}::${MODULE_NAME}::${CONTRACT_FUNCTIONS.CREATE_SESSION}`,
      arguments: [
        tx.pure.string(params.documentHash),
        tx.pure.string(params.documentCid),
        tx.pure.string(params.filename),
        tx.pure.u64(params.fileSize),
        tx.pure.string(params.sessionId),
        tx.pure.string(params.oneTimeTokenHash),
        tx.pure.string(params.encryptionKeyHash),
        tx.pure.u64(params.expiresAt),
      ],
    });

    try {
      const result = await signAndExecuteTransaction({
        transaction: tx,
      });

      console.log('Session created successfully:', result);

      // Extract the created object ID from the transaction result
      try {
        // Query the transaction to get the full result with object changes
        const txResult = await suiClient.waitForTransaction({
          digest: result.digest,
          options: {
            showObjectChanges: true,
            showEffects: true,
          },
        });

        if (txResult.objectChanges && txResult.objectChanges.length > 0) {
          // Find the PrintSession object
          const sessionChange = txResult.objectChanges.find((change: any) =>
            change.type === 'created' &&
            change.objectType &&
            change.objectType.includes('PrintSession')
          );

          if (sessionChange && 'objectId' in sessionChange) {
            console.log('✅ PrintSession created on blockchain:', sessionChange.objectId);
            return {
              objectId: sessionChange.objectId,
              digest: result.digest,
              txId: result.digest,
            };
          }
        }

        console.warn('⚠️ Could not find PrintSession object in transaction');
      } catch (error) {
        console.error('Failed to query transaction:', error);
      }

      // Fallback: return transaction info if object ID not found
      return {
        objectId: '',
        digest: result.digest,
        txId: result.digest,
      };
    } catch (error) {
      console.error('Failed to create session:', error);
      throw error;
    }
  };

  /**
   * Mark a session as printed
   */
  const markPrinted = async (objectId: string, tokenHash: string) => {
    console.log('🔐 Marking session as printed:', { objectId, tokenHash });

    const tx = new Transaction();

    // Call the mark_printed function
    tx.moveCall({
      target: `${PACKAGE_ID}::${MODULE_NAME}::${CONTRACT_FUNCTIONS.MARK_PRINTED}`,
      arguments: [
        tx.object(objectId),
        tx.pure.string(tokenHash),
      ],
    });

    try {
      console.log('🔐 Sending mark_printed transaction...');
      const result = await signAndExecuteTransaction({
        transaction: tx,
      });

      console.log('✅ Session marked as printed:', result);

      return {
        digest: result.digest,
        txId: result.digest,
      };
    } catch (error) {
      console.error('❌ Failed to mark session as printed:', error);
      throw error;
    }
  };

  /**
   * Destroy a session (after print or expiry)
   */
  const destroySession = async (objectId: string, reason: string, tokenHash: string) => {
    console.log('🔐 Destroying session:', { objectId, reason, tokenHash });

    const tx = new Transaction();

    // Call the destroy_session function with token verification
    tx.moveCall({
      target: `${PACKAGE_ID}::${MODULE_NAME}::${CONTRACT_FUNCTIONS.DESTROY_SESSION}`,
      arguments: [
        tx.object(objectId),
        tx.pure.string(reason),
        tx.pure.string(tokenHash),
      ],
    });

    try {
      console.log('🔐 Sending destroy_session transaction...');
      const result = await signAndExecuteTransaction({
        transaction: tx,
      });

      console.log('✅ Session destroyed:', result);

      return {
        digest: result.digest,
        txId: result.digest,
      };
    } catch (error) {
      console.error('❌ Failed to destroy session:', error);
      throw error;
    }
  };

  /**
   * Mark a session as expired
   */
  const markExpired = async (objectId: string) => {
    const tx = new Transaction();

    // Call the mark_expired function
    tx.moveCall({
      target: `${PACKAGE_ID}::${MODULE_NAME}::${CONTRACT_FUNCTIONS.MARK_EXPIRED}`,
      arguments: [
        tx.object(objectId),
      ],
    });

    try {
      const result = await signAndExecuteTransaction({
        transaction: tx,
      });

      console.log('Session marked as expired:', result);

      return {
        digest: result.digest,
        txId: result.digest,
      };
    } catch (error) {
      console.error('Failed to mark session as expired:', error);
      throw error;
    }
  };

  /**
   * Get session data from blockchain
   */
  const getSession = async (objectId: string): Promise<SessionData | null> => {
    try {
      console.log('🔍 Getting session from blockchain:', objectId);

      const object = await suiClient.getObject({
        id: objectId,
        options: {
          showContent: true,
          showOwner: true,
          showType: true,
        },
      });

      console.log('🔍 Raw blockchain response:', object.data);

      if (object.data?.content && typeof object.data.content === 'object') {
        const fields = (object.data.content as any).fields;

        console.log('🔍 Parsed fields:', {
          document_cid: fields.document_cid,
          document_cid_type: typeof fields.document_cid,
        });

        const sessionData = {
          objectId: objectId,
          owner: fields.owner || '',
          documentHash: fields.document_hash || '',
          documentCid: fields.document_cid || '',
          filename: fields.filename || '',
          fileSize: fields.file_size ? Number(fields.file_size) : 0,
          sessionId: fields.session_id || '',
          oneTimeTokenHash: fields.one_time_token_hash || '',
          status: fields.status ? Number(fields.status) : 0,
          createdAt: fields.created_at ? Number(fields.created_at) : 0,
          expiresAt: fields.expires_at ? Number(fields.expires_at) : 0,
          printedAt: fields.printed_at ? Number(fields.printed_at) : 0,
          encryptionKeyHash: fields.encryption_key_hash || '',
        };

        console.log('✅ Session data constructed:', sessionData);

        return sessionData;
      }

      return null;
    } catch (error) {
      console.error('Failed to get session:', error);
      throw error;
    }
  };

  /**
   * Verify if a token matches the session's token hash
   */
  const verifyToken = async (objectId: string, tokenHash: string): Promise<boolean> => {
    try {
      console.log('🔐 Verifying token for objectId:', objectId);
      console.log('🔐 Provided tokenHash:', tokenHash);

      const session = await getSession(objectId);
      if (!session) {
        console.log('❌ Session not found');
        return false;
      }

      console.log('🔐 Session data:', {
        oneTimeTokenHash: session.oneTimeTokenHash,
        status: session.status,
      });

      const isValid = session.oneTimeTokenHash === tokenHash && session.status === 0;
      console.log('🔐 Token valid?', isValid, {
        hashesMatch: session.oneTimeTokenHash === tokenHash,
        statusIsCreated: session.status === 0,
      });

      return isValid;
    } catch (error) {
      console.error('Failed to verify token:', error);
      return false;
    }
  };

  /**
   * Check if a session is expired
   */
  const isSessionExpired = async (objectId: string): Promise<boolean> => {
    try {
      const session = await getSession(objectId);
      if (!session) return true;

      const currentTime = Date.now();
      const expiresAt = session.expiresAt;
      const isExpired = currentTime >= expiresAt;

      console.log('⏰ Session expiry check:', {
        currentTime,
        expiresAt,
        currentTimeFormatted: new Date(currentTime).toLocaleString(),
        expiresAtFormatted: new Date(expiresAt).toLocaleString(),
        isExpired,
        timeRemaining: expiresAt - currentTime,
      });

      return isExpired;
    } catch (error) {
      console.error('Failed to check session expiry:', error);
      return true;
    }
  };

  return {
    createSession,
    markPrinted,
    destroySession,
    markExpired,
    getSession,
    verifyToken,
    isSessionExpired,
  };
}
