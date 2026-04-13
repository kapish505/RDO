# External Integrations

## Blockchain / Smart Contract

| Integration | Details |
|-------------|---------|
| **Ethereum (Sepolia Testnet)** | Primary blockchain. Contract deployed at `0xdD1BE8d2cc176A18A6d401e85aa5420288A42746` |
| **MetaMask** | Wallet provider via `window.ethereum`. Used for: account connection, transaction signing, message signing (PKI key recovery), network switching |
| **ethers.js v6** | Contract interaction library. Uses `BrowserProvider` + `getSigner()` pattern |

### Contract Functions Called

| Function | Type | Called From |
|----------|------|-------------|
| `createRDO(params)` | Write | `js/contract.js` → `js/create.js` |
| `requestAccess(rdoId, action)` | Write (payable) | `js/contract.js` → `js/view.js` |
| `revokeRDO(rdoId)` | Write | `js/contract.js` → `js/view.js`, `js/dashboard.js` |
| `unlockRDO(rdoId)` | Write | `js/contract.js` → `js/view.js`, `js/dashboard.js` |
| `addToWhitelist(rdoId, addresses, encryptedKeys)` | Write (payable) | `js/contract.js` |
| `removeFromWhitelist(rdoId, addresses)` | Write | `js/contract.js` |
| `registerEncryptionKey(pubKey)` | Write | `js/contract.js` → `js/dashboard.js` |
| `getRDO(rdoId)` | Read | `js/contract.js` → multiple pages |
| `getRDOMeta(rdoId)` | Read | `js/contract.js` (available but `getRDO` preferred) |
| `getRDOPolicy(rdoId)` | Read | `js/contract.js` (available but `getRDO` preferred) |
| `encryptionPubKeys(address)` | Read | `js/contract.js` → PKI flow |
| `getEncryptedKey(rdoId, user)` | Read | `js/contract.js` → `js/view.js` |
| `isWhitelisted(rdoId, user)` | Read | `js/contract.js` |
| `isActive(rdoId)` | Read | `js/contract.js` |
| `rdoCounter()` | Read | `js/contract.js` (attempted, but uses binary search fallback) |

### Events Emitted & Consumed

| Event | Usage |
|-------|-------|
| `RDOCreated` | Parsed from tx receipt to extract `rdoId` after minting |
| `RDOAccessed` | Parsed from tx receipt to determine access granted/denied + reason |
| `RDORevoked` | Emitted on revoke |
| `RDOLocked` | Emitted on auto-lock |
| `RDOUnlocked` | Emitted on manual unlock |
| `WhitelistUpdated` | Emitted on whitelist changes |
| `EncryptionKeyRegistered` | Emitted on PKI profile registration |

## IPFS / Pinata

| Integration | Details |
|-------------|---------|
| **Pinata Cloud** | IPFS pinning service. API keys currently prototyped in `contractAddress.js` config. For production, **remove keys from client-side code** and implement a server-side upload proxy, or securely scope upload tokens via Pinata JWTs. |
| **Pinata Upload API** | `https://api.pinata.cloud/pinning/pinFileToIPFS` — used for encrypted content upload |
| **Pinata JSON Upload** | `https://api.pinata.cloud/pinning/pinJSONToIPFS` — available but not primary path |
| **Pinata Auth Test** | `https://api.pinata.cloud/data/testAuthentication` — connection validation |
| **Pinata Gateway** | `https://coffee-tricky-felidae-740.mypinata.cloud/ipfs/` — dedicated gateway |

### IPFS Gateway Fallback Chain

The `fetchFromIPFS()` function in `js/ipfs.js` tries **7 gateways** in sequence with 60s timeout each:

1. `gateway.pinata.cloud`
2. `ipfs.io`
3. `nftstorage.link`
4. `w3s.link`
5. `4everland.io`
6. `cf-ipfs.com`
7. `dweb.link`

### Demo Mode

When Pinata API keys are set to placeholder values (`'YOUR_PINATA_API_KEY'`), upload functions return fake CIDs starting with `Qm` — allows UI testing without network access.

## External CDNs

| CDN | Assets Served |
|-----|---------------|
| `cdnjs.cloudflare.com` | ethers.js, Three.js |
| `cdn.tailwindcss.com` | TailwindCSS + plugins |
| `fonts.googleapis.com` | Google Fonts (Space Grotesk, Inter, Material Symbols) |

## Block Explorer

| Service | Usage |
|---------|-------|
| **Etherscan (Sepolia)** | Transaction links generated via `getExplorerUrl()` in `js/shared.js` — format: `https://sepolia.etherscan.io/tx/{hash}` |

## Authentication

- **No traditional auth** — wallet address is the identity
- **No backend server** — all state is on-chain or in browser localStorage
- **PKI identity** — users register RSA-OAEP public keys on-chain via the `registerEncryptionKey()` contract function

## Databases

- **None** — no databases. All persistent state lives:
  - On-chain (contract storage)
  - IPFS (encrypted content)

> **Warning on Local Storage & Keys**
> Legacy implementations used browser `localStorage` (`rdo_keys`, `rdo_meta`) to cache raw base64 AES keys. This practice is deprecated. Clearing browser data will irreversibly lose keys if PKI backups were not performed. Modern implementations must use Web Crypto non-extractable keys or rely exclusively on the on-chain PKI wrapper system for explicit key export/import to prevent loss.

## Webhooks / Push Notifications

- **None** — the system is fully pull-based. Users must manually load/refresh to see state changes.
