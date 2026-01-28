// Configuration constants for Blixa frontend

export const CONFIG = {
  // IPFS Storage (Pinata)
  PINATA_JWT: process.env.NEXT_PUBLIC_PINATA_JWT || '',

  // Walrus Storage URLs
  WALRUS_PUBLISHER_URL: process.env.NEXT_PUBLIC_WALRUS_PUBLISHER_URL || 'https://publisher.walrus-testnet.walrus.space',
  WALRUS_AGGREGATOR_URL: process.env.NEXT_PUBLIC_WALRUS_AGGREGATOR_URL || 'https://aggregator.walrus-testnet.walrus.space',

  // Sui Network
  SUI_NETWORK: process.env.NEXT_PUBLIC_SUI_NETWORK || 'testnet',

  // Smart Contract Package ID (will be updated after deployment)
  PACKAGE_ID: process.env.NEXT_PUBLIC_PACKAGE_ID || '',

  // Session expiration (default 10 minutes in milliseconds)
  DEFAULT_SESSION_EXPIRY: 10 * 60 * 1000,
} as const;
