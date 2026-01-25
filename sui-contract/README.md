# BLIXA Smart Contract

Sui Move smart contract untuk BLIXA print session lifecycle.

## Build

```bash
sui move build
```

## Test

```bash
sui move test
```

## Publish

```bash
sui client publish --gas-budget 100000000
```

Copy Package ID dari output dan update `backend/.env`:
```
SUI_PACKAGE_ID=0x...
```

## Contract Structure

### PrintSession Object
- `id`: Unique identifier
- `owner`: Session owner address
- `document_hash`: SHA256 hash of document
- `session_id`: Session identifier
- `status`: CREATED | PRINTED | DESTROYED | EXPIRED
- `created_at`: Creation timestamp
- `expires_at`: Expiry timestamp
- `printed_at`: Print timestamp

### Functions

#### create_session
Create new print session
```move
public entry fun create_session(
    document_hash: String,
    session_id: String,
    expires_at: u64,
    ctx: &mut TxContext
)
```

#### mark_printed
Mark session as printed
```move
public entry fun mark_printed(
    session: &mut PrintSession,
    ctx: &mut TxContext
)
```

#### destroy_session
Destroy session after print/expiry
```move
public entry fun destroy_session(
    session: PrintSession,
    reason: String,
    ctx: &mut TxContext
)
```

#### mark_expired
Mark session as expired
```move
public entry fun mark_expired(
    session: &mut PrintSession,
    ctx: &mut TxContext
)
```

### Events

- `SessionCreated`: Emitted when session created
- `SessionPrinted`: Emitted when marked as printed
- `SessionDestroyed`: Emitted when session destroyed

## Lifecycle

```
Created → Printed → Destroyed
   ↓
Expired → Destroyed
```

## Security

- Owner-only operations
- Status validation
- One-time print enforcement
- Immutable audit trail

## Network

- Development: `sui client switch --env devnet`
- Testnet: `sui client switch --env testnet`
- Mainnet: `sui client switch --env mainnet`
