/**
 * Frontend-only API layer
 * Replaces backend API calls with Walrus storage + blockchain transactions
 *
 * Architecture:
 * - File storage: Walrus decentralized storage
 * - Session management: Sui blockchain smart contract
 * - Encryption: Client-side AES-GCM
 * - State: Browser sessionStorage
 */

import { uploadToWalrusWithRetry, downloadFromWalrusWithRetry } from './walrus';
import {
  generateEncryptionKey,
  encryptFile,
  decryptFile,
  hashFile,
  hashToken,
  generateToken,
  exportKey,
  importKey,
  arrayBufferToBlob,
  blobToArrayBuffer,
} from './encryption';
import { SessionData } from './blockchain';
import {
  saveToUploadHistory,
  saveCurrentSession,
  generateShareableLink,
  DocumentMetadata,
} from './storage';

// Type definitions
export interface UploadResult {
  blobId: string;
  filename: string;
  size: number;
  hash: string;
  encryptionKey: string; // Exported key for QR code
}

export interface CreateSessionParams {
  blobId: string;
  filename: string;
  fileSize: number;
  documentHash: string;
  encryptionKey: string;
  expiresIn?: number; // milliseconds
}

export interface CreateSessionResult {
  sessionId: string;
  objectId: string;
  oneTimeToken: string;
  expiresAt: number;
  shareableLink: string;
}

export interface ClaimSessionResult {
  success: boolean;
  documentBlobId: string;
  filename: string;
  fileSize: number;
  encryptionKey: string;
  documentHash: string;
  sessionData: SessionData;
}

/**
 * Upload a document to Walrus with client-side encryption
 */
export async function uploadDocument(file: File): Promise<UploadResult> {
  try {
    // Step 1: Generate encryption key
    const encryptionKey = await generateEncryptionKey();

    // Step 2: Encrypt the file
    const { encrypted, salt, iv } = await encryptFile(file, encryptionKey);

    // Step 3: Prepend salt and IV to encrypted data for storage
    // Format: [salt (64 bytes)] [IV (12 bytes)] [encrypted data]
    const saltBinary = atob(salt);
    const ivBinary = atob(iv);
    const saltBuffer = new Uint8Array(saltBinary.length);
    const ivBuffer = new Uint8Array(ivBinary.length);
    for (let i = 0; i < saltBinary.length; i++) saltBuffer[i] = saltBinary.charCodeAt(i);
    for (let i = 0; i < ivBinary.length; i++) ivBuffer[i] = ivBinary.charCodeAt(i);

    const encryptedBuffer = new Uint8Array(encrypted);

    const combined = new Uint8Array(saltBuffer.length + ivBuffer.length + encryptedBuffer.length);
    combined.set(saltBuffer, 0);
    combined.set(ivBuffer, saltBuffer.length);
    combined.set(encryptedBuffer, saltBuffer.length + ivBuffer.length);

    console.log('🔐 Encrypted data structure:', {
      saltLength: saltBuffer.length,
      ivLength: ivBuffer.length,
      encryptedLength: encryptedBuffer.length,
      totalLength: combined.length,
    });

    // Step 4: Upload combined data to Walrus
    const encryptedBlob = new Blob([combined], { type: 'application/octet-stream' });
    const blobId = await uploadToWalrusWithRetry(encryptedBlob, {
      name: file.name,
      description: 'Encrypted document for Blixa print',
    });

    // Step 5: Calculate file hash
    const fileHash = await hashFile(file);

    // Step 6: Export encryption key for QR code storage
    const exportedKey = await exportKey(encryptionKey);

    console.log('Document uploaded successfully:', {
      blobId,
      filename: file.name,
      size: file.size,
      hash: fileHash,
    });

    return {
      blobId,
      filename: file.name,
      size: file.size,
      hash: fileHash,
      encryptionKey: exportedKey,
    };
  } catch (error) {
    console.error('Upload failed:', error);
    throw new Error(`Failed to upload document: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Create a new print session on the blockchain
 * Note: This function requires a contract service instance - use the hook version in components
 */
export async function createSession(
  params: CreateSessionParams,
  contractService: any
): Promise<CreateSessionResult> {
  try {
    // Step 1: Generate one-time token
    const oneTimeToken = generateToken();

    // Step 2: Hash the token for blockchain storage
    const tokenHash = await hashToken(oneTimeToken);

    // Step 3: Hash the encryption key for verification
    const encryptionKeyHash = await hashToken(params.encryptionKey);

    // Step 4: Generate session ID
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Step 5: Calculate expiration time
    const expiresIn = params.expiresIn || 10 * 60 * 1000; // Default 10 minutes
    const expiresAt = Date.now() + expiresIn;

    // Step 6: Call smart contract to create session
    const result = await contractService.createSession({
      documentHash: params.documentHash,
      documentCid: params.blobId,
      filename: params.filename,
      fileSize: params.fileSize,
      sessionId,
      oneTimeTokenHash: tokenHash,
      encryptionKeyHash,
      expiresAt,
    });

    console.log('Session created on blockchain:', result);

    // Step 7: Save to local storage
    const sessionMetadata = {
      objectId: result.objectId,
      sessionId,
      blobId: params.blobId,
      filename: params.filename,
      fileSize: params.fileSize,
      documentHash: params.documentHash,
      oneTimeToken,
      encryptionKey: params.encryptionKey,
      expiresAt,
      createdAt: Date.now(),
    };
    saveCurrentSession(sessionMetadata);

    // Step 8: Generate shareable link
    const shareableLink = generateShareableLink(sessionMetadata);

    return {
      sessionId,
      objectId: result.objectId,
      oneTimeToken,
      expiresAt,
      shareableLink,
    };
  } catch (error) {
    console.error('Create session failed:', error);
    throw new Error(`Failed to create session: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get session data from blockchain
 */
export async function getSession(objectId: string, contractService: any): Promise<SessionData> {
  try {
    const session = await contractService.getSession(objectId);

    if (!session) {
      throw new Error('Session not found');
    }

    return session;
  } catch (error) {
    console.error('Get session failed:', error);
    throw error;
  }
}

/**
 * Claim a session (verify token and retrieve metadata)
 */
export async function claimSession(
  objectId: string,
  token: string,
  contractService: any
): Promise<ClaimSessionResult> {
  try {
    console.log('🔐 Claiming session:', { objectId, token });

    // Step 1: Get session from blockchain
    const sessionData = await contractService.getSession(objectId);

    if (!sessionData) {
      throw new Error('Session not found');
    }

    console.log('🔐 Session retrieved from blockchain:', sessionData);

    // Step 2: Verify token
    const tokenHash = await hashToken(token);
    console.log('🔐 Computed token hash from provided token:', tokenHash);

    const isValid = await contractService.verifyToken(objectId, tokenHash);

    if (!isValid) {
      throw new Error('Invalid token or session already used');
    }

    // Step 3: Check if expired
    const isExpired = await contractService.isSessionExpired(objectId);
    if (isExpired) {
      throw new Error('Session has expired');
    }

    console.log('✅ Session claimed successfully:', {
      filename: sessionData.filename,
      size: sessionData.fileSize,
      documentCid: sessionData.documentCid,
      documentCidType: typeof sessionData.documentCid,
    });

    const documentBlobId = sessionData.documentCid;
    console.log('📦 Returning documentBlobId:', documentBlobId, 'Type:', typeof documentBlobId);

    return {
      success: true,
      documentBlobId,
      filename: sessionData.filename,
      fileSize: sessionData.fileSize,
      encryptionKey: '', // Agent doesn't need the key, it's in the QR code
      documentHash: sessionData.documentHash,
      sessionData,
    };
  } catch (error) {
    console.error('❌ Claim session failed:', error);
    throw new Error(`Failed to claim session: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Download and decrypt a document
 */
export async function downloadDocument(
  blobId: string,
  encryptionKey: string
): Promise<Blob> {
  try {
    console.log('🔐 Starting document download and decryption...');

    // Step 1: Download encrypted file from Walrus
    const encryptedBlob = await downloadFromWalrusWithRetry(blobId);

    // Step 2: Convert to ArrayBuffer
    const encryptedArrayBuffer = await blobToArrayBuffer(encryptedBlob);
    const encryptedData = new Uint8Array(encryptedArrayBuffer);

    console.log('📦 Downloaded encrypted data:', { size: encryptedData.length });

    // Step 3: Extract salt, IV, and encrypted data
    // Format: [salt (64 bytes)] [IV (12 bytes)] [encrypted data]
    const SALT_LENGTH = 64;
    const IV_LENGTH = 12;

    if (encryptedData.length < SALT_LENGTH + IV_LENGTH) {
      throw new Error(`Encrypted data too short: ${encryptedData.length} bytes (expected at least ${SALT_LENGTH + IV_LENGTH})`);
    }

    const saltBuffer = encryptedData.slice(0, SALT_LENGTH);
    const ivBuffer = encryptedData.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const actualEncryptedData = encryptedData.slice(SALT_LENGTH + IV_LENGTH);

    const salt = btoa(String.fromCharCode(...saltBuffer));
    const iv = btoa(String.fromCharCode(...ivBuffer));

    console.log('🔐 Extracted encryption parameters:', {
      salt: salt.substring(0, 16) + '...',
      iv: iv.substring(0, 16) + '...',
      encryptedDataLength: actualEncryptedData.length,
    });

    // Step 4: Import encryption key
    const key = await importKey(encryptionKey);

    // Step 5: Decrypt the file
    console.log('🔐 Decrypting...');
    const decryptedArrayBuffer = await decryptFile(
      actualEncryptedData.buffer,
      key,
      salt,
      iv
    );

    console.log('✅ Decryption successful:', { size: decryptedArrayBuffer.byteLength });

    // Step 6: Convert back to Blob
    const decryptedBlob = arrayBufferToBlob(decryptedArrayBuffer, 'application/pdf');

    console.log('Document downloaded and decrypted successfully');

    return decryptedBlob;
  } catch (error) {
    console.error('❌ Download document failed:', error);
    throw new Error(`Failed to download document: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Stream document (alias for download)
 */
export async function streamDocument(
  blobId: string,
  encryptionKey: string
): Promise<Blob> {
  return await downloadDocument(blobId, encryptionKey);
}

/**
 * Complete a session (mark as printed and destroy)
 */
export async function completeSession(
  objectId: string,
  token: string,
  result: string,
  contractService: any
): Promise<void> {
  try {
    console.log('🔐 completeSession called with:', { objectId, token: token.substring(0, 16) + '...', result });

    // Step 1: Hash the token
    const tokenHash = await hashToken(token);
    console.log('🔐 Token hashed for blockchain:', tokenHash);

    // Step 2: Mark session as printed
    console.log('🔐 Calling markPrinted...');
    await contractService.markPrinted(objectId, tokenHash);

    // Step 3: Destroy the session (now requires token hash too)
    console.log('🔐 Calling destroySession with token...');
    await contractService.destroySession(objectId, result, tokenHash);

    console.log('✅ Session completed successfully');
  } catch (error) {
    console.error('❌ Complete session failed:', error);
    throw new Error(`Failed to complete session: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get QR code data (for backward compatibility)
 */
export async function getQRCode(sessionId: string): Promise<any> {
  // QR code generation is now handled client-side
  // This function is kept for backward compatibility
  return { url: '', data: '' };
}

/**
 * Get shareable link (for backward compatibility)
 */
export async function getShareableLink(sessionId: string): Promise<{ link: string }> {
  // Shareable link generation is now handled client-side
  // This function is kept for backward compatibility
  return { link: '' };
}

/**
 * Verify wallet (deprecated - no longer needed)
 */
export async function verifyWallet(address: string, signature: string, message: string): Promise<any> {
  // Wallet verification is handled by @mysten/dapp-kit
  // This function is kept for backward compatibility
  return { verified: true };
}

/**
 * Set auth token (deprecated - no longer needed)
 */
export function setAuthToken(token: string): void {
  // Auth is no longer needed with frontend-only architecture
  // This function is kept for backward compatibility
  console.warn('setAuthToken is deprecated and no longer needed');
}
