# Setup Summary - BLIXA MVP di WSL

## ✅ Yang Sudah Dibuat

### 1. Setup Scripts
- **setup-wsl.sh** - Script otomatis untuk setup lengkap
  - Auto-detect dan install Node.js 20 LTS
  - Install PostgreSQL
  - Setup database
  - Install dependencies
  - Generate Prisma client
  - Run migrations
  - Build Sui contract

- **wsl-commands.sh** - Helper commands untuk development
  - `start` - Start backend & frontend
  - `stop` - Stop services
  - `restart` - Restart services
  - `status` - Check status
  - `logs` - View logs
  - `db-reset` - Reset database
  - `db-migrate` - Run migrations
  - `sui-build` - Build contract
  - `sui-publish` - Publish contract

### 2. Dokumentasi
- **SETUP-WSL.md** - Panduan lengkap setup di WSL
  - Setup otomatis & manual
  - Prerequisites
  - Troubleshooting
  - Tips WSL

- **WSL-QUICKSTART.md** - Quick start 5 menit
  - Step-by-step singkat
  - Helper commands
  - Testing flow

- **UPGRADE-NODEJS.md** - Panduan upgrade Node.js
  - Upgrade dari 18 ke 20
  - 3 cara upgrade (NodeSource, NVM, Script)
  - Troubleshooting

### 3. Updates
- **README.md** - Ditambahkan section WSL setup
- **setup-wsl.sh** - Updated untuk Node.js 20 LTS

## 🚀 Cara Menggunakan

### Quick Start (Recommended)

```bash
# 1. Berikan permission
chmod +x setup-wsl.sh wsl-commands.sh

# 2. Jalankan setup
./setup-wsl.sh

# 3. Edit .env files
nano backend/.env
nano frontend/.env.local

# 4. Deploy contract
cd sui-contract
sui client publish --gas-budget 100000000

# 5. Start services
./wsl-commands.sh start

# 6. Open browser
# http://localhost:3000
```

### Manual Setup

Lihat [SETUP-WSL.md](SETUP-WSL.md) untuk langkah manual.

## 📋 Prerequisites

- WSL2 dengan Ubuntu (atau distro Linux lainnya)
- Node.js 20+ (script akan auto-install)
- PostgreSQL (script akan auto-install)
- Sui CLI (perlu install manual)

## 🔧 Node.js Version

**PENTING:** Node.js 18 sudah deprecated!

Script akan otomatis:
- Detect versi Node.js yang terinstall
- Upgrade ke Node.js 20 LTS jika versi < 20
- Install Node.js 20 LTS jika belum ada

Jika sudah punya Node.js 18, lihat [UPGRADE-NODEJS.md](UPGRADE-NODEJS.md).

## 📁 File Structure

```
blixa-mvp/
├── setup-wsl.sh           # Setup otomatis
├── wsl-commands.sh        # Helper commands
├── SETUP-WSL.md          # Dokumentasi lengkap
├── WSL-QUICKSTART.md     # Quick start guide
├── UPGRADE-NODEJS.md     # Node.js upgrade guide
└── logs/                 # Log files (auto-created)
    ├── backend.log
    ├── frontend.log
    ├── backend.pid
    └── frontend.pid
```

## 🎯 Next Steps

1. **Jalankan setup:**
   ```bash
   ./setup-wsl.sh
   ```

2. **Configure environment:**
   - Edit `backend/.env`
   - Edit `frontend/.env.local`

3. **Deploy contract:**
   ```bash
   cd sui-contract
   sui client publish --gas-budget 100000000
   ```

4. **Start development:**
   ```bash
   ./wsl-commands.sh start
   ```

5. **Test aplikasi:**
   - User Portal: http://localhost:3000
   - Print Agent: http://localhost:3000

## 💡 Tips

### Auto-start PostgreSQL

Tambahkan ke `~/.bashrc`:
```bash
sudo service postgresql start
```

### VS Code di WSL

```bash
code .
```

### Check Status

```bash
./wsl-commands.sh status
```

### View Logs

```bash
./wsl-commands.sh logs
```

## 🐛 Common Issues

### Node.js 18 deprecated warning

**Solution:** Script akan otomatis upgrade ke Node.js 20. Atau manual:
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### PostgreSQL tidak jalan

**Solution:**
```bash
sudo service postgresql start
```

### Port sudah dipakai

**Solution:**
```bash
lsof -i :3000
kill -9 <PID>
```

### Sui CLI tidak ditemukan

**Solution:** Install manual:
```bash
cargo install --locked --git https://github.com/MystenLabs/sui.git --branch testnet sui
```

## 📚 Dokumentasi Lengkap

Untuk detail lebih lanjut, baca:
- [SETUP-WSL.md](SETUP-WSL.md) - Setup lengkap
- [WSL-QUICKSTART.md](WSL-QUICKSTART.md) - Quick start
- [UPGRADE-NODEJS.md](UPGRADE-NODEJS.md) - Upgrade Node.js
- [RUN.md](RUN.md) - Running guide
- [SETUP.md](SETUP.md) - General setup

---

**Ready to start!** 🚀

Jalankan `./setup-wsl.sh` untuk memulai setup otomatis.
