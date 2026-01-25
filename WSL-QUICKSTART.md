# 🚀 WSL Quick Start - BLIXA MVP

Setup project BLIXA di WSL dalam 5 menit!

## Langkah 1: Clone & Masuk ke Folder

```bash
# Jika belum clone
git clone <repository-url>
cd blixa-mvp
```

## Langkah 2: Jalankan Setup Otomatis

```bash
# Berikan permission
chmod +x setup-wsl.sh

# Jalankan setup
./setup-wsl.sh
```

Script akan otomatis:
- ✅ Install Node.js (jika belum)
- ✅ Install PostgreSQL (jika belum)
- ✅ Setup database 'blixa'
- ✅ Install dependencies backend & frontend
- ✅ Generate Prisma client
- ✅ Run migrations
- ✅ Build Sui contract

## Langkah 3: Konfigurasi Environment

### Backend (.env)

Edit `backend/.env`:

```bash
nano backend/.env
```

Minimal configuration:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/blixa"
SUI_PACKAGE_ID="0x..."  # Dari step 4
SUI_PRIVATE_KEY="suiprivkey..."  # Dari sui client
ENCRYPTION_KEY="..."  # Generate dengan command di bawah
PORT=3001
```

Generate encryption key:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Frontend (.env.local)

Edit `frontend/.env.local`:

```bash
nano frontend/.env.local
```

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_SUI_NETWORK=testnet
```

## Langkah 4: Deploy Sui Contract

```bash
cd sui-contract

# Build
sui move build

# Publish (butuh SUI testnet)
sui client publish --gas-budget 100000000
```

**Copy Package ID** dari output, lalu update di `backend/.env`:
```env
SUI_PACKAGE_ID="0x..."
```

## Langkah 5: Jalankan Aplikasi

### Opsi A: Manual (2 Terminal)

Terminal 1 - Backend:
```bash
cd backend
npm run dev
```

Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
```

### Opsi B: Menggunakan Helper Script

```bash
# Berikan permission
chmod +x wsl-commands.sh

# Start semua services
./wsl-commands.sh start

# Check status
./wsl-commands.sh status

# View logs
./wsl-commands.sh logs

# Stop semua
./wsl-commands.sh stop
```

## Langkah 6: Akses Aplikasi

Buka browser di Windows:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001/api

## 🎯 Testing

1. **User Portal** (http://localhost:3000)
   - Klik "User Portal"
   - Connect Sui Wallet
   - Upload PDF
   - Generate QR

2. **Print Agent** (tab baru)
   - Klik "Print Agent"
   - Paste QR payload
   - Validate & Print

## 🛠️ Helper Commands

```bash
# Setup lengkap
./wsl-commands.sh setup

# Start services
./wsl-commands.sh start

# Stop services
./wsl-commands.sh stop

# Restart services
./wsl-commands.sh restart

# Reset database
./wsl-commands.sh db-reset

# Run migrations
./wsl-commands.sh db-migrate

# Build Sui contract
./wsl-commands.sh sui-build

# Publish Sui contract
./wsl-commands.sh sui-publish

# Check status
./wsl-commands.sh status

# View logs
./wsl-commands.sh logs

# Clean node_modules
./wsl-commands.sh clean
```

## 🐛 Troubleshooting

### PostgreSQL tidak jalan

```bash
sudo service postgresql start
sudo service postgresql status
```

### Port sudah dipakai

```bash
# Check port
lsof -i :3000
lsof -i :3001

# Kill process
kill -9 <PID>
```

### Sui CLI tidak ditemukan

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env

# Install Sui
cargo install --locked --git https://github.com/MystenLabs/sui.git --branch testnet sui
```

### Database migration error

```bash
cd backend
npm run prisma:migrate reset
npm run prisma:generate
npm run prisma:migrate
```

## 📚 Dokumentasi Lengkap

- [SETUP-WSL.md](SETUP-WSL.md) - Setup detail untuk WSL
- [RUN.md](RUN.md) - Step-by-step running guide
- [SETUP.md](SETUP.md) - Complete setup & troubleshooting

## 💡 Tips WSL

### 1. Auto-start PostgreSQL

Tambahkan ke `~/.bashrc`:
```bash
sudo service postgresql start
```

### 2. Akses File dari Windows

```
\\wsl$\Ubuntu\home\username\blixa-mvp
```

### 3. VS Code di WSL

```bash
code .
```

### 4. Check WSL Version

```bash
wsl -l -v
```

Pastikan menggunakan WSL2 untuk performa terbaik.

---

**Selamat coding! 🎉**

Jika ada masalah, baca dokumentasi lengkap atau check logs dengan `./wsl-commands.sh logs`
