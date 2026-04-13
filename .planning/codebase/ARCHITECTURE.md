# Architecture

## Pattern

**Static Single-Page Application (SPA-like) with On-Chain Backend**

The RDO Protocol follows a **serverless dApp architecture**:
- **No backend server** — all business logic is either client-side JS or on-chain Solidity
- **No build step** — raw HTML/JS/CSS served as-is
- **Multi-page app** — separate HTML files per page (not a true SPA, but shares common JS modules)
- **State machine** — on-chain contract is the single source of truth; browser localStorage caches metadata

## System Layers

```
┌─────────────────────────────────────────────────────┐
│  PRESENTATION LAYER                                  │
│  index.html, create.html, view.html, dashboard.html │
│  css/style.css, css/animations.css                  │
│  js/background.js, js/shared.js                     │
├─────────────────────────────────────────────────────┤
│  APPLICATION LOGIC LAYER                             │
│  js/create.js    — RDO creation workflow             │
│  js/view.js      — RDO viewing/access workflow       │
│  js/dashboard.js — RDO management dashboard          │
├─────────────────────────────────────────────────────┤
│  SERVICE LAYER                                       │
│  js/crypto.js    — AES-256-GCM + RSA-OAEP PKI       │
│  js/ipfs.js      — Pinata IPFS upload/fetch          │
│  js/contract.js  — ethers.js smart contract API      │
│  js/wallet.js    — MetaMask wallet connection         │
├─────────────────────────────────────────────────────┤
│  INFRASTRUCTURE LAYER                                │
│  Ethereum Sepolia — Smart contract state              │
│  IPFS / Pinata   — Encrypted content storage          │
│  Vercel          — Static file hosting                │
│  Browser         — Web Crypto API, localStorage       │
└─────────────────────────────────────────────────────┘
```

## Data Flow

### Create Flow (Minting an RDO)

```
User Input → [1] Package Content (text + file → JSON bundle)
           → [2] AES-256-GCM Encrypt (Web Crypto API)
           → [3] Upload encrypted payload to IPFS (Pinata API)
           → [4] Wrap AES key with RSA pub keys (per-recipient PKI)
           → [5] Call createRDO() on-chain with CID + policy + wrapped keys
           → [6] Display success with RDO ID, tx hash, share link
```

### View/Access Flow (Consuming an RDO)

```
User enters RDO ID → [1] getRDO() — fetch on-chain metadata
                   → [2] requestAccess(rdoId, action) — on-chain permission check
                   → [3] If paid: sendTransaction() for payment → creator wallet
                   → [4] Fetch encrypted payload from IPFS (multi-gateway fallback)
                   → [5] Recover AES key (PKI path or URL key or localStorage)
                   → [6] AES-256-GCM Decrypt → render content
```

### PKI Key Recovery Flow

```
When no raw AES key is available locally:
  [1] getEncryptedKey(rdoId, userAddress) — fetch encrypted AES shard from contract
  [2] getEncryptionProfile(userAddress) — fetch user's RSA profile from contract
  [3] User signs RECOVERY_MESSAGE via MetaMask → derive KEK via SHA-256
  [4] Decrypt RSA private key using KEK (AES-GCM)
  [5] Decrypt AES shard using RSA-OAEP private key
  [6] Use recovered AES key to decrypt IPFS content
```

## Key Abstractions

### Smart Contract (`contracts/RDO.sol`)

The central state machine. Stores:
- `DigitalObject` struct per RDO (CID, policy flags, counters, lifecycle booleans)
- `_whitelist` mapping (rdoId → address → bool)
- `encryptionPubKeys` mapping (address → RSA profile JSON)
- `_encryptedAESKeys` mapping (rdoId → address → wrapped AES key)

### Wallet State (`js/wallet.js`)

Global singleton `window.walletState` manages:
```javascript
{
  address: string | null,
  signer: ethers.Signer | null,
  provider: ethers.BrowserProvider | null,
  chainId: string | null,
  isConnected: boolean
}
```

### RDO Configuration (`js/create.js`)

Local state object for the creation form:
```javascript
rdoConfig = {
  maxOpens, accessType, allowRead, allowCopy,
  allowDownload, lockOnViolation, isPaid, pricePerAccessEth
}
```

## Entry Points

| Page | Entry Script | Purpose |
|------|-------------|---------|
| `index.html` | Inline `<script>` + `js/shared.js` | Landing page with scroll reveals, navbar, wallet connect |
| `create.html` | `js/create.js` | RDO creation wizard (3-step: encrypt → IPFS → mint) |
| `view.html` | `js/view.js` | RDO viewer with access controls and decryption |
| `dashboard.html` | `js/dashboard.js` | List of user's created RDOs with management actions |

## Script Loading Order (all pages)

```html
<script src="js/background.js">     <!-- Three.js dotted wave -->
<script src="contractAddress.js">    <!-- Config: contract address, Pinata keys -->
<script src="js/wallet.js">          <!-- MetaMask connection + global state -->
<script src="js/shared.js">          <!-- Toast, scroll reveal, utils -->
<script src="js/crypto.js">          <!-- AES + RSA crypto (optional on index) -->
<script src="js/ipfs.js">            <!-- Pinata upload/fetch (optional on index) -->
<script src="js/contract.js">        <!-- Smart contract API -->
<script src="js/[page].js">          <!-- Page-specific logic -->
```

## Cross-Cutting Concerns

### Error Handling
- Try/catch around all async operations
- Errors surfaced via `showToast(message, 'error')` toast notifications
- No global error boundary — each function handles its own errors

### State Synchronization
- On-chain state is fetched fresh on each page load (no websocket/polling)
- localStorage provides offline cache for decryption keys and monetization metadata
- No optimistic updates — UI waits for tx confirmation before updating

### Security Model
- Client-side encryption (AES-256-GCM) — keys never leave the browser
- Per-recipient key wrapping (RSA-OAEP) — each whitelisted user gets uniquely encrypted key shard
- Deterministic key recovery via MetaMask signature — private key backed up on-chain in encrypted form
- On-chain access control — contract enforces whitelist, open limits, and lock-on-violation policies
