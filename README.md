# BLIXA MVP - Secure Print Platform

Platform cetak aman dengan one-time QR, zero retention, dan on-chain receipt menggunakan Sui blockchain.

## ⚠️ PENTING: Baca Ini Dulu!

**Jika Anda melihat 195 TypeScript errors, JANGAN PANIK!** 

Ini normal karena dependencies belum terinstall. Baca [START-HERE.md](START-HERE.md) untuk langkah pertama.

**TL;DR:**
```bash
cd backend && npm install
cd frontend && npm install
```

Error akan hilang setelah install selesai. ✅

---

## 🎯 Two Implementations Available

### 1. With Database (Traditional)
- **Location:** `backend/`
- PostgreSQL + Prisma
- Local file storage
- Wallet signature auth

### 2. No Database (Decentralized) ⭐ RECOMMENDED
- **Location:** `backend-zklogin/`
- **zkLogin** authentication (Google/Facebook)
- **IPFS** for file storage
- **Sui blockchain** for all state
- **No database setup needed!**

See [COMPARISON.md](COMPARISON.md) for detailed comparison.

---

## 🚀 Quick Start

### Setup di WSL (Windows Subsystem for Linux) 🐧

**Recommended untuk Windows users!** Setup otomatis dengan satu command:

```bash
# Berikan permission
chmod +x setup-wsl.sh

# Jalankan setup
./setup-wsl.sh
```

Script akan otomatis install semua dependencies dan setup database. Lihat [SETUP-WSL.md](SETUP-WSL.md) untuk detail.

### Setup Manual (No Database Version)

#### 1. Install Dependencies

```bash
# Backend (No Database)
cd backend-zklogin
npm install

# Frontend
cd frontend
npm install
```

**PENTING:** Error TypeScript akan hilang setelah `npm install` selesai. Restart IDE jika perlu.

#### 2. Setup IPFS (Pinata)

1. Sign up at [Pinata](https://pinata.cloud)
2. Get API Key & Secret
3. Update `backend-zklogin/.env`

#### 3. Deploy Smart Contract

```bash
cd sui-contract
sui move build
sui client publish --gas-budget 100000000
# Copy Package ID dari output
```

#### 4. Configure Environment

**Backend** - Edit `backend-zklogin/.env`:
```env
SUI_PACKAGE_ID=0x... # dari step 3
SUI_PRIVATE_KEY=suiprivkey... # dari sui client
IPFS_API_KEY=your-pinata-key
IPFS_API_SECRET=your-pinata-secret
ZKLOGIN_SALT=your-random-salt
```

**Frontend** - Edit `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-oauth-client-id
```

#### 5. Run

```bash
# Terminal 1 - Backend
cd backend-zklogin
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

Buka http://localhost:3000

## 📋 Struktur Project

```
blixa-mvp/
├── backend/              # Traditional (PostgreSQL)
├── backend-zklogin/      # No Database (zkLogin + IPFS) ⭐
├── frontend/             # Wallet version
├── frontend-zklogin/     # zkLogin version ⭐
└── sui-contract/         # Smart contract (shared)
```

## ✨ Fitur MVP

- ✅ **One-time printing** - QR tidak bisa dipakai ulang
- ✅ **Zero retention** - File otomatis dihapus setelah print
- ✅ **On-chain receipt** - Bukti permanen di Sui blockchain
- ✅ **Encrypted storage** - AES-256-GCM encryption
- ✅ **Auto-expiry** - Session otomatis expire (10 menit)
- ✅ **zkLogin auth** - Login dengan Google/Facebook (no wallet!)
- ✅ **IPFS storage** - Decentralized file storage
- ✅ **No database** - All state on blockchain

## 🔧 Tech Stack

### zkLogin Version (Recommended)
- **Frontend:** Next.js 14, TypeScript, Tailwind CSS, zkLogin SDK
- **Backend:** Express, Node-Cache (no database!)
- **Storage:** IPFS (Pinata)
- **Blockchain:** Sui Move smart contract
- **Auth:** zkLogin (Google/Facebook OAuth)

### Traditional Version
- **Frontend:** Next.js 14, TypeScript, Tailwind CSS, Sui dApp Kit
- **Backend:** Express, Prisma, PostgreSQL
- **Storage:** Local disk
- **Blockchain:** Sui Move smart contract
- **Auth:** Sui wallet signature

## 📖 Documentation

- [00-READ-ME-FIRST.txt](00-READ-ME-FIRST.txt) - ⭐ Start here!
- [START-HERE.md](START-HERE.md) - First steps
- [SETUP-WSL.md](SETUP-WSL.md) - 🐧 Setup untuk WSL (Windows)
- [WSL-QUICKSTART.md](WSL-QUICKSTART.md) - Quick start WSL (5 menit)
- [UPGRADE-NODEJS.md](UPGRADE-NODEJS.md) - Upgrade Node.js 18 → 20
- [ZKLOGIN-SETUP.md](ZKLOGIN-SETUP.md) - zkLogin setup guide
- [COMPARISON.md](COMPARISON.md) - Compare both versions
- [FINAL-SUMMARY.md](FINAL-SUMMARY.md) - Complete summary
- [INSTALL.md](INSTALL.md) - Installation guide
- [RUN.md](RUN.md) - Step-by-step running guide
- [SETUP.md](SETUP.md) - Complete setup & troubleshooting
- [QUICK-REFERENCE.md](QUICK-REFERENCE.md) - Quick commands

## 🎯 Testing Flow

1. **User Portal:**
   - Upload PDF (max 10MB)
   - Generate QR code
   - Copy QR payload

2. **Print Agent:**
   - Paste QR payload
   - Validate & print
   - File auto-deleted

3. **Verify:**
   - Check Sui Explorer for tx hash
   - Confirm file deleted from storage
   - Session status = DESTROYED

## ⚠️ Important Notes

- TypeScript errors sebelum `npm install` adalah normal
- Butuh Sui wallet extension untuk testing
- Request testnet SUI di Discord Sui (#testnet-faucet)
- File max 10MB untuk MVP

## 🔐 Security Features

- File encrypted at rest (AES-256-GCM)
- One-time token per session
- Server-side validation
- Auto-cleanup after print/expiry
- No file content stored on-chain (only hash)

## 📝 API Endpoints

### User
- `POST /api/documents/upload` - Upload PDF
- `POST /api/sessions/create` - Create print session
- `GET /api/sessions/:id` - Get session status
- `GET /api/sessions/:id/qr` - Get QR code

### Print Agent
- `POST /api/agent/sessions/:id/claim` - Claim session
- `GET /api/agent/sessions/:id/stream` - Stream file
- `POST /api/agent/sessions/:id/complete` - Complete print

## 🚧 Post-MVP Roadmap

- [ ] Real printer integration
- [ ] Payment system
- [ ] Multi-file support
- [ ] ZK proof implementation
- [ ] Admin dashboard
- [ ] Public SDK

## 📄 License

MIT

# blixa-sui
