/**
 * Walrus Storage integration utilities
 * Handles upload and download operations with Walrus decentralized storage
 *
 * Walrus Testnet Status: Using publisher aggregator endpoints
 */

import { CONFIG } from './config';

// Storage key prefix for browser storage fallback
const BLOB_STORAGE_PREFIX = 'storage_blob_';

/**
 * Upload to Walrus via publisher using the official API format
 * Based on: https://github.com/MystenLabs/walrus/blob/main/docs/examples/javascript/blob_upload_download_webapi.html
 */
async function uploadToWalrusDirect(
  file: Blob,
  metadata?: { name?: string; description?: string }
): Promise<string> {
  // Walrus testnet publisher endpoints
  const publishers = [
    'https://publisher.walrus-testnet.walrus.space',
    'https://walrus-testnet.publisher.sui.io',
  ];

  // Number of epochs to store the blob (1 epoch ~ 24 hours on testnet)
  // Sessions expire in 10 minutes, so 1 epoch is plenty
  // Files are automatically garbage collected after this period
  const numEpochs = 1;

  // For shorter storage (not recommended), you can try:
  // const numEpochs = 1; // Minimum is typically 1

  for (const publisherUrl of publishers) {
    try {
      // Using the official API format: PUT /v1/blobs?epochs=${numEpochs}
      const endpoint = `${publisherUrl}/v1/blobs?epochs=${numEpochs}`;

      const response = await fetch(endpoint, {
        method: 'PUT', // Use PUT, not POST
        body: file,     // Send the Blob directly
      });

      if (response.ok) {
        const data = await response.json();

        // Handle both response types: "newlyCreated" and "alreadyCertified"
        const newlyCreated = data.newlyCreated;
        const alreadyCertified = data.alreadyCertified;

        if (newlyCreated) {
          // Extract the correct blob ID
          const blobObj = newlyCreated.blobObject;

          // IMPORTANT: Use blobId field for file content, not id field
          // - id: Sui object ID (not what we need)
          // - blobId: Walrus blob ID (for downloading the file)
          let blobId: string;
          if (blobObj && typeof blobObj === 'object' && blobObj.blobId) {
            blobId = blobObj.blobId; // Use the blobId field!
          } else if (typeof blobObj === 'string') {
            blobId = blobObj;
          } else {
            blobId = blobObj.id || JSON.stringify(blobObj);
          }

          return blobId;
        } else if (alreadyCertified) {
          return alreadyCertified.blobId;
        }
      }
    } catch (error) {
      // Silently try next publisher
    }
  }

  throw new Error('All Walrus publishers failed');
}

/**
 * Upload a file to Walrus storage
 * Returns just the blob ID (with prefix to identify backend)
 */
export async function uploadToWalrus(
  file: Blob,
  metadata?: { name?: string; description?: string }
): Promise<string> {
  try {
    // Try Walrus upload - returns the blob ID
    const blobId = await uploadToWalrusDirect(file, metadata);
    // Add prefix to identify this as a Walrus blob (for download logic)
    return `walrus_${blobId}`;
  } catch (walrusError) {
    // Walrus failed - use browser storage fallback
    const browserBlobId = await uploadToBrowserStorage(file, metadata);
    return `browser_${browserBlobId}`; // Add prefix for browser storage
  }
}

/**
 * Upload to browser storage as fallback
 */
async function uploadToBrowserStorage(
  file: Blob,
  metadata?: { name?: string; description?: string }
): Promise<string> {
  // Generate a blob ID (simple hash based on content and timestamp)
  const arrayBuffer = await file.arrayBuffer();
  const hash = await simpleHash(arrayBuffer);
  const blobId = `browser_${hash}_${Date.now()}`;

  // Store in IndexedDB (convert blob to array buffer first)
  const db = await getBlobDB();

  const tx = db.transaction([STORE_NAME], 'readwrite');
  const store = tx.objectStore(STORE_NAME);

  const data: BlobData = {
    id: blobId,
    data: arrayBuffer,
    mimeType: file.type,
    name: metadata?.name,
    description: metadata?.description,
    createdAt: Date.now(),
  };

  const request = store.put(data);

  // Wait for transaction to complete
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    request.onerror = () => reject(request.error);
  });

  return blobId;
}

/**
 * Download a file from Walrus storage
 * Using the official API format: /v1/blobs/${blobId}
 */
export async function downloadFromWalrus(blobId: string): Promise<Blob> {
  // Check if it's a Walrus blob
  if (blobId.startsWith('walrus_')) {
    const walrusId = blobId.replace('walrus_', '');

    // Walrus testnet aggregators
    const aggregators = [
      'https://aggregator.walrus-testnet.walrus.space',
      'https://walrus-testnet.aggregator.sui.io',
    ];

    for (const aggregatorUrl of aggregators) {
      // Using the official API format: /v1/blobs/${blobId}
      const endpoint = `${aggregatorUrl}/v1/blobs/${walrusId}`;

      try {
        const response = await fetch(endpoint);

        if (response.ok) {
          const blob = await response.blob();
          return blob;
        }
      } catch (error) {
        // Silently try next aggregator
      }
    }

    throw new Error(`Failed to download from Walrus: ${walrusId}`);
  }

  // Check if it's a browser storage blob
  if (blobId.startsWith('browser_')) {
    return await downloadFromBrowserStorage(blobId);
  }

  // Unknown format
  throw new Error(`Unknown blob ID format: ${blobId}`);
}

/**
 * Download from browser storage
 */
async function downloadFromBrowserStorage(blobId: string): Promise<Blob> {
  const db = await getBlobDB();

  const blobData = await getBlob(db, blobId);

  if (!blobData) {
    throw new Error(`Blob not found: ${blobId}`);
  }

  return new Blob([blobData.data], { type: blobData.mimeType || 'application/octet-stream' });
}

/**
 * Check if a blob exists on Walrus
 */
export async function checkBlobExists(blobId: string): Promise<boolean> {
  if (blobId.startsWith('browser_')) {
    const db = await getBlobDB();
    return await blobExists(db, blobId);
  }

  const aggregatorUrl = CONFIG.WALRUS_AGGREGATOR_URL;

  try {
    const response = await fetch(`${aggregatorUrl}/v1/${blobId}`, {
      method: 'HEAD',
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}

/**
 * Get blob metadata
 */
export async function getBlobMetadata(blobId: string): Promise<{
  size: number;
  exists: boolean;
}> {
  if (blobId.startsWith('browser_')) {
    const db = await getBlobDB();
    const blobData = await getBlob(db, blobId);
    return {
      size: blobData?.data.byteLength || 0,
      exists: !!blobData,
    };
  }

  const aggregatorUrl = CONFIG.WALRUS_AGGREGATOR_URL;

  try {
    const response = await fetch(`${aggregatorUrl}/v1/${blobId}`, {
      method: 'HEAD',
    });

    if (!response.ok) {
      return { size: 0, exists: false };
    }

    const contentLength = response.headers.get('content-length');
    return {
      size: contentLength ? parseInt(contentLength, 10) : 0,
      exists: true,
    };
  } catch (error) {
    return { size: 0, exists: false };
  }
}

/**
 * Delete a blob (browser storage only, Walrus is immutable)
 */
export async function deleteFromWalrus(blobId: string): Promise<void> {
  if (blobId.startsWith('browser_')) {
    const db = await getBlobDB();
    await removeBlob(db, blobId);
    return;
  }

  // Walrus storage is immutable - cannot delete
}

/**
 * Upload with retry logic
 */
export async function uploadToWalrusWithRetry(
  file: Blob,
  metadata?: { name?: string; description?: string },
  maxRetries = 3
): Promise<string> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await uploadToWalrus(file, metadata);
    } catch (error) {
      lastError = error as Error;

      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('All upload attempts failed');
}

/**
 * Download with retry logic
 */
export async function downloadFromWalrusWithRetry(
  blobId: string,
  maxRetries = 3
): Promise<Blob> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await downloadFromWalrus(blobId);
      return result;
    } catch (error) {
      lastError = error as Error;

      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('All download attempts failed');
}

// IndexedDB helpers for browser storage fallback

const DB_NAME = 'BlixaBlobStorage';
const DB_VERSION = 1;
const STORE_NAME = 'blobs';

interface BlobData {
  id: string;
  data: ArrayBuffer;
  mimeType?: string;
  name?: string;
  description?: string;
  createdAt: number;
}

function getBlobDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

function storeBlob(
  db: IDBDatabase,
  id: string,
  arrayBuffer: ArrayBuffer,
  mimeType: string,
  metadata?: { name?: string; description?: string }
): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const data: BlobData = {
      id,
      data: arrayBuffer,
      mimeType,
      name: metadata?.name,
      description: metadata?.description,
      createdAt: Date.now(),
    };

    const request = store.put(data);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

function getBlob(db: IDBDatabase, id: string): Promise<BlobData | null> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    const request = store.get(id);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

function blobExists(db: IDBDatabase, id: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    const request = store.count(id);
    request.onsuccess = () => resolve(request.result > 0);
    request.onerror = () => reject(request.error);
  });
}

function removeBlob(db: IDBDatabase, id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

function getAllBlobs(db: IDBDatabase): Promise<BlobData[]> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Simple hash function for generating blob IDs
 */
async function simpleHash(data: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
}

/**
 * Clear all blobs from browser storage
 */
export async function clearBlobStorage(): Promise<void> {
  const db = await getBlobDB();
  const transaction = db.transaction([STORE_NAME], 'readwrite');
  const store = transaction.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    const request = store.clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
