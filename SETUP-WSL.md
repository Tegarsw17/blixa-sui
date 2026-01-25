# Setup BLIXA MVP di WSL (Windows Subsystem for Linux)

## Prerequisites

Sebelum mulai, pastikan sudah install:
- Windows 10/11 dengan WSL2 enabled
- Ubuntu di WSL (atau distro Linux lainnya)

**Note:** Script akan otomatis install Node.js 20 LTS (Node.js 18 sudah deprecated)

## Cara Install WSL (jika belum)

Buka PowerShell sebagai Administrator dan jalankan:

```powershell
wsl --install
```

Restart komputer, lalu buka Ubuntu dari Start Menu.

## Setup Otomatis (Recommended)

Jalankan script setup otomatis:

```bash
# Berikan permission execute
chmod +x setup-wsl.sh

# Jalankan script
./setup-wsl.sh
```

Script akan otomatis:
- ✅ Check dan install Node.js 18+
- ✅ Check dan install PostgreSQL
- ✅ Setup database 'blixa'
- ✅ Install dependencies backend & frontend
- ✅ Generate Prisma client
- ✅ Run database migrations
- ✅ Build Sui contract
- ✅ Create .env files

## Setup Manual (jika script gagal)

### 1. Install Node.js

```bash
# Install Node.js 20 LTS (recommended)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify
node --version  # harus 20+
npm --version
```

**Note:** Node.js 18 sudah deprecated. Gunakan Node.js 20 LTS atau lebih baru.

### 2. Install PostgreSQL

```bash
# Install PostgreSQL
sudo apt-get update
sudo apt-get install -y postgresql postgresql-contrib

# Start service
sudo service postgresql start

# Create database
sudo -u postgres psql -c "CREATE DATABASE blixa;"

# Verify
psql --version
```

### 3. Install Sui CLI

```bash
# Install Rust (jika belum)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env

# Install Sui CLI
cargo install --locked --git https://github.com/MystenLabs/sui.git --branch testnet sui

# Verify
sui --version
```

### 4. Setup Backend

```bash
cd backend

# Install dependencies
npm install

# Copy .env
cp .env.example .env

# Edit .env (gunakan nano atau vim)
nano .env
```

Edit file .env:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/blixa"
SUI_PACKAGE_ID="your_package_id_here"
SUI_PRIVATE_KEY="your_private_key_here"
ENCRYPTION_KEY="generate_random_32_bytes_here"
PORT=3001
```

Generate encryption key:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Setup Prisma:
```bash
npm run prisma:generate
npm run prisma:migrate
```

### 5. Setup Frontend

```bash
cd frontend

# Install dependencies
npm install

# Copy .env
cp .env.example .env.local

# Edit .env.local
nano .env.local
```

Edit file .env.local:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_SUI_NETWORK=testnet
```

### 6. Build & Deploy Sui Contract

```bash
cd sui-contract

# Build contract
sui move build

# Setup Sui client (jika belum)
sui client

# Publish ke testnet
sui client publish --gas-budget 100000000
```

Copy **Package ID** dari output, lalu update di `backend/.env`:
```env
SUI_PACKAGE_ID="0x..."
```

## Menjalankan Aplikasi

### Terminal 1 - Backend
```bash
cd backend
npm run dev
```

Output yang benar:
```
BLIXA Backend running on port 3001
Database connected
```

### Terminal 2 - Frontend
```bash
cd frontend
npm run dev
```

Output yang benar:
```
Ready on http://localhost:3000
```

### Akses Aplikasi

Buka browser di Windows dan akses:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001/api

## Tips WSL

### 1. Akses File WSL dari Windows

File WSL bisa diakses di Windows Explorer:
```
\\wsl$\Ubuntu\home\username\blixa-mvp
```

### 2. Start PostgreSQL Otomatis

Tambahkan ke `~/.bashrc`:
```bash
# Auto-start PostgreSQL
sudo service postgresql start
```

### 3. Port Forwarding

WSL2 otomatis forward port ke Windows, jadi localhost:3000 di WSL bisa diakses dari browser Windows.

### 4. VS Code di WSL

Install VS Code extension "Remote - WSL" untuk edit code langsung di WSL:
```bash
code .
```

## Troubleshooting

### PostgreSQL tidak bisa connect

```bash
# Check service status
sudo service postgresql status

# Start service
sudo service postgresql start

# Check port
sudo netstat -plnt | grep 5432
```

### Permission denied saat npm install

```bash
# Fix npm permissions
sudo chown -R $USER:$USER ~/.npm
sudo chown -R $USER:$USER node_modules
```

### Sui CLI tidak ditemukan

```bash
# Add cargo bin to PATH
echo 'export PATH="$HOME/.cargo/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

### Port sudah digunakan

```bash
# Check port 3000
lsof -i :3000

# Kill process
kill -9 <PID>
```

### Database migration error

```bash
cd backend

# Reset database
npm run prisma:migrate reset

# Generate & migrate
npm run prisma:generate
npm run prisma:migrate
```

## Testing Flow

### 1. User Upload Document

1. Buka http://localhost:3000
2. Klik "User Portal"
3. Connect Sui Wallet (install extension di browser)
4. Upload PDF file
5. Generate QR Code
6. Copy QR payload

### 2. Print Agent

1. Buka tab baru http://localhost:3000
2. Klik "Print Agent"
3. Paste QR payload
4. Validate & Print
5. File otomatis dihapus

### 3. Verify Blockchain

1. Copy transaction hash
2. Buka https://suiexplorer.com/txblock/{TX_HASH}?network=testnet
3. Lihat events: SessionCreated, SessionPrinted, SessionDestroyed

## Dokumentasi Lainnya

- [START-HERE.md](START-HERE.md) - Panduan awal
- [RUN.md](RUN.md) - Step-by-step running guide
- [SETUP.md](SETUP.md) - Detailed setup
- [QUICK-REFERENCE.md](QUICK-REFERENCE.md) - Quick commands

## Need Help?

Jika ada masalah:
1. Check error di terminal
2. Baca ERRORS-NORMAL.md
3. Restart services
4. Check .env configuration

---

**Catatan:** TypeScript errors sebelum `npm install` adalah NORMAL! ✅
