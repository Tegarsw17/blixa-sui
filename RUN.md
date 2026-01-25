# Quick Run Guide

## Prerequisites Check

1. Node.js installed: `node --version` (harus 18+)
2. PostgreSQL installed dan running
3. Sui CLI installed: `sui --version`

## Step 1: Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend (terminal baru)
cd frontend
npm install
```

## Step 2: Setup Environment

### Backend (.env)
```bash
cd backend
copy .env.example .env
```

Edit `backend/.env`:
```
PORT=3001
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/blixa?schema=public"
SUI_NETWORK=testnet
SUI_PACKAGE_ID=0x... # Akan diisi setelah deploy contract
SUI_PRIVATE_KEY=suiprivkey... # Dari sui client
STORAGE_PATH=./storage/vault
MAX_FILE_SIZE=10485760
SESSION_EXPIRY_MINUTES=10
ENCRYPTION_KEY=your-32-byte-encryption-key-here-change-this-to-random
```

### Frontend (.env.local)
```bash
cd frontend
copy .env.example .env.local
```

Edit `frontend/.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_SUI_NETWORK=testnet
```

## Step 3: Setup Database

```bash
cd backend

# Create database
# Buka psql atau pgAdmin, create database "blixa"

# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate
```

## Step 4: Deploy Smart Contract

```bash
cd sui-contract

# Build
sui move build

# Publish (pastikan ada SUI di wallet untuk gas)
sui client publish --gas-budget 100000000

# Copy PACKAGE_ID dari output
# Update backend/.env dengan PACKAGE_ID tersebut
```

## Step 5: Run Applications

### Terminal 1 - Backend
```bash
cd backend
npm run dev
```

Tunggu sampai muncul: "BLIXA Backend running on port 3001"

### Terminal 2 - Frontend
```bash
cd frontend
npm run dev
```

Tunggu sampai muncul: "Ready on http://localhost:3000"

## Step 6: Test

1. Buka browser: http://localhost:3000
2. Install Sui Wallet extension jika belum
3. Connect wallet
4. Pilih "User Portal" untuk upload dokumen
5. Pilih "Print Agent" untuk scan QR dan print

## Common Issues

### "Cannot connect to database"
- Pastikan PostgreSQL running
- Check DATABASE_URL di backend/.env
- Test: `psql -U postgres -d blixa`

### "Module not found" errors
- Run `npm install` di folder yang error
- Restart terminal/IDE

### "Sui transaction failed"
- Pastikan ada SUI di wallet
- Request testnet SUI di Discord Sui
- Check SUI_PACKAGE_ID sudah benar

### TypeScript errors di frontend
- Run: `cd frontend && npm install`
- Restart IDE
- Errors akan hilang setelah dependencies terinstall

### Port already in use
- Backend: ubah PORT di .env
- Frontend: `npm run dev -- -p 3001`

## Success Indicators

✅ Backend: "BLIXA Backend running on port 3001"
✅ Frontend: "Ready on http://localhost:3000"
✅ Database: Prisma migrations applied
✅ Contract: Package ID tersimpan di .env
✅ Browser: Dapat connect wallet dan lihat UI

## Next Steps

Setelah semua running:
1. Upload PDF di User Portal
2. Generate QR Code
3. Copy QR payload
4. Buka Print Agent
5. Paste QR payload
6. Print document
7. Verify file terhapus dan transaction di Sui Explorer
