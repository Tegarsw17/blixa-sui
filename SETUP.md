# BLIXA MVP - Setup Guide

## Prerequisites

- Node.js 18+
- PostgreSQL
- Sui CLI
- Sui Wallet (untuk testing)

## 1. Setup Database

```bash
# Install PostgreSQL
# Windows: Download dari https://www.postgresql.org/download/windows/

# Create database
psql -U postgres
CREATE DATABASE blixa;
\q
```

## 2. Setup Sui Smart Contract

```bash
cd sui-contract

# Build contract
sui move build

# Publish ke testnet
sui client publish --gas-budget 100000000

# Copy Package ID dari output
# Update .env dengan PACKAGE_ID
```

## 3. Setup Backend

```bash
cd backend

# Install dependencies
npm install

# Copy environment file
copy .env.example .env

# Edit .env:
# - DATABASE_URL: connection string PostgreSQL
# - SUI_PACKAGE_ID: dari step 2
# - SUI_PRIVATE_KEY: dari sui client
# - ENCRYPTION_KEY: generate random 32 bytes

# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Start server
npm run dev
```

Backend akan running di http://localhost:3001

## 4. Setup Frontend

```bash
cd frontend

# Install dependencies
npm install

# Copy environment file
copy .env.example .env.local

# Edit .env.local:
# - NEXT_PUBLIC_API_URL=http://localhost:3001/api
# - NEXT_PUBLIC_SUI_NETWORK=testnet

# Start dev server
npm run dev
```

Frontend akan running di http://localhost:3000

## 5. Testing Flow

### A. User Flow
1. Buka http://localhost:3000
2. Connect Sui wallet (install Sui Wallet extension)
3. Klik "User Portal"
4. Upload PDF file (max 10MB)
5. Klik "Generate QR Code"
6. Copy QR payload (JSON string)

### B. Print Agent Flow
1. Buka tab baru http://localhost:3000
2. Klik "Print Agent"
3. Paste QR payload
4. Klik "Validate QR Code"
5. Klik "Print Document"
6. File akan di-download (simulasi print)
7. Cek status: file sudah dihapus, session destroyed

### C. Verify On-Chain
1. Copy tx hash dari UI
2. Buka https://suiexplorer.com/txblock/{TX_HASH}?network=testnet
3. Lihat events: SessionCreated, SessionPrinted, SessionDestroyed

## Troubleshooting

### Database Connection Error
- Pastikan PostgreSQL running
- Cek DATABASE_URL di .env
- Test connection: `psql -U postgres -d blixa`

### Sui Transaction Failed
- Pastikan ada SUI di wallet untuk gas
- Request testnet SUI: https://discord.gg/sui (channel #testnet-faucet)
- Cek network: `sui client active-env`

### File Upload Error
- Cek folder storage/vault exists
- Cek permissions
- Cek MAX_FILE_SIZE di .env

### CORS Error
- Pastikan backend running
- Cek NEXT_PUBLIC_API_URL di frontend .env.local
- Restart both servers

## Production Deployment

### Backend
- Setup PostgreSQL production database
- Use proper encryption key management (AWS KMS, etc)
- Setup S3 atau R2 untuk file storage
- Enable HTTPS
- Setup monitoring (Sentry, etc)

### Frontend
- Deploy ke Vercel/Netlify
- Update API_URL ke production backend
- Enable production Sui network

### Smart Contract
- Audit contract
- Deploy ke mainnet
- Update PACKAGE_ID

## Security Notes

- Encryption key harus disimpan aman (KMS)
- Private key Sui jangan commit ke git
- File storage harus isolated
- Implement rate limiting
- Add proper authentication (bukan simplified MVP auth)
- Enable audit logging
- Regular security updates

## Next Steps (Post-MVP)

- [ ] Implement proper Sui wallet signature verification
- [ ] Add payment integration
- [ ] Multi-file support
- [ ] Real printer integration
- [ ] Admin dashboard
- [ ] Analytics & monitoring
- [ ] ZK proof implementation
- [ ] Public SDK
