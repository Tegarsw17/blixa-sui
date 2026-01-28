/**
 * Client-side encryption utilities using Web Crypto API
 * Ported from backend encryption.js to browser-compatible implementation
 */

// Encryption constants (matching backend implementation)
const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256; // bits
const IV_LENGTH = 12; // bytes for GCM
const SALT_LENGTH = 64; // bytes
const ITERATIONS = 100000;

/**
 * Generate a new encryption key
 */
export async function generateEncryptionKey(): Promise<CryptoKey> {
  return await window.crypto.subtle.generateKey(
    {
      name: ALGORITHM,
      length: KEY_LENGTH,
    },
    true, // extractable
    ['encrypt', 'decrypt']
  );
}

/**
 * Derive a key from a password (for compatibility with backend)
 * Note: In our new architecture, we generate random keys instead of password-based
 */
async function deriveKey(
  password: string,
  salt: ArrayBuffer
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: ITERATIONS,
      hash: 'SHA-512',
    },
    keyMaterial,
    {
      name: ALGORITHM,
      length: KEY_LENGTH,
    },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt a file using AES-GCM
 * @param file - The file to encrypt
 * @param key - The encryption key
 * @returns Encrypted data with salt and IV
 */
export async function encryptFile(
  file: File,
  key: CryptoKey
): Promise<{
  encrypted: ArrayBuffer;
  salt: string;
  iv: string;
}> {
  const arrayBuffer = await file.arrayBuffer();

  // Generate random IV
  const iv = window.crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  // Encrypt the data
  const encrypted = await window.crypto.subtle.encrypt(
    {
      name: ALGORITHM,
      iv: iv,
    },
    key,
    arrayBuffer
  );

  // Generate salt (for key derivation if needed, though we're using direct keys)
  const salt = window.crypto.getRandomValues(new Uint8Array(SALT_LENGTH));

  return {
    encrypted,
    salt: bufferToBase64(salt),
    iv: bufferToBase64(iv),
  };
}

/**
 * Decrypt a file using AES-GCM
 * @param encryptedData - The encrypted data
 * @param key - The encryption key
 * @param salt - Salt used during encryption
 * @param iv - Initialization vector
 * @returns Decrypted data
 */
export async function decryptFile(
  encryptedData: ArrayBuffer,
  key: CryptoKey,
  salt: string,
  iv: string
): Promise<ArrayBuffer> {
  const ivBuffer = base64ToBuffer(iv);

  const decrypted = await window.crypto.subtle.decrypt(
    {
      name: ALGORITHM,
      iv: ivBuffer as any, // Cast to any to bypass TypeScript strict typing
    },
    key,
    encryptedData
  );

  return decrypted;
}

/**
 * Generate SHA-256 hash of a token
 */
export async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  return bufferToHex(hashBuffer);
}

/**
 * Hash file content (SHA-256)
 */
export async function hashFile(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', arrayBuffer);
  return bufferToHex(hashBuffer);
}

/**
 * Generate a random one-time token
 */
export function generateToken(): string {
  const array = new Uint8Array(32);
  window.crypto.getRandomValues(array);
  return bufferToHex(array.buffer);
}

/**
 * Export crypto key to base64 string (for QR code storage)
 */
export async function exportKey(key: CryptoKey): Promise<string> {
  const exported = await window.crypto.subtle.exportKey('raw', key);
  return bufferToBase64(new Uint8Array(exported));
}

/**
 * Import crypto key from base64 string
 */
export async function importKey(keyData: string): Promise<CryptoKey> {
  const keyBuffer = base64ToBuffer(keyData);
  // Create a new ArrayBuffer copy to avoid SharedArrayBuffer issues
  const arrayBuffer = new ArrayBuffer(keyBuffer.byteLength);
  new Uint8Array(arrayBuffer).set(keyBuffer);

  return await window.crypto.subtle.importKey(
    'raw',
    arrayBuffer,
    {
      name: ALGORITHM,
      length: KEY_LENGTH,
    },
    true,
    ['encrypt', 'decrypt']
  );
}

// Utility functions

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function bufferToBase64(buffer: Uint8Array): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Convert ArrayBuffer to Blob
 */
export function arrayBufferToBlob(buffer: ArrayBuffer, mimeType: string): Blob {
  return new Blob([buffer], { type: mimeType });
}

/**
 * Convert Blob to ArrayBuffer
 */
export function blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert blob to array buffer'));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(blob);
  });
}
