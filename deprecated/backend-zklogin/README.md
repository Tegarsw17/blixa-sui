# BLIXA Backend (zkLogin + IPFS - No Database)

Backend tanpa database - semua state disimpan di Sui blockchain dan IPFS.

## Key Features

✅ **No Database Required**
- Session data stored on Sui blockchain
- Files stored on IPFS (encrypted)
- Temporary cache in-memory (auto-cleanup)

✅ **zkLogin Authentication**
- Google/Facebook/Apple login via zkLogin
- No password needed
- Privacy-preserving

✅ **Decentralized Storage**
- IPFS for encrypted files
- Sui blockchain for metadata
- Auto-cleanup after print

## Architecture

```
User Upload → Encrypt → IPFS → Create Session on Sui
                                      ↓
Agent Scan QR → Validate Token → Download from IPFS → Decrypt → Print
                                      ↓
                            Mark Printed on Sui → Unpin from IPFS
```

## Setup

```bash
npm install
```

## Environment

```env
# No DATABASE_URL needed!
SUI_NETWORK=testnet
SUI_PACKAGE_ID=0x...
SUI_PRIVATE_KEY=suiprivkey...

# IPFS (using Pinata for MVP)
IPFS_API_URL=https://api.pinata.cloud
IPFS_API_KEY=your-key
IPFS_API_SECRET=your-secret

# zkLogin
ZKLOGIN_SALT=your-random-salt
```

## Run

```bash
npm run dev
```

## Data Flow

### Upload
1. User uploads PDF
2. File encrypted (AES-256-GCM)
3. Upload to IPFS → get CID
4. Cache metadata in-memory (5 min)

### Create Session
1. User creates print session
2. All data stored on Sui blockchain:
   - Document hash
   - IPFS CID
   - Filename, size
   - Token hash
   - Encryption key hash
3. QR contains: sessionId, token, encryptionKey, CID

### Print
1. Agent scans QR
2. Validate token against blockchain
3. Download from IPFS using CID
4. Decrypt using key from QR
5. Stream to agent
6. Mark printed on blockchain
7. Unpin from IPFS
8. Destroy session on blockchain

## No Database Benefits

- ✅ No PostgreSQL setup needed
- ✅ Fully decentralized
- ✅ Immutable audit trail
- ✅ Lower infrastructure cost
- ✅ Easier deployment
- ✅ Better privacy (no central DB)

## Caching

In-memory cache for performance:
- Session cache: 10 minutes TTL
- File metadata cache: 5 minutes TTL
- Auto-cleanup every 5 minutes

## IPFS Options

### Option 1: Pinata (Recommended for MVP)
- Easy setup
- Free tier available
- Reliable

### Option 2: Local IPFS Node
```bash
ipfs daemon
```
Set `IPFS_API_URL=http://localhost:5001`

### Option 3: Infura IPFS
- Similar to Pinata
- Good for production

## Security

- Files encrypted before IPFS upload
- Encryption key only in QR code
- Token hashed on blockchain
- One-time use enforced
- Auto-cleanup after print

## API Endpoints

Same as database version, but:
- No database queries
- All data from blockchain/IPFS
- Faster for reads (cached)
- More reliable (decentralized)
