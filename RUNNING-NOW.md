# ✅ Project BLIXA Sudah Running!

## Status Services

### ✅ Backend
- **Status:** Running
- **Port:** 3001
- **URL:** http://localhost:3001/api
- **Database:** PostgreSQL (blixa)

### ✅ Frontend
- **Status:** Running
- **Port:** 3000
- **URL:** http://localhost:3000

## Akses Aplikasi

Buka browser dan akses:
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3001/api

## Fitur yang Tersedia (Tanpa Sui Contract)

Saat ini project running **tanpa Sui smart contract**. Beberapa fitur yang bisa ditest:

### ✅ Yang Bisa Digunakan:
- Upload dokumen PDF
- Generate session
- Enkripsi file
- Database operations
- API endpoints

### ⚠️ Yang Belum Bisa (Butuh Sui Contract):
- Generate QR code dengan blockchain
- On-chain transaction
- Print verification via blockchain
- Session recording di blockchain

## Testing Tanpa Sui Contract

### 1. Test Backend API

```powershell
# Test health check
curl http://localhost:3001/api/health

# Test upload (gunakan Postman atau curl)
curl -X POST http://localhost:3001/api/documents/upload `
  -F "file=@path/to/your/document.pdf"
```

### 2. Test Frontend

1. Buka http://localhost:3000
2. Klik "User Portal"
3. Upload PDF file
4. Lihat response (akan error di bagian Sui transaction, ini normal)

## Setup Sui Contract (Nanti)

Untuk mengaktifkan fitur blockchain, ikuti langkah ini:

### 1. Install Sui CLI (jika belum)

```powershell
# Install Rust dulu
# Download dari: https://rustup.rs/

# Install Sui CLI
cargo install --locked --git https://github.com/MystenLabs/sui.git --branch testnet sui
```

### 2. Setup Sui Client

```powershell
# Initialize Sui client
sui client

# Check active address
sui client active-address

# Get testnet SUI (request di Discord)
# https://discord.gg/sui
# Channel: #testnet-faucet
```

### 3. Build & Deploy Contract

```powershell
cd sui-contract

# Build contract
sui move build

# Publish to testnet
sui client publish --gas-budget 100000000
```

### 4. Update .env dengan Package ID

Copy **Package ID** dari output publish, lalu update `backend\.env`:

```env
SUI_PACKAGE_ID=0x...  # Package ID dari publish
SUI_PRIVATE_KEY=suiprivkey...  # Dari sui client
```

### 5. Restart Backend

```powershell
# Stop backend (Ctrl+C di terminal backend)
# Start lagi
cd backend
npm run dev
```

## Logs & Monitoring

### View Backend Logs

Backend logs akan muncul di terminal tempat Anda menjalankan `npm run dev`.

Atau check file log (jika ada):
```powershell
Get-Content backend\logs\app.log -Tail 50 -Wait
```

### View Frontend Logs

Frontend logs muncul di terminal dan browser console (F12).

## Stop Services

### Stop Backend
- Tekan `Ctrl+C` di terminal backend

### Stop Frontend
- Tekan `Ctrl+C` di terminal frontend

### Stop Semua (PowerShell)

```powershell
# Kill by port
Get-Process -Id (Get-NetTCPConnection -LocalPort 3001).OwningProcess | Stop-Process -Force
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process -Force
```

## Restart Services

```powershell
# Backend
cd backend
npm run dev

# Frontend (terminal baru)
cd frontend
npm run dev
```

## Troubleshooting

### Port sudah digunakan

```powershell
# Check port 3000
netstat -ano | findstr :3000

# Kill process
taskkill /PID <PID> /F
```

### Database connection error

```powershell
# Check PostgreSQL service
Get-Service postgresql*

# Start service
Start-Service postgresql-x64-16

# Test connection
psql -U postgres -d blixa
```

### Backend tidak bisa connect ke database

Edit `backend\.env`, pastikan password benar:
```env
DATABASE_URL="postgresql://postgres:Denjaka@localhost:5432/blixa?schema=public"
```

## Environment Variables

### Backend (.env)

```env
PORT=3001
DATABASE_URL="postgresql://postgres:Denjaka@localhost:5432/blixa?schema=public"

# Sui (akan diisi setelah deploy contract)
SUI_NETWORK=testnet
SUI_PACKAGE_ID=0x_placeholder
SUI_PRIVATE_KEY=suiprivkey_placeholder

# Storage
STORAGE_PATH=./storage/vault
MAX_FILE_SIZE=10485760

# Session
SESSION_EXPIRY_MINUTES=10
ENCRYPTION_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
```

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_SUI_NETWORK=testnet
```

## Next Steps

1. ✅ Backend & Frontend running
2. ✅ Database setup complete
3. ⏳ Install Sui CLI (optional, untuk blockchain features)
4. ⏳ Deploy Sui contract (optional)
5. ⏳ Update .env dengan Package ID (optional)
6. ⏳ Test full flow dengan blockchain (optional)

## Dokumentasi Lainnya

- [SETUP-WINDOWS.md](SETUP-WINDOWS.md) - Setup lengkap Windows
- [SETUP-WSL.md](SETUP-WSL.md) - Setup lengkap WSL
- [RUN.md](RUN.md) - Running guide detail
- [README.md](README.md) - Project overview

---

**Status:** Backend & Frontend running successfully! 🎉

Sui contract deployment bisa dilakukan nanti jika ingin test fitur blockchain.
