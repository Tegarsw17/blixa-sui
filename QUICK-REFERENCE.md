# Quick Reference

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| [START-HERE.md](START-HERE.md) | ⭐ **Mulai dari sini!** First steps |
| [README.md](README.md) | Project overview & quick start |
| [RUN.md](RUN.md) | Step-by-step running guide |
| [INSTALL.md](INSTALL.md) | Installation instructions |
| [SETUP.md](SETUP.md) | Detailed setup & troubleshooting |
| [ERRORS-NORMAL.md](ERRORS-NORMAL.md) | Why TypeScript errors are normal |

## 🚀 Quick Commands

### First Time Setup
```bash
# 1. Install dependencies
cd backend && npm install
cd ../frontend && npm install

# 2. Setup database
cd backend
npm run prisma:generate
npm run prisma:migrate

# 3. Deploy contract
cd ../sui-contract
sui move build
sui client publish --gas-budget 100000000

# 4. Configure .env files (see SETUP.md)

# 5. Run
cd ../backend && npm run dev  # Terminal 1
cd ../frontend && npm run dev # Terminal 2
```

### Daily Development
```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm run dev
```

## 🔧 Common Tasks

### Reset Database
```bash
cd backend
npm run prisma:migrate reset
```

### Rebuild Contract
```bash
cd sui-contract
sui move build
sui client publish --gas-budget 100000000
```

### Clear Frontend Cache
```bash
cd frontend
rm -rf .next node_modules
npm install
```

### View Logs
```bash
# Backend logs in terminal
# Frontend logs in browser console
```

## 📁 Project Structure

```
blixa-mvp/
├── backend/
│   ├── src/
│   │   ├── routes/        # API endpoints
│   │   └── utils/         # Helpers (encryption, sui, logger)
│   ├── prisma/
│   │   └── schema.prisma  # Database schema
│   └── package.json
├── frontend/
│   ├── app/
│   │   ├── page.tsx       # Home
│   │   ├── user/          # User portal
│   │   └── agent/         # Print agent
│   ├── lib/
│   │   └── api.ts         # API client
│   └── package.json
└── sui-contract/
    ├── sources/
    │   └── print_session.move
    └── Move.toml
```

## 🌐 URLs

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Health Check: http://localhost:3001/health
- Sui Explorer: https://suiexplorer.com/?network=testnet

## 🔑 Environment Variables

### Backend (.env)
```env
PORT=3001
DATABASE_URL="postgresql://..."
SUI_NETWORK=testnet
SUI_PACKAGE_ID=0x...
SUI_PRIVATE_KEY=suiprivkey...
ENCRYPTION_KEY=...
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_SUI_NETWORK=testnet
```

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| TypeScript errors | Run `npm install`, restart IDE |
| Database error | Check PostgreSQL running, verify DATABASE_URL |
| Sui tx failed | Request testnet SUI, check PACKAGE_ID |
| Port in use | Change PORT in .env or kill process |
| Module not found | Run `npm install` in that folder |

## 📊 Database Schema

### Documents
- id, ownerId, filename, size, hashSha256
- storagePath, encryptedKey, createdAt

### PrintSessions
- id, documentId, ownerId, status
- expiresAt, oneTimeToken
- suiObjectId, suiTxCreate, suiTxPrint, suiTxDestroy

### PrintEvents
- id, sessionId, agentId, eventType
- result, notes, createdAt

## 🔐 Security Features

- ✅ AES-256-GCM encryption
- ✅ One-time tokens
- ✅ Session expiry (10 min)
- ✅ Auto file deletion
- ✅ On-chain audit trail
- ✅ No file content on blockchain

## 🎯 Testing Checklist

- [ ] Backend running (port 3001)
- [ ] Frontend running (port 3000)
- [ ] Database connected
- [ ] Contract deployed
- [ ] Sui wallet connected
- [ ] Upload PDF works
- [ ] QR generation works
- [ ] Agent can scan QR
- [ ] Print completes
- [ ] File deleted
- [ ] Tx visible on explorer

## 📞 Need Help?

1. Check [ERRORS-NORMAL.md](ERRORS-NORMAL.md) for TypeScript issues
2. Check [SETUP.md](SETUP.md) for detailed troubleshooting
3. Check [RUN.md](RUN.md) for step-by-step guide
4. Check individual README files in each folder

## 🎓 Learning Resources

- Sui Documentation: https://docs.sui.io
- Next.js Docs: https://nextjs.org/docs
- Prisma Docs: https://www.prisma.io/docs
- Express Docs: https://expressjs.com

## 📝 Notes

- MVP uses simplified auth (production needs proper signature verification)
- File storage is local (production should use S3/R2)
- Max file size: 10MB
- Session expiry: 10 minutes
- Network: Sui testnet
