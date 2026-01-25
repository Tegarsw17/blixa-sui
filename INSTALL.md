# Installation Guide

## Quick Install

### Backend
```bash
cd backend
npm install
```

### Frontend
```bash
cd frontend
npm install
```

## Jika Ada Error TypeScript

Jika masih ada error TypeScript setelah install, jalankan:

```bash
cd frontend
npm install --save-dev @types/react @types/react-dom @types/node
```

## Setup Database

```bash
cd backend
npm run prisma:generate
npm run prisma:migrate
```

## Run Development

Terminal 1 (Backend):
```bash
cd backend
npm run dev
```

Terminal 2 (Frontend):
```bash
cd frontend
npm run dev
```

## Troubleshooting

### Module not found errors
- Pastikan sudah `npm install` di folder backend dan frontend
- Restart IDE/editor setelah install

### TypeScript errors
- Set `"strict": false` di tsconfig.json (sudah diset)
- Install @types packages jika diperlukan

### Prisma errors
- Pastikan PostgreSQL running
- Check DATABASE_URL di .env
- Run `npm run prisma:generate`
