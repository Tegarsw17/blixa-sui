# BLIXA Frontend (zkLogin)

Frontend dengan zkLogin authentication - no wallet extension needed!

## Features

- ✅ zkLogin (Google/Facebook login)
- ✅ No wallet extension required
- ✅ User-friendly OAuth flow
- ✅ Same UI as wallet version
- ✅ Privacy-preserving

## Setup

```bash
npm install
```

## Environment

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-oauth-client-id
NEXT_PUBLIC_REDIRECT_URI=http://localhost:3000/auth/callback
NEXT_PUBLIC_SUI_NETWORK=testnet
```

## OAuth Setup

### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add redirect URI: `http://localhost:3000/auth/callback`
6. Copy Client ID

## Development

```bash
npm run dev
```

Open http://localhost:3000

## Login Flow

1. User clicks "Login with Google"
2. Redirects to Google OAuth
3. User authorizes
4. Redirects back with JWT
5. Generate ZK proof
6. Derive Sui address
7. Store session

## Differences from Wallet Version

### Wallet Version
- Requires Sui Wallet extension
- User manages private keys
- Direct wallet connection

### zkLogin Version
- No extension needed
- OAuth login (Google/Facebook)
- ZK proof for privacy
- Easier onboarding

## Pages

- `/` - Home with zkLogin button
- `/auth/callback` - OAuth callback handler
- `/user` - User portal (upload & QR)
- `/agent` - Print agent (scan & print)

## Tech Stack

- Next.js 14
- TypeScript
- @mysten/zklogin
- Tailwind CSS
- React Query
- Axios
