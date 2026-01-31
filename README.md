# BLIXA - Decentralized Secure Print Service

A decentralized document printing service built on Sui blockchain and Walrus storage, enabling secure one-time document sharing with client-side encryption.

## Features

- **User Portal**: Upload PDF documents and generate shareable QR codes
- **Print Agent Portal**: Scan QR codes to claim and print documents securely
- **Client-Side Encryption**: AES-GCM encryption ensures documents are encrypted before upload
- **Walrus Storage**: Decentralized storage for encrypted documents
- **Sui Blockchain**: Smart contract manages print sessions with one-time tokens
- **One-Time Access**: Each document can only be printed once, then the session is destroyed
- **Auto-Expiry**: Sessions automatically expire after 10 minutes

## Tech Stack

- **Frontend**: Next.js 16, React 18, TypeScript
- **Styling**: Tailwind CSS, Radix UI
- **Blockchain**: Sui dApp Kit, @mysten/sui
- **Storage**: Walrus decentralized storage
- **Wallet**: Sui Wallet integration via @mysten/dapp-kit
- **Encryption**: Web Crypto API (AES-GCM)

## Prerequisites

- Node.js 18+
- npm or yarn
- Sui Wallet extension installed

## Installation

```bash
# Install dependencies
npm install

# or
yarn install
```

## Configuration

Create a `.env.local` file in the root directory:

```env
# Sui Network Configuration
NEXT_PUBLIC_SUI_NETWORK=testnet

# Walrus Configuration (optional - defaults provided)
NEXT_PUBLIC_WALRUS_PUBLISHER_URL=https://publisher.walrus-testnet.walrus.space
NEXT_PUBLIC_WALRUS_AGGREGATOR_URL=https://aggregator.walrus-testnet.walrus.space
```

## Development

```bash
# Start development server
npm run dev

# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Build for Production

```bash
# Build the application
npm run build

# Start production server
npm start
```

## How It Works

### For Users (Document Upload)

1. Connect your Sui Wallet
2. Navigate to `/user`
3. Upload a PDF document (max 10MB)
4. The document is encrypted client-side using AES-GCM
5. Encrypted document is uploaded to Walrus storage
6. A print session is created on the Sui blockchain
7. Generate a QR code containing:
   - Session Object ID
   - Document Blob ID
   - Encryption Key
   - One-time Token
   - Filename

### For Print Agents (Document Printing)

1. Navigate to `/agent` (no wallet required)
2. Scan the QR code or paste the session payload
3. The system verifies the token on the blockchain
4. Download and decrypt the document from Walrus
5. Print the document
6. Session is marked as printed and destroyed on blockchain

### Security Features

- **Client-Side Encryption**: Documents are encrypted before leaving the browser
- **One-Time Token**: Each document can only be accessed once
- **Auto-Expiry**: Sessions expire after 10 minutes
- **Blockchain Verification**: All actions are verified on the Sui blockchain
- **Immutable Storage**: Walrus provides permanent, tamper-proof storage

## Project Structure

```
blixa-project/
├── app/
│   ├── agent/page.tsx      # Print agent portal
│   ├── user/page.tsx       # User upload portal
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Home page
│   └── providers.tsx       # React providers
├── lib/
│   ├── api.ts              # Frontend API layer
│   ├── blockchain.ts       # Sui blockchain interactions
│   ├── config.ts           # Configuration
│   ├── encryption.ts       # Encryption utilities
│   ├── storage.ts          # Local storage utilities
│   └── walrus.ts           # Walrus storage integration
├── public/                 # Static assets
└── package.json
```

## Smart Contract Functions

The Sui smart contract (`print_session`) provides the following functions:

- `create_session`: Creates a new print session on blockchain
- `mark_printed`: Marks a session as printed
- `destroy_session`: Destroys a session after printing
- `mark_expired`: Marks a session as expired

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_SUI_NETWORK` | Sui network to connect to | `testnet` |
| `NEXT_PUBLIC_WALRUS_PUBLISHER_URL` | Walrus publisher endpoint | `https://publisher.walrus-testnet.walrus.space` |
| `NEXT_PUBLIC_WALRUS_AGGREGATOR_URL` | Walrus aggregator endpoint | `https://aggregator.walrus-testnet.walrus.space` |

## Pages

| Route | Description | Wallet Required |
|-------|-------------|-----------------|
| `/` | Home page | Yes |
| `/user` | Upload document and generate QR code | Yes |
| `/agent` | Print document from QR code | No |

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## License

MIT

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Support

For issues and questions, please open an issue on GitHub.
