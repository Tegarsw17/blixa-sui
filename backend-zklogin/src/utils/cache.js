import NodeCache from 'node-cache';

// In-memory cache for temporary session data
// TTL = 10 minutes (session expiry)
const CACHE_TTL = parseInt(process.env.CACHE_TTL_SECONDS || '600');

export const sessionCache = new NodeCache({ 
  stdTTL: CACHE_TTL,
  checkperiod: 60,
  useClones: false
});

// Store session metadata temporarily
export function cacheSession(sessionId, data) {
  sessionCache.set(sessionId, data);
}

export function getSession(sessionId) {
  return sessionCache.get(sessionId);
}

export function deleteSession(sessionId) {
  sessionCache.del(sessionId);
}

// Store file temporarily before IPFS upload
export const fileCache = new NodeCache({ 
  stdTTL: 300, // 5 minutes
  checkperiod: 30,
  useClones: false
});

export function cacheFile(fileId, buffer) {
  fileCache.set(fileId, buffer);
}

export function getFile(fileId) {
  return fileCache.get(fileId);
}

export function deleteFile(fileId) {
  fileCache.del(fileId);
}
