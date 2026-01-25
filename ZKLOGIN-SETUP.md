# zkLogin Setup Guide

## What is zkLogin?

zkLogin allows users to login with Google/Facebook/Apple accounts without exposing their identity on-chain. It uses zero-knowledge proofs to derive a Sui address from OAuth tokens.

## Benefits

- ✅ No wallet extension needed
- ✅ Familiar OAuth login (Google, etc)
- ✅ Privacy-preserving
- ✅ User-friendly
- ✅ No seed phrases to manage

## Architecture

```
User → Google Login → JWT Token → ZK Proof → Sui Address
                                      ↓
                              Sign Transactions
```

## Setup Steps

### 1. Configure OAuth Provider

#### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:3000/auth/callback`
6. Copy Client ID

#### Facebook OAuth
1. Go to [Facebook Developers](https://developers.facebook.com)
2. Create new app
3. Add Facebook Login product
4. Configure OAuth redirect URI
5. Copy App ID

### 2. Frontend Configuration

Update `frontend/.env.local`:
```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
NEXT_PUBLIC_REDIRECT_URI=http://localhost:3000/auth/callback
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### 3. Backend Configuration

Update `backend-zklogin/.env`:
```env
ZKLOGIN_SALT=your-random-salt-here-keep-secret
SUI_NETWORK=testnet
```

### 4. Install zkLogin SDK

Already included in package.json:
```json
"@mysten/zklogin": "^0.7.0"
```

## Frontend Implementation

### 1. Login Flow

```typescript
// Generate ephemeral keypair
const { keypair, randomness } = generateEphemeralKeypair();

// Redirect to Google OAuth
const nonce = await getNonce(keypair.getPublicKey());
const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?
  client_id=${GOOGLE_CLIENT_ID}&
  redirect_uri=${REDIRECT_URI}&
  response_type=id_token&
  scope=openid&
  nonce=${nonce}`;

window.location.href = authUrl;
```

### 2. Handle Callback

```typescript
// Get JWT from URL
const jwt = getJWTFromURL();

// Get ZK proof from prover service
const zkProof = await getZKProof(jwt, ephemeralPublicKey, randomness);

// Verify with backend
const { address, sessionToken } = await verifyZkLogin({
  zkProof,
  ephemeralPublicKey,
  maxEpoch,
  jwtRandomness: randomness,
});

// Store session
localStorage.setItem('sui_address', address);
localStorage.setItem('session_token', sessionToken);
```

### 3. Sign Transactions

```typescript
// Create transaction
const tx = new TransactionBlock();
tx.moveCall({ ... });

// Sign with zkLogin
const signature = await signWithZkLogin(tx, zkProof, ephemeralKeypair);

// Execute
const result = await suiClient.executeTransactionBlock({
  transactionBlock: tx,
  signature,
});
```

## Backend Implementation

### 1. Verify zkLogin

```javascript
// routes/auth.js
router.post('/zklogin/verify', async (req, res) => {
  const { zkProof, ephemeralPublicKey } = req.body;
  
  // Verify proof
  const isValid = await verifyZkLoginSignature({
    zkProof,
    ephemeralPublicKey,
  });
  
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid proof' });
  }
  
  // Get Sui address
  const address = getZkLoginAddress(ephemeralPublicKey);
  
  res.json({ address, sessionToken: generateToken(address) });
});
```

### 2. Protect Routes

```javascript
// Middleware
export function requireAuth(req, res, next) {
  const token = req.headers.authorization;
  const address = verifyToken(token);
  req.userAddress = address;
  next();
}
```

## Testing

### 1. Test Login
```bash
# Start backend
cd backend-zklogin
npm run dev

# Start frontend
cd frontend
npm run dev

# Open browser
http://localhost:3000
```

### 2. Click "Login with Google"
- Redirects to Google
- Authorize app
- Redirects back with JWT
- Generates ZK proof
- Gets Sui address

### 3. Test Transaction
- Upload PDF
- Create session
- Transaction signed with zkLogin
- Verify on Sui Explorer

## Production Considerations

### 1. Prover Service
- Use Mysten Labs prover: `https://prover.mystenlabs.com`
- Or run your own prover
- Cache proofs for performance

### 2. Salt Management
- Keep salt secret
- Use environment variables
- Different salt per environment

### 3. Session Management
- Implement proper session tokens
- Add refresh tokens
- Handle expiry

### 4. Error Handling
- Handle OAuth errors
- Handle proof generation failures
- Provide user feedback

## Troubleshooting

### "Invalid nonce"
- Check nonce generation
- Verify maxEpoch is correct
- Ensure salt matches

### "Proof verification failed"
- Check JWT is valid
- Verify ephemeral key matches
- Check randomness is correct

### "Address mismatch"
- Verify salt is consistent
- Check JWT sub claim
- Ensure proper address derivation

## Resources

- [Sui zkLogin Docs](https://docs.sui.io/concepts/cryptography/zklogin)
- [zkLogin SDK](https://www.npmjs.com/package/@mysten/zklogin)
- [Example Implementation](https://github.com/MystenLabs/sui/tree/main/sdk/zklogin)

## Next Steps

1. ✅ Setup OAuth providers
2. ✅ Configure environment variables
3. ✅ Implement login flow
4. ✅ Test with Google login
5. ✅ Add other providers (Facebook, Apple)
6. ✅ Deploy to production
