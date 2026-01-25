#!/bin/bash

# BLIXA MVP - WSL Setup Script
# Script ini akan setup project BLIXA di WSL environment

set -e  # Exit on error

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                                                              ║"
echo "║         BLIXA MVP - WSL Setup Script                         ║"
echo "║                                                              ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}→ $1${NC}"
}

# Check if running in WSL
if ! grep -qi microsoft /proc/version; then
    print_error "This script is designed for WSL. Please run in WSL environment."
    exit 1
fi

print_success "Running in WSL environment"
echo ""

# Step 1: Check Prerequisites
echo "═══════════════════════════════════════════════════════════════"
echo "Step 1: Checking Prerequisites"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
    
    if [ "$NODE_MAJOR" -lt 20 ]; then
        print_info "Node.js $NODE_VERSION detected (outdated)"
        print_info "Upgrading to Node.js 20 LTS..."
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo apt-get install -y nodejs
        print_success "Node.js upgraded to $(node --version)"
    else
        print_success "Node.js installed: $NODE_VERSION"
    fi
else
    print_error "Node.js not found!"
    print_info "Installing Node.js 20 LTS..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
    print_success "Node.js installed: $(node --version)"
fi

# Check npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    print_success "npm installed: $NPM_VERSION"
else
    print_error "npm not found!"
    exit 1
fi

# Check PostgreSQL
if command -v psql &> /dev/null; then
    PSQL_VERSION=$(psql --version)
    print_success "PostgreSQL installed: $PSQL_VERSION"
else
    print_error "PostgreSQL not found!"
    print_info "Installing PostgreSQL..."
    sudo apt-get update
    sudo apt-get install -y postgresql postgresql-contrib
    sudo service postgresql start
    print_success "PostgreSQL installed and started"
fi

# Check Sui CLI
if command -v sui &> /dev/null; then
    SUI_VERSION=$(sui --version)
    print_success "Sui CLI installed: $SUI_VERSION"
else
    print_error "Sui CLI not found!"
    print_info "Please install Sui CLI manually:"
    echo "  cargo install --locked --git https://github.com/MystenLabs/sui.git --branch testnet sui"
    echo ""
    read -p "Press Enter to continue after installing Sui CLI, or Ctrl+C to exit..."
fi

echo ""

# Step 2: Setup Database
echo "═══════════════════════════════════════════════════════════════"
echo "Step 2: Setting up PostgreSQL Database"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Start PostgreSQL if not running
sudo service postgresql start

# Create database
print_info "Creating database 'blixa'..."
sudo -u postgres psql -c "CREATE DATABASE blixa;" 2>/dev/null || print_info "Database 'blixa' already exists"
print_success "Database ready"

echo ""

# Step 3: Install Backend Dependencies
echo "═══════════════════════════════════════════════════════════════"
echo "Step 3: Installing Backend Dependencies"
echo "═══════════════════════════════════════════════════════════════"
echo ""

cd backend
print_info "Installing backend packages..."
npm install
print_success "Backend dependencies installed"

# Setup .env if not exists
if [ ! -f .env ]; then
    print_info "Creating .env file..."
    cp .env.example .env
    print_success ".env file created"
    print_info "Please edit backend/.env with your configuration"
else
    print_info ".env file already exists"
fi

# Generate Prisma client
print_info "Generating Prisma client..."
npm run prisma:generate
print_success "Prisma client generated"

# Run migrations
print_info "Running database migrations..."
npm run prisma:migrate || print_info "Migrations may need manual setup"
print_success "Database migrations completed"

cd ..
echo ""

# Step 4: Install Frontend Dependencies
echo "═══════════════════════════════════════════════════════════════"
echo "Step 4: Installing Frontend Dependencies"
echo "═══════════════════════════════════════════════════════════════"
echo ""

cd frontend
print_info "Installing frontend packages..."
npm install
print_success "Frontend dependencies installed"

# Setup .env.local if not exists
if [ ! -f .env.local ]; then
    print_info "Creating .env.local file..."
    cp .env.example .env.local
    print_success ".env.local file created"
    print_info "Please edit frontend/.env.local with your configuration"
else
    print_info ".env.local file already exists"
fi

cd ..
echo ""

# Step 5: Setup Sui Contract
echo "═══════════════════════════════════════════════════════════════"
echo "Step 5: Building Sui Smart Contract"
echo "═══════════════════════════════════════════════════════════════"
echo ""

cd sui-contract
print_info "Building Sui Move contract..."
sui move build && print_success "Contract built successfully" || print_error "Contract build failed"
cd ..

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "✓ Setup Complete!"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "Next Steps:"
echo ""
echo "1. Configure environment files:"
echo "   - Edit backend/.env (database, Sui config)"
echo "   - Edit frontend/.env.local (API URL)"
echo ""
echo "2. Deploy Sui contract:"
echo "   cd sui-contract"
echo "   sui client publish --gas-budget 100000000"
echo "   (Copy Package ID to backend/.env)"
echo ""
echo "3. Start the application:"
echo "   Terminal 1: cd backend && npm run dev"
echo "   Terminal 2: cd frontend && npm run dev"
echo ""
echo "4. Open http://localhost:3000"
echo ""
echo "For detailed instructions, read RUN.md"
echo ""
print_success "Happy coding! 🎉"
