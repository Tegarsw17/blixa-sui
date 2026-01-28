/**
 * Local storage utilities for session management
 * Uses sessionStorage for privacy (cleared on tab close)
 */

/**
 * Type definitions for storage
 */
export interface DocumentMetadata {
  blobId: string;
  filename: string;
  size: number;
  hash: string;
  createdAt: number;
  objectId?: string;
  sessionId?: string;
}

export interface SessionMetadata {
  objectId: string;
  sessionId: string;
  blobId: string;
  filename: string;
  fileSize: number;
  documentHash: string;
  oneTimeToken: string;
  encryptionKey: string;
  expiresAt: number;
  createdAt: number;
}

// Storage keys
const STORAGE_KEYS = {
  UPLOAD_HISTORY: 'blixa_upload_history',
  CURRENT_SESSION: 'blixa_current_session',
} as const;

/**
 * Save document to upload history (sessionStorage)
 */
export function saveToUploadHistory(document: DocumentMetadata): void {
  if (typeof window === 'undefined') return;

  try {
    const history = getUploadHistory();
    history.push(document);

    // Keep only last 10 documents
    const trimmedHistory = history.slice(-10);

    sessionStorage.setItem(STORAGE_KEYS.UPLOAD_HISTORY, JSON.stringify(trimmedHistory));
  } catch (error) {
    console.error('Failed to save to upload history:', error);
  }
}

/**
 * Get upload history from sessionStorage
 */
export function getUploadHistory(): DocumentMetadata[] {
  if (typeof window === 'undefined') return [];

  try {
    const data = sessionStorage.getItem(STORAGE_KEYS.UPLOAD_HISTORY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to get upload history:', error);
    return [];
  }
}

/**
 * Clear upload history
 */
export function clearUploadHistory(): void {
  if (typeof window === 'undefined') return;

  try {
    sessionStorage.removeItem(STORAGE_KEYS.UPLOAD_HISTORY);
  } catch (error) {
    console.error('Failed to clear upload history:', error);
  }
}

/**
 * Remove a specific document from history
 */
export function removeFromHistory(blobId: string): void {
  if (typeof window === 'undefined') return;

  try {
    const history = getUploadHistory();
    const filtered = history.filter(doc => doc.blobId !== blobId);
    sessionStorage.setItem(STORAGE_KEYS.UPLOAD_HISTORY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to remove from history:', error);
  }
}

/**
 * Save current session
 */
export function saveCurrentSession(session: SessionMetadata): void {
  if (typeof window === 'undefined') return;

  try {
    sessionStorage.setItem(STORAGE_KEYS.CURRENT_SESSION, JSON.stringify(session));
  } catch (error) {
    console.error('Failed to save current session:', error);
  }
}

/**
 * Get current session
 */
export function getCurrentSession(): SessionMetadata | null {
  if (typeof window === 'undefined') return null;

  try {
    const data = sessionStorage.getItem(STORAGE_KEYS.CURRENT_SESSION);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Failed to get current session:', error);
    return null;
  }
}

/**
 * Clear current session
 */
export function clearCurrentSession(): void {
  if (typeof window === 'undefined') return;

  try {
    sessionStorage.removeItem(STORAGE_KEYS.CURRENT_SESSION);
  } catch (error) {
    console.error('Failed to clear current session:', error);
  }
}

/**
 * Check if a session is expired
 */
export function isSessionExpired(expiresAt: number): boolean {
  return Date.now() >= expiresAt;
}

/**
 * Format session expiry time
 */
export function formatExpiryTime(expiresAt: number): string {
  const now = Date.now();
  const diff = expiresAt - now;

  if (diff <= 0) {
    return 'Expired';
  }

  const minutes = Math.floor(diff / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }

  return `${seconds}s`;
}

/**
 * Generate shareable link from session data
 */
export function generateShareableLink(session: SessionMetadata): string {
  if (typeof window === 'undefined') return '';

  const baseUrl = window.location.origin;
  const params = new URLSearchParams({
    objectId: session.objectId,
    blobId: session.blobId,
    encryptionKey: session.encryptionKey,
    token: session.oneTimeToken,
    filename: session.filename,
  });

  return `${baseUrl}/agent?${params.toString()}`;
}

/**
 * Parse session data from URL parameters
 */
export function parseSessionFromUrl(): SessionMetadata | null {
  if (typeof window === 'undefined') return null;

  console.log('🔍 Parsing URL:', window.location.search);

  const params = new URLSearchParams(window.location.search);

  const objectId = params.get('objectId');
  const blobId = params.get('blobId');
  const encryptionKey = params.get('encryptionKey');
  const token = params.get('token');
  const filename = params.get('filename');

  console.log('🔍 URL params:', { objectId, blobId, encryptionKey, token, filename });

  if (!objectId || !blobId || !encryptionKey || !token || !filename) {
    console.log('❌ URL parsing failed: missing required params');
    return null;
  }

  const session = {
    objectId,
    blobId,
    filename,
    fileSize: 0,
    documentHash: '',
    oneTimeToken: token,
    encryptionKey,
    expiresAt: 0,
    createdAt: 0,
    sessionId: '',
  };

  console.log('✅ URL parsed successfully:', session);
  return session;
}

/**
 * Clean up expired sessions from history
 */
export function cleanupExpiredSessions(): void {
  try {
    const history = getUploadHistory();
    const now = Date.now();

    // Filter out expired sessions
    const validHistory = history.filter(doc => {
      if (!doc.objectId) return true; // Keep if no session created yet
      return isSessionExpired(doc.createdAt + 10 * 60 * 1000); // 10 min default
    });

    sessionStorage.setItem(STORAGE_KEYS.UPLOAD_HISTORY, JSON.stringify(validHistory));
  } catch (error) {
    console.error('Failed to cleanup expired sessions:', error);
  }
}

/**
 * Get storage size (in bytes)
 */
export function getStorageSize(): number {
  if (typeof window === 'undefined') return 0;

  let total = 0;

  for (let key in sessionStorage) {
    if (sessionStorage.hasOwnProperty(key)) {
      total += sessionStorage[key].length + key.length;
    }
  }

  return total;
}

/**
 * Clear all Blixa storage data
 */
export function clearAllStorage(): void {
  if (typeof window === 'undefined') return;

  try {
    sessionStorage.removeItem(STORAGE_KEYS.UPLOAD_HISTORY);
    sessionStorage.removeItem(STORAGE_KEYS.CURRENT_SESSION);
  } catch (error) {
    console.error('Failed to clear all storage:', error);
  }
}
