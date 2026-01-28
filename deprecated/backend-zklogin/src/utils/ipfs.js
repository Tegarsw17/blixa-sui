import axios from 'axios';
import { logger } from './logger.js';

const IPFS_API_URL = process.env.IPFS_API_URL;
const IPFS_API_KEY = process.env.IPFS_API_KEY;
const IPFS_API_SECRET = process.env.IPFS_API_SECRET;

// Upload encrypted file to IPFS (using Pinata for MVP)
export async function uploadToIPFS(buffer, filename) {
  try {
    const formData = new FormData();
    const blob = new Blob([buffer]);
    formData.append('file', blob, filename);

    const response = await axios.post(
      `${IPFS_API_URL}/pinning/pinFileToIPFS`,
      formData,
      {
        headers: {
          'pinata_api_key': IPFS_API_KEY,
          'pinata_secret_api_key': IPFS_API_SECRET,
        },
      }
    );

    const cid = response.data.IpfsHash;
    logger.info({ cid, filename }, 'File uploaded to IPFS');
    return cid;
  } catch (error) {
    logger.error({ error }, 'IPFS upload failed');
    throw new Error('Failed to upload to IPFS');
  }
}

// Download file from IPFS
export async function downloadFromIPFS(cid) {
  try {
    const gateway = process.env.IPFS_GATEWAY || 'https://ipfs.io/ipfs/';
    const url = `${gateway}${cid}`;
    
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 30000,
    });

    logger.info({ cid }, 'File downloaded from IPFS');
    return Buffer.from(response.data);
  } catch (error) {
    logger.error({ error, cid }, 'IPFS download failed');
    throw new Error('Failed to download from IPFS');
  }
}

// Unpin file from IPFS (cleanup)
export async function unpinFromIPFS(cid) {
  try {
    await axios.delete(
      `${IPFS_API_URL}/pinning/unpin/${cid}`,
      {
        headers: {
          'pinata_api_key': IPFS_API_KEY,
          'pinata_secret_api_key': IPFS_API_SECRET,
        },
      }
    );

    logger.info({ cid }, 'File unpinned from IPFS');
  } catch (error) {
    logger.error({ error, cid }, 'IPFS unpin failed');
    // Don't throw - cleanup is best effort
  }
}
