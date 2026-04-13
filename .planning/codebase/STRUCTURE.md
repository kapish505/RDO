# Directory Structure

## Project Root

```
RDO-2/
├── .git/                        # Git repository
├── .idea/                       # JetBrains IDE settings
├── .planning/                   # GSD planning directory
│   └── codebase/                # Codebase map (this directory)
├── contracts/                   # Solidity smart contracts
│   └── RDO.sol                  # Main contract (450 lines, 19KB)
├── css/                         # Stylesheets
│   ├── animations.css           # Animation system (560 lines, 18KB)
│   └── style.css                # Design system + component styles (791 lines, 20KB)
├── js/                          # JavaScript modules
│   ├── background.js            # Three.js dotted wave background (145 lines)
│   ├── contract.js              # Smart contract interaction layer (359 lines)
│   ├── create.js                # Create page logic & workflow (419 lines)
│   ├── crypto.js                # AES-256-GCM + RSA-OAEP cryptography (409 lines)
│   ├── dashboard.js             # Dashboard page logic (203 lines)
│   ├── ipfs.js                  # Pinata IPFS upload/fetch (170 lines)
│   ├── shared.js                # Shared UI utilities (345 lines)
│   ├── view.js                  # View page logic & decryption (409 lines)
│   └── wallet.js                # MetaMask wallet connection (206 lines)
├── abi.json                     # Contract ABI (647 lines, 11KB)
├── contractAddress.js           # Config: contract address, Pinata keys (23 lines)
├── create.html                  # RDO creation page (428 lines, 27KB)
├── dashboard.html               # User's RDO dashboard (181 lines, 10KB)
├── index.html                   # Landing page / marketing (535 lines, 34KB)
├── vercel.json                  # Vercel deployment config (5 lines)
└── view.html                    # RDO viewer / access page (347 lines, 18KB)
```

## File Categories

### Pages (HTML)

| File | Lines | Purpose | Scripts Loaded |
|------|-------|---------|----------------|
| `index.html` | 535 | Marketing landing page with hero, features, architecture flow, CTA | background, wallet, shared |
| `create.html` | 428 | 3-step RDO creation wizard (encrypt → IPFS → mint) | background, wallet, shared, crypto, ipfs, contract, create |
| `view.html` | 347 | RDO viewer with access controls, decryption, event log | background, wallet, shared, crypto, ipfs, contract, view |
| `dashboard.html` | 181 | Grid of user's created RDOs with revoke/unlock actions | background, wallet, shared, crypto, contract, dashboard |

### Service Modules (JS)

| File | Lines | Responsibility | Dependencies |
|------|-------|---------------|--------------|
| `js/wallet.js` | 206 | MetaMask connection, network switching, global `walletState` | ethers.js |
| `js/contract.js` | 359 | All smart contract read/write calls via ethers.js | wallet.js, abi.json |
| `js/crypto.js` | 409 | AES-256-GCM encrypt/decrypt, RSA-OAEP PKI key wrapping | Web Crypto API |
| `js/ipfs.js` | 170 | Pinata upload, multi-gateway IPFS fetch | contractAddress.js (API keys) |
| `js/shared.js` | 345 | Toast notifications, scroll reveal, particles, copy, modals | — |
| `js/background.js` | 145 | Three.js animated dotted wave (fixed background) | Three.js |

### Page Logic Modules (JS)

| File | Lines | Responsibility | Dependencies |
|------|-------|---------------|--------------|
| `js/create.js` | 419 | Create form state, UI toggles, 3-step execution pipeline | crypto.js, ipfs.js, contract.js |
| `js/view.js` | 409 | Load RDO, access actions, PKI decryption, content rendering | crypto.js, ipfs.js, contract.js |
| `js/dashboard.js` | 203 | Load user's RDOs, render card grid, PKI registration banner | contract.js, crypto.js |

### Configuration

| File | Lines | Purpose |
|------|-------|---------|
| `contractAddress.js` | 23 | Contract address, Pinata API key + secret, gateway URL, `window.RDO_CONFIG` |
| `abi.json` | 647 | Full contract ABI — loaded lazily by `contract.js` via `fetch('./abi.json')` |
| `vercel.json` | 5 | Vercel hosting config: clean URLs, no trailing slashes |

### Smart Contract

| File | Lines | Purpose |
|------|-------|---------|
| `contracts/RDO.sol` | 450 | Single monolithic contract: RDO registry, access control, whitelist, PKI key storage, monetization |

### Stylesheets

| File | Lines | Purpose |
|------|-------|---------|
| `css/style.css` | 791 | Complete design system: tokens, reset, typography, layout, navbar, buttons, cards, forms, toggles, chips, toasts, modals, skeleton loading, responsive breakpoints |
| `css/animations.css` | 560 | Animation keyframes, scroll reveal, hero stagger, float/glow effects, Three.js geometric spins, page loader, ripples, progress bars |

## Key Locations

| Concern | Location |
|---------|----------|
| Contract address + API keys | `contractAddress.js` |
| ABI definition | `abi.json` |
| Wallet state singleton | `js/wallet.js` → `window.walletState` |
| Toast notification system | `js/shared.js` → `showToast()` |
| Encryption/decryption | `js/crypto.js` |
| PKI profile generation | `js/crypto.js` → `generateEncryptionProfile()` |
| PKI key recovery | `js/crypto.js` → `recoverRSAPrivateKey()` |
| IPFS gateway fallback | `js/ipfs.js` → `fetchFromIPFS()` |
| RDO ID extraction after mint | `js/contract.js` → `createRDO()` (staticCall + event parsing + topic scraping) |
| Design tokens (CSS variables) | `css/style.css` → `:root { ... }` |
| Tailwind color/font config | Each HTML file → `<script id="tailwind-config">` |

## Naming Conventions

- **HTML pages**: lowercase, descriptive (`create.html`, `view.html`, `dashboard.html`)
- **JS modules**: lowercase, single-word role (`wallet.js`, `crypto.js`, `contract.js`, `shared.js`)
- **CSS files**: lowercase, descriptive (`style.css`, `animations.css`)
- **Solidity**: PascalCase contract name (`RDO`), camelCase functions (`createRDO`, `requestAccess`)
- **JS functions**: camelCase (`connectWallet`, `packageForIPFS`, `encryptAESKeyWithRSA`)
- **JS globals**: SCREAMING_SNAKE for constants (`CONTRACT_ADDRESS`, `PINATA_API_KEY`), camelCase for state (`walletState`, `rdoConfig`)
- **CSS classes**: Tailwind utility-first + BEM-lite custom classes (`.feature-card`, `.step-btn`, `.perm-toggle`)
- **DOM IDs**: kebab-case (`#wallet-btn`, `#rdo-input`, `#toast-container`, `#step-encrypt`)
