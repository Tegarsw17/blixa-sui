# BLIXA Frontend

## ⚠️ TypeScript Errors? READ THIS!

Jika Anda melihat banyak TypeScript errors, **ini NORMAL!**

Error akan hilang setelah install dependencies:

```bash
npm install
```

Setelah install selesai, restart IDE.

## Development

```bash
npm run dev
```

Open http://localhost:3000

## Build

```bash
npm run build
npm start
```

## Environment Variables

Copy `.env.example` to `.env.local`:

```bash
copy .env.example .env.local
```

Edit `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_SUI_NETWORK=testnet
```

## Features

- User Portal: Upload PDF & generate QR
- Print Agent: Scan QR & print document
- Sui Wallet integration
- Real-time session status

## Tech Stack

- Next.js 14
- TypeScript
- Tailwind CSS
- Sui dApp Kit
- React Query
- Axios

## Pages

- `/` - Home (connect wallet)
- `/user` - User portal (upload & QR)
- `/agent` - Print agent (scan & print)
