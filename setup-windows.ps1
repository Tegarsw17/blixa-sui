# BLIXA MVP - Windows Setup Script
# Script ini akan setup project BLIXA di Windows environment

# Require Administrator
#Requires -RunAsAdministrator

$ErrorActionPreference = "Continue"

# Colors
function Write-Success { Write-Host "✓ $args" -ForegroundColor Green }
function Write-Error { Write-Host "✗ $args" -ForegroundColor Red }
function Write-Info { Write-Host "→ $args" -ForegroundColor Yellow }

Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                                                              ║" -ForegroundColor Cyan
Write-Host "║         BLIXA MVP - Windows Setup Script                     ║" -ForegroundColor Cyan
Write-Host "║                                                              ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check Prerequisites
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "Step 1: Checking Prerequisites" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Check Node.js
try {
    $nodeVersion = node --version
    $nodeMajor = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
    
    if ($nodeMajor -lt 20) {
        Write-Info "Node.js $nodeVersion detected (outdated)"
        Write-Info "Please upgrade to Node.js 20 LTS"
        Write-Info "Download from: https://nodejs.org/"
        Write-Host ""
        $continue = Read-Host "Continue anyway? (y/n)"
        if ($continue -ne "y") { exit }
    } else {
        Write-Success "Node.js installed: $nodeVersion"
    }
} catch {
    Write-Error "Node.js not found!"
    Write-Info "Please install Node.js 20 LTS from: https://nodejs.org/"
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit
}

# Check npm
try {
    $npmVersion = npm --version
    Write-Success "npm installed: $npmVersion"
} catch {
    Write-Error "npm not found!"
    exit
}

# Check PostgreSQL
try {
    $psqlVersion = psql --version
    Write-Success "PostgreSQL installed: $psqlVersion"
} catch {
    Write-Error "PostgreSQL not found!"
    Write-Info "Please install PostgreSQL from: https://www.postgresql.org/download/windows/"
    Write-Host ""
    $continue = Read-Host "Continue anyway? (y/n)"
    if ($continue -ne "y") { exit }
}

# Check Sui CLI
try {
    $suiVersion = sui --version
    Write-Success "Sui CLI installed: $suiVersion"
} catch {
    Write-Error "Sui CLI not found!"
    Write-Info "Please install Sui CLI manually:"
    Write-Info "  cargo install --locked --git https://github.com/MystenLabs/sui.git --branch testnet sui"
    Write-Host ""
    $continue = Read-Host "Continue anyway? (y/n)"
    if ($continue -ne "y") { exit }
}

Write-Host ""

# Step 2: Setup Database
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "Step 2: Setting up PostgreSQL Database" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

Write-Info "Creating database 'blixa'..."
Write-Info "You may need to enter PostgreSQL password"
Write-Host ""

# Try to create database
try {
    $env:PGPASSWORD = "postgres"
    psql -U postgres -c "CREATE DATABASE blixa;" 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Database created"
    } else {
        Write-Info "Database 'blixa' may already exist"
    }
} catch {
    Write-Info "Could not create database automatically"
    Write-Info "Please create manually: CREATE DATABASE blixa;"
}

Write-Host ""

# Step 3: Install Backend Dependencies
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "Step 3: Installing Backend Dependencies" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

Set-Location backend
Write-Info "Installing backend packages..."
npm install
if ($LASTEXITCODE -eq 0) {
    Write-Success "Backend dependencies installed"
} else {
    Write-Error "Failed to install backend dependencies"
}

# Setup .env if not exists
if (-not (Test-Path .env)) {
    Write-Info "Creating .env file..."
    Copy-Item .env.example .env
    Write-Success ".env file created"
    Write-Info "Please edit backend\.env with your configuration"
} else {
    Write-Info ".env file already exists"
}

# Generate Prisma client
Write-Info "Generating Prisma client..."
npm run prisma:generate
if ($LASTEXITCODE -eq 0) {
    Write-Success "Prisma client generated"
}

# Run migrations
Write-Info "Running database migrations..."
npm run prisma:migrate
if ($LASTEXITCODE -eq 0) {
    Write-Success "Database migrations completed"
} else {
    Write-Info "Migrations may need manual setup"
}

Set-Location ..
Write-Host ""

# Step 4: Install Frontend Dependencies
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "Step 4: Installing Frontend Dependencies" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

Set-Location frontend
Write-Info "Installing frontend packages..."
npm install
if ($LASTEXITCODE -eq 0) {
    Write-Success "Frontend dependencies installed"
} else {
    Write-Error "Failed to install frontend dependencies"
}

# Setup .env.local if not exists
if (-not (Test-Path .env.local)) {
    Write-Info "Creating .env.local file..."
    Copy-Item .env.example .env.local
    Write-Success ".env.local file created"
    Write-Info "Please edit frontend\.env.local with your configuration"
} else {
    Write-Info ".env.local file already exists"
}

Set-Location ..
Write-Host ""

# Step 5: Setup Sui Contract
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "Step 5: Building Sui Smart Contract" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

Set-Location sui-contract
Write-Info "Building Sui Move contract..."
sui move build
if ($LASTEXITCODE -eq 0) {
    Write-Success "Contract built successfully"
} else {
    Write-Error "Contract build failed"
}
Set-Location ..

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✓ Setup Complete!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Configure environment files:"
Write-Host "   - Edit backend\.env (database, Sui config)"
Write-Host "   - Edit frontend\.env.local (API URL)"
Write-Host ""
Write-Host "2. Deploy Sui contract:"
Write-Host "   cd sui-contract"
Write-Host "   sui client publish --gas-budget 100000000"
Write-Host "   (Copy Package ID to backend\.env)"
Write-Host ""
Write-Host "3. Start the application:"
Write-Host "   Terminal 1: cd backend ; npm run dev"
Write-Host "   Terminal 2: cd frontend ; npm run dev"
Write-Host ""
Write-Host "4. Open http://localhost:3000"
Write-Host ""
Write-Host "For detailed instructions, read SETUP-WINDOWS.md"
Write-Host ""
Write-Success "Happy coding! 🎉"
Write-Host ""
Read-Host "Press Enter to exit"
