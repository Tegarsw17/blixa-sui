# BLIXA Backend

Express API server untuk BLIXA secure print platform.

## Setup

```bash
npm install
```

## Environment

Copy `.env.example` to `.env`:

```bash
copy .env.example .env
```

Edit `.env` dengan konfigurasi Anda.

## Database

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate
```

## Development

```bash
npm run dev
```

Server akan running di http://localhost:3001

## API Endpoints

### Auth
- `POST /api/auth/wallet/verify` - Verify Sui wallet

### Documents
- `POST /api/documents/upload` - Upload PDF
- `GET /api/documents/:id` - Get document info

### Sessions
- `POST /api/sessions/create` - Create print session
- `GET /api/sessions/:id` - Get session status
- `GET /api/sessions/:id/qr` - Get QR code

### Agent
- `POST /api/agent/sessions/:id/claim` - Claim session
- `GET /api/agent/sessions/:id/stream` - Stream file
- `POST /api/agent/sessions/:id/complete` - Complete print

## Tech Stack

- Express
- Prisma ORM
- PostgreSQL
- Sui SDK
- Multer (file upload)
- Crypto (AES-256-GCM)

## Security

- File encryption at rest
- One-time tokens
- Session expiry
- Auto-cleanup
- Audit logging
