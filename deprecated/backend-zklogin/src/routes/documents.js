import express from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { encryptFile, hashFile, generateKey } from '../utils/encryption.js';
import { uploadToIPFS } from '../utils/ipfs.js';
import { requireAuth } from './auth.js';
import { logger } from '../utils/logger.js';
import { cacheFile } from '../utils/cache.js';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files allowed'));
    }
  },
});

// Upload document - encrypt and store on IPFS
router.post('/upload', requireAuth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileBuffer = req.file.buffer;
    const fileHash = hashFile(fileBuffer);
    const encryptionKey = generateKey();
    const encryptedBuffer = encryptFile(fileBuffer, encryptionKey);

    // Upload encrypted file to IPFS
    const cid = await uploadToIPFS(encryptedBuffer, `${fileHash}.enc`);

    // Generate document ID
    const documentId = uuidv4();

    // Cache file metadata temporarily (5 minutes)
    const metadata = {
      id: documentId,
      ownerId: req.userAddress,
      filename: req.file.originalname,
      size: req.file.size,
      hash: fileHash,
      cid,
      encryptionKey, // Will be included in QR code
      createdAt: new Date().toISOString(),
    };

    cacheFile(documentId, metadata);

    logger.info({ documentId, cid }, 'Document uploaded to IPFS');

    res.json({
      id: documentId,
      filename: metadata.filename,
      size: metadata.size,
      hash: fileHash,
      cid,
      createdAt: metadata.createdAt,
    });
  } catch (error) {
    logger.error({ error }, 'Upload failed');
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Get document metadata (from cache or blockchain)
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const documentId = req.params.id;
    
    // Try to get from cache first
    const metadata = getFile(documentId);
    
    if (!metadata) {
      return res.status(404).json({ error: 'Document not found or expired' });
    }

    if (metadata.ownerId !== req.userAddress) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({
      id: metadata.id,
      filename: metadata.filename,
      size: metadata.size,
      hash: metadata.hash,
      cid: metadata.cid,
      createdAt: metadata.createdAt,
    });
  } catch (error) {
    logger.error({ error }, 'Failed to get document');
    res.status(500).json({ error: 'Failed to get document' });
  }
});

export default router;
