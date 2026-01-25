# Upgrade Node.js di WSL

Node.js 18 sudah deprecated dan tidak lagi menerima security updates. Upgrade ke Node.js 20 LTS.

## Check Versi Saat Ini

```bash
node --version
```

Jika versi < 20, ikuti langkah di bawah.

## Cara 1: Menggunakan NodeSource (Recommended)

### Uninstall Node.js Lama

```bash
sudo apt-get remove nodejs
sudo apt-get purge nodejs
sudo apt-get autoremove
```

### Install Node.js 20 LTS

```bash
# Download dan install setup script
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Install Node.js
sudo apt-get install -y nodejs

# Verify
node --version  # harus v20.x.x
npm --version
```

## Cara 2: Menggunakan NVM (Node Version Manager)

NVM memudahkan switching antar versi Node.js.

### Install NVM

```bash
# Download dan install NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# Reload shell
source ~/.bashrc

# Verify
nvm --version
```

### Install Node.js 20

```bash
# Install Node.js 20 LTS
nvm install 20

# Set sebagai default
nvm use 20
nvm alias default 20

# Verify
node --version  # harus v20.x.x
```

### Switching Versi (jika perlu)

```bash
# List installed versions
nvm ls

# Install versi lain
nvm install 18
nvm install 22

# Switch ke versi tertentu
nvm use 20
nvm use 18

# Set default
nvm alias default 20
```

## Cara 3: Menggunakan Setup Script

Jika sudah punya `setup-wsl.sh`, jalankan ulang:

```bash
./setup-wsl.sh
```

Script akan otomatis detect dan upgrade Node.js ke versi 20.

## Setelah Upgrade

### Reinstall Dependencies

Setelah upgrade Node.js, reinstall dependencies project:

```bash
# Backend
cd backend
rm -rf node_modules package-lock.json
npm install

# Frontend
cd frontend
rm -rf node_modules package-lock.json
npm install

# Backend zkLogin (jika pakai)
cd backend-zklogin
rm -rf node_modules package-lock.json
npm install
```

### Verify Installation

```bash
# Check Node.js version
node --version

# Check npm version
npm --version

# Test backend
cd backend
npm run dev

# Test frontend (terminal baru)
cd frontend
npm run dev
```

## Troubleshooting

### Command 'node' not found setelah install

```bash
# Reload shell
source ~/.bashrc

# Atau restart terminal
```

### npm command not found

```bash
# Install npm
sudo apt-get install -y npm

# Atau reinstall Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Permission errors saat npm install

```bash
# Fix npm permissions
sudo chown -R $USER:$USER ~/.npm
sudo chown -R $USER:$USER node_modules
```

### Old version masih muncul

```bash
# Check semua node installations
which -a node

# Remove old installations
sudo apt-get purge nodejs
sudo rm -rf /usr/local/bin/node
sudo rm -rf /usr/local/lib/node_modules

# Reinstall
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

## Versi Node.js yang Direkomendasikan

| Versi | Status | Keterangan |
|-------|--------|------------|
| 22.x | Current | Latest features, tapi belum LTS |
| 20.x | LTS ✅ | **Recommended** - Active LTS sampai 2026 |
| 18.x | Maintenance | Deprecated, security updates only sampai 2025 |
| 16.x | EOL | End of Life, jangan dipakai |

## Kenapa Harus Upgrade?

1. **Security Updates** - Node.js 18 tidak lagi dapat security updates aktif
2. **Performance** - Node.js 20 lebih cepat dan efisien
3. **New Features** - Akses ke fitur-fitur terbaru
4. **Compatibility** - Dependencies modern butuh Node.js 20+
5. **Long-term Support** - Node.js 20 LTS supported sampai April 2026

## Resources

- [Node.js Release Schedule](https://nodejs.org/en/about/releases/)
- [NodeSource Distributions](https://github.com/nodesource/distributions)
- [NVM GitHub](https://github.com/nvm-sh/nvm)

---

**Recommendation:** Gunakan Node.js 20 LTS untuk production dan development.
