# Quick Commands Reference

## Start Services

### Backend
```powershell
cd backend
npm run dev
```

### Frontend
```powershell
cd frontend
npm run dev
```

## Stop Services

### Graceful Stop
- Tekan `Ctrl+C` di terminal

### Force Stop by Port
```powershell
# Stop backend (port 3001)
Get-Process -Id (Get-NetTCPConnection -LocalPort 3001).OwningProcess | Stop-Process -Force

# Stop frontend (port 3000)
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process -Force
```

## Database Commands

### Connect to Database
```powershell
$env:PGPASSWORD="Denjaka"
psql -U postgres -d blixa
```

### Common SQL Commands
```sql
-- List tables
\dt

-- Describe table
\d sessions
\d documents

-- Query data
SELECT * FROM sessions;
SELECT * FROM documents;

-- Exit
\q
```

### Prisma Commands
```powershell
cd backend

# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Reset database (WARNING: deletes all data!)
npx prisma migrate reset

# Open Prisma Studio (GUI)
npx prisma studio
```

## Check Status

### Check Services
```powershell
# Check PostgreSQL
Get-Service postgresql*

# Check ports
netstat -ano | findstr :3000
netstat -ano | findstr :3001

# Check Node processes
Get-Process node
```

### Check Logs
```powershell
# Backend logs (di terminal)
# Frontend logs (di terminal + browser console F12)
```

## Sui Contract Commands (Nanti)

### Build Contract
```powershell
cd sui-contract
sui move build
```

### Test Contract
```powershell
sui move test
```

### Publish Contract
```powershell
sui client publish --gas-budget 100000000
```

### Check Sui Client
```powershell
# Active address
sui client active-address

# Active environment
sui client active-env

# Switch to testnet
sui client switch --env testnet

# Get balance
sui client gas
```

## Development Commands

### Install Dependencies
```powershell
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install
```

### Clean Install
```powershell
# Backend
cd backend
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install

# Frontend
cd frontend
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install
```

### Update Dependencies
```powershell
# Check outdated
npm outdated

# Update all
npm update

# Update specific package
npm install package-name@latest
```

## Troubleshooting Commands

### Clear npm Cache
```powershell
npm cache clean --force
```

### Fix Prisma Issues
```powershell
cd backend
npx prisma generate
npx prisma migrate reset
npx prisma migrate dev
```

### Check Node Version
```powershell
node --version
npm --version
```

### Restart PostgreSQL
```powershell
Restart-Service postgresql-x64-16
```

## Git Commands

### Check Status
```powershell
git status
```

### Commit Changes
```powershell
git add .
git commit -m "Your message"
git push
```

### Pull Latest
```powershell
git pull
```

### Create Branch
```powershell
git checkout -b feature-name
```

## Testing Commands

### Test Backend API
```powershell
# Health check
curl http://localhost:3001/api/health

# Test with Postman or curl
```

### Test Frontend
```powershell
# Open browser
start http://localhost:3000
```

## Useful Aliases (Add to PowerShell Profile)

Edit `$PROFILE` dan tambahkan:

```powershell
# Edit profile
notepad $PROFILE

# Add these aliases:
function blixa-backend { 
    Set-Location "D:\blixa lagi\backend"
    npm run dev 
}

function blixa-frontend { 
    Set-Location "D:\blixa lagi\frontend"
    npm run dev 
}

function blixa-status {
    Write-Host "=== Services Status ===" -ForegroundColor Cyan
    Get-Service postgresql* | Select-Object Name, Status
    Write-Host "`n=== Ports ===" -ForegroundColor Cyan
    netstat -ano | findstr ":3000 :3001"
    Write-Host "`n=== Node Processes ===" -ForegroundColor Cyan
    Get-Process node -ErrorAction SilentlyContinue | Select-Object Id, ProcessName
}

function blixa-stop {
    Write-Host "Stopping services..." -ForegroundColor Yellow
    Get-Process -Id (Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue).OwningProcess -ErrorAction SilentlyContinue | Stop-Process -Force
    Get-Process -Id (Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue).OwningProcess -ErrorAction SilentlyContinue | Stop-Process -Force
    Write-Host "Services stopped!" -ForegroundColor Green
}

function blixa-db {
    $env:PGPASSWORD="Denjaka"
    psql -U postgres -d blixa
}
```

Reload profile:
```powershell
. $PROFILE
```

Gunakan aliases:
```powershell
blixa-backend    # Start backend
blixa-frontend   # Start frontend
blixa-status     # Check status
blixa-stop       # Stop all
blixa-db         # Connect to database
```

## Environment Files

### Backend (.env)
```
D:\blixa lagi\backend\.env
```

### Frontend (.env.local)
```
D:\blixa lagi\frontend\.env.local
```

## Important Paths

```
Project Root:     D:\blixa lagi\
Backend:          D:\blixa lagi\backend\
Frontend:         D:\blixa lagi\frontend\
Sui Contract:     D:\blixa lagi\sui-contract\
Database:         PostgreSQL (localhost:5432/blixa)
```

## Quick Links

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001/api
- Prisma Studio: http://localhost:5555 (after `npx prisma studio`)

---

**Tip:** Bookmark file ini untuk quick reference! 📌
