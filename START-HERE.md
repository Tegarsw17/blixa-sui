# 🚀 START HERE - BLIXA MVP

## Langkah Pertama: Install Dependencies

**PENTING:** Sebelum melakukan apapun, install dependencies dulu!

```bash
# 1. Install Backend Dependencies
cd backend
npm install

# 2. Install Frontend Dependencies (terminal baru)
cd frontend
npm install
```

⏱️ Tunggu sampai selesai (bisa 2-5 menit tergantung koneksi)

## Setelah Install

TypeScript errors akan hilang. Jika masih ada, restart IDE.

## Next Steps

Setelah dependencies terinstall, ikuti guide ini:

### 📖 Pilih Guide Sesuai Kebutuhan:

1. **[RUN.md](RUN.md)** ⭐ RECOMMENDED
   - Step-by-step lengkap dari awal sampai running
   - Untuk yang baru pertama kali setup
   - Include troubleshooting

2. **[INSTALL.md](INSTALL.md)**
   - Quick installation guide
   - Untuk yang sudah familiar dengan setup

3. **[SETUP.md](SETUP.md)**
   - Detailed setup & configuration
   - Include production deployment guide

4. **[ERRORS-NORMAL.md](ERRORS-NORMAL.md)**
   - Penjelasan kenapa ada TypeScript errors
   - Cara menghilangkan errors

## Quick Check

Setelah install, cek apakah berhasil:

```bash
# Backend
cd backend
npm run dev
# Harus muncul: "BLIXA Backend running on port 3001"

# Frontend (terminal baru)
cd frontend
npm run dev
# Harus muncul: "Ready on http://localhost:3000"
```

## Prerequisites

Sebelum mulai, pastikan sudah install:
- ✅ Node.js 18+ (`node --version`)
- ✅ PostgreSQL (`psql --version`)
- ✅ Sui CLI (`sui --version`)
- ✅ Sui Wallet extension (browser)

## Project Structure

```
blixa-mvp/
├── frontend/          # Next.js app
│   ├── app/          # Pages (user, agent)
│   └── lib/          # API client
├── backend/          # Express API
│   ├── src/          # Source code
│   └── prisma/       # Database schema
└── sui-contract/     # Smart contract
    └── sources/      # Move files
```

## What This Project Does

BLIXA adalah secure print platform dengan fitur:
- 🔒 One-time printing (QR hanya bisa dipakai sekali)
- 🗑️ Zero retention (file otomatis dihapus)
- ⛓️ On-chain receipt (bukti di blockchain)
- 🔐 Encrypted storage (AES-256-GCM)

## Testing Flow

1. User upload PDF → dapat QR code
2. Print Agent scan QR → print dokumen
3. File otomatis dihapus
4. Transaction recorded di Sui blockchain

## Need Help?

- TypeScript errors? → [ERRORS-NORMAL.md](ERRORS-NORMAL.md)
- Installation issues? → [INSTALL.md](INSTALL.md)
- Running problems? → [RUN.md](RUN.md)
- Configuration? → [SETUP.md](SETUP.md)

## Ready to Start?

1. ✅ Install dependencies (lihat di atas)
2. 📖 Baca [RUN.md](RUN.md)
3. 🚀 Follow step-by-step
4. 🎉 Test the app!

---

**Remember:** TypeScript errors sebelum `npm install` adalah NORMAL! ✅
