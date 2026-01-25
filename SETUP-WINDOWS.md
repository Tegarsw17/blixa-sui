# Setup BLIXA MVP di Windows (Native)

Panduan lengkap setup BLIXA MVP di Windows tanpa WSL.

## Prerequisites yang Harus Diinstall

### 1. Node.js 20 LTS ⭐ WAJIB

**Download:** https://nodejs.org/

- Pilih versi **20.x LTS** (bukan 18.x yang sudah deprecated)
- Download installer Windows (.msi)
- Jalankan installer, ikuti wizard
- Centang "Automatically install necessary tools"

**Verify:**
```powershell
node --version  # harus v20.x.x
npm --version
```

### 2. PostgreSQL ⭐ WAJIB

**Download:** https://www.postgresql.org/download/windows/

- Download PostgreSQL 15 atau 16
- Jalankan installer
- Set password untuk user `postgres` (ingat password ini!)
- Port default: 5432
- Install Stack Builder (optional)

**Verify:**
```powershell
psql --version
```

**Tambahkan ke PATH** (jika belum):
- Lokasi default: `C:\Program Files\PostgreSQL\16\bin`
- System Properties → Environment Variables → Path → Edit → New
- Tambahkan path PostgreSQL bin

### 3. Git for Windows ⭐ WAJIB

**Download:** https://git-scm.com/download/win

- Download installer
- Jalankan dengan default settings
- Pilih "Use Git from Windows Command Prompt"

**Verify:**
```powershell
git --version
```

### 4. Rust & Cargo (untuk Sui CLI) ⭐ WAJIB

**Download:** https://rustup.rs/

- Download `rustup-init.exe`
- Jalankan installer
- Pilih default installation
- Restart terminal setelah install

**Verify:**
```powershell
rustc --version
cargo --version
```

### 5. Sui CLI ⭐ WAJIB

**Install via Cargo:**
```powershell
cargo install --locked --git https://github.com/MystenLabs/sui.git --branch testnet sui
```

⏱️ Proses ini bisa memakan waktu 10-30 menit tergantung koneksi dan spek komputer.

**Verify:**
```powershell
sui --version
```

### 6. Visual Studio Code (Optional tapi Recommended)

**Download:** https://code.visualstudio.com/

Extensions yang berguna:
- ESLint
- Prettier
- Prisma
- Move (untuk Sui smart contract)

### 7. Sui Wallet Extension (untuk Testing)

**Install di Browser:**
- Chrome/Edge: https://chrome.google.com/webstore/detail/sui-wallet
- Firefox: https://addons.mozilla.org/en-US/firefox/addon/sui-wallet/

## Setup Otomatis (Recommended)

### 1. Buka PowerShell sebagai Administrator

Klik kanan pada Start Menu → Windows PowerShell (Admin)

### 2. Enable Script Execution

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### 3. Jalankan Setup Script

```powershell
cd path\to\blixa-mvp
.\setup-windows.ps1
```

Script akan otomatis:
- ✅ Check semua prerequisites
- ✅ Setup database 'blixa'
- ✅ Install dependencies backend & frontend
- ✅ Generate Prisma client
- ✅ Run database migrations
- ✅ Build Sui contract
- ✅ Create .env files

## Setup Manual (jika script gagal)

### 1. Setup Database

Buka Command Prompt atau PowerShell:

```powershell
# Login ke PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE blixa;

# Exit
\q
```

### 2. Setup Backend

```powershell
cd backend

# Install dependencies
npm install

# Copy .env
copy .env.example .env

# Edit .env (gunakan notepad atau VS Code)
notepad .env
```

Edit file `.env`:
```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/blixa"
SUI_PACKAGE_ID="your_package_id_here"
SUI_PRIVATE_KEY="your_private_key_here"
ENCRYPTION_KEY="generate_random_32_bytes_here"
PORT=3001
```

**Generate encryption key:**
```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Setup Prisma:**
```powershell
npm run prisma:generate
npm run prisma:migrate
```

### 3. Setup Frontend

```powershell
cd frontend

# Install dependencies
npm install

# Copy .env
copy .env.example .env.local

# Edit .env.local
notepad .env.local
```

Edit file `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_SUI_NETWORK=testnet
```

### 4. Build & Deploy Sui Contract

```powershell
cd sui-contract

# Build contract
sui move build

# Setup Sui client (jika belum)
sui client

# Publish ke testnet
sui client publish --gas-budget 100000000
```

**Copy Package ID** dari output, lalu update di `backend\.env`:
```env
SUI_PACKAGE_ID="0x..."
```

## Menjalankan Aplikasi

### Opsi 1: Manual (2 Terminal)

**Terminal 1 - Backend:**
```powershell
cd backend
npm run dev
```

Output yang benar:
```
BLIXA Backend running on port 3001
Database connected
```

**Terminal 2 - Frontend:**
```powershell
cd frontend
npm run dev
```

Output yang benar:
```
Ready on http://localhost:3000
```

### Opsi 2: Menggunakan Batch Script

Buat file `start.bat`:
```batch
@echo off
start "Backend" cmd /k "cd backend && npm run dev"
timeout /t 3
start "Frontend" cmd /k "cd frontend && npm run dev"
```

Jalankan:
```powershell
.\start.bat
```

### Akses Aplikasi

Buka browser:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001/api

## Troubleshooting

### 1. Node.js tidak ditemukan

**Problem:** `'node' is not recognized as an internal or external command`

**Solution:**
- Restart terminal setelah install Node.js
- Check PATH: `echo $env:PATH`
- Reinstall Node.js dan centang "Add to PATH"

### 2. PostgreSQL tidak bisa connect

**Problem:** `Connection refused` atau `password authentication failed`

**Solution:**
```powershell
# Check service status
Get-Service -Name postgresql*

# Start service
Start-Service postgresql-x64-16

# Test connection
psql -U postgres -d blixa
```

Edit `pg_hba.conf` jika perlu:
- Lokasi: `C:\Program Files\PostgreSQL\16\data\pg_hba.conf`
- Ubah method dari `scram-sha-256` ke `md5` atau `trust`
- Restart PostgreSQL service

### 3. Sui CLI tidak ditemukan

**Problem:** `'sui' is not recognized`

**Solution:**
```powershell
# Check Cargo bin path
echo $env:USERPROFILE\.cargo\bin

# Add to PATH manually
$env:PATH += ";$env:USERPROFILE\.cargo\bin"

# Atau tambahkan permanent via System Properties
```

### 4. Port sudah digunakan

**Problem:** `Port 3000 is already in use`

**Solution:**
```powershell
# Check port 3000
netstat -ano | findstr :3000

# Kill process
taskkill /PID <PID> /F
```

### 5. Prisma migration error

**Problem:** `Migration failed`

**Solution:**
```powershell
cd backend

# Reset database
npm run prisma:migrate reset

# Generate & migrate
npm run prisma:generate
npm run prisma:migrate
```

### 6. Permission denied saat npm install

**Problem:** `EACCES: permission denied`

**Solution:**
```powershell
# Run as Administrator
# Atau clear npm cache
npm cache clean --force
```

### 7. Sui build error

**Problem:** `error: could not compile`

**Solution:**
```powershell
# Update Sui CLI
cargo install --locked --git https://github.com/MystenLabs/sui.git --branch testnet sui --force

# Clean build
cd sui-contract
Remove-Item -Recurse -Force build
sui move build
```

## Testing Flow

### 1. User Upload Document

1. Buka http://localhost:3000
2. Klik "User Portal"
3. Connect Sui Wallet (install extension di browser)
4. Upload PDF file (max 10MB)
5. Generate QR Code
6. Copy QR payload

### 2. Print Agent

1. Buka tab baru http://localhost:3000
2. Klik "Print Agent"
3. Paste QR payload
4. Validate & Print
5. File otomatis dihapus

### 3. Verify Blockchain

1. Copy transaction hash dari UI
2. Buka https://suiexplorer.com/txblock/{TX_HASH}?network=testnet
3. Lihat events: SessionCreated, SessionPrinted, SessionDestroyed

## Tips Windows

### 1. PowerShell Aliases

Tambahkan ke PowerShell profile (`$PROFILE`):

```powershell
# Edit profile
notepad $PROFILE

# Tambahkan aliases
function blixa-backend { cd C:\path\to\blixa-mvp\backend; npm run dev }
function blixa-frontend { cd C:\path\to\blixa-mvp\frontend; npm run dev }
function blixa-status { 
    Get-Process node -ErrorAction SilentlyContinue
    Get-Service postgresql* -ErrorAction SilentlyContinue
}
```

### 2. Windows Terminal

Install Windows Terminal dari Microsoft Store untuk better experience:
- Multiple tabs
- Split panes
- Custom themes

### 3. Auto-start PostgreSQL

Set PostgreSQL service ke Automatic:
```powershell
Set-Service -Name postgresql-x64-16 -StartupType Automatic
```

### 4. VS Code Integrated Terminal

Buka project di VS Code:
```powershell
code .
```

Split terminal (Ctrl+Shift+5) untuk run backend & frontend bersamaan.

## Environment Variables

### Backend (.env)

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/blixa"

# Sui Configuration
SUI_PACKAGE_ID="0x..."
SUI_PRIVATE_KEY="suiprivkey..."
SUI_NETWORK="testnet"

# Security
ENCRYPTION_KEY="your-32-byte-hex-key"
JWT_SECRET="your-jwt-secret"

# Server
PORT=3001
NODE_ENV="development"

# File Storage
MAX_FILE_SIZE=10485760
STORAGE_PATH="./storage/vault"
```

### Frontend (.env.local)

```env
# API
NEXT_PUBLIC_API_URL=http://localhost:3001/api

# Sui
NEXT_PUBLIC_SUI_NETWORK=testnet
NEXT_PUBLIC_SUI_PACKAGE_ID=0x...

# Optional
NEXT_PUBLIC_ENABLE_DEVTOOLS=true
```

## Dokumentasi Lainnya

- [START-HERE.md](START-HERE.md) - Panduan awal
- [RUN.md](RUN.md) - Step-by-step running guide
- [SETUP.md](SETUP.md) - General setup
- [QUICK-REFERENCE.md](QUICK-REFERENCE.md) - Quick commands

## Checklist Setup

- [ ] Node.js 20 LTS installed
- [ ] PostgreSQL installed & running
- [ ] Git installed
- [ ] Rust & Cargo installed
- [ ] Sui CLI installed
- [ ] Database 'blixa' created
- [ ] Backend dependencies installed
- [ ] Frontend dependencies installed
- [ ] .env files configured
- [ ] Prisma client generated
- [ ] Database migrations run
- [ ] Sui contract built
- [ ] Sui contract published
- [ ] Package ID updated in .env
- [ ] Backend running on port 3001
- [ ] Frontend running on port 3000
- [ ] Sui Wallet extension installed

## Need Help?

Jika ada masalah:
1. Check error message di terminal
2. Baca section Troubleshooting di atas
3. Restart services
4. Check .env configuration
5. Verify all prerequisites installed

---

**Catatan:** Setup di Windows native lebih kompleks dari WSL. Jika memungkinkan, pertimbangkan menggunakan WSL untuk development experience yang lebih baik.
