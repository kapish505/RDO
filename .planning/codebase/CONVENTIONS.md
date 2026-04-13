# Conventions

## Code Style

### JavaScript

- **Module pattern**: Each JS file is a standalone module loaded via `<script src>` tags in order. No ES modules (`import`/`export`), no bundlers.
- **Global scope**: All functions and state are global. Modules communicate via `window.*` globals (e.g., `window.walletState`, `window.RDO_CONFIG`).
- **Async/await**: Consistently used for all asynchronous operations (contract calls, IPFS, crypto). No raw `.then()` chains.
- **String literals**: Single quotes preferred in JS (`'string'`), double quotes in HTML attributes.
- **Semicolons**: Always used.
- **Arrow functions**: Used for callbacks/lambdas. Named `function` declarations for top-level module APIs.
- **Template literals**: Used for HTML string building (`innerHTML = \`...\``).
- **Error handling**: Try/catch wrapping all async operations. Errors displayed via `showToast(msg, 'error')`.

### Naming

```javascript
// Constants — SCREAMING_SNAKE_CASE
const CONTRACT_ADDRESS = "0x...";
const CRYPTO_ALGORITHM = 'AES-GCM';
const TARGET_CHAIN_ID = '0xaa36a7';

// Global state objects — camelCase
window.walletState = { ... };
let rdoConfig = { ... };
let rdoState = { ... };

// Functions — camelCase, verb-first
async function connectWallet() { ... }
async function encryptContent(content) { ... }
async function getRDO(rdoId) { ... }
function formatAccessType(type) { ... }
function updateSummary() { ... }

// DOM IDs — kebab-case
document.getElementById('wallet-btn');
document.getElementById('step-encrypt');
document.getElementById('rdo-input');
```

### Solidity

- **Contract name**: PascalCase (`RDO`)
- **Functions**: camelCase (`createRDO`, `requestAccess`, `revokeRDO`)
- **Modifiers**: camelCase (`onlyCreator`, `rdoExists`, `rdoActive`)
- **Events**: PascalCase (`RDOCreated`, `RDOAccessed`, `WhitelistUpdated`)
- **State variables**: camelCase with underscore prefix for private (`_rdos`, `_whitelist`, `_encryptedAESKeys`)
- **Enums**: PascalCase (`AccessType`)
- **Structs**: PascalCase (`DigitalObject`, `CreateRDOParams`, `RDOView`)
- **NatSpec comments**: Used on public functions (`@notice`, `@param`, `@return`, `@dev`)

### CSS

- **Design tokens**: CSS custom properties in `:root` (`--bg`, `--accent`, `--text-1`)
- **Component classes**: BEM-inspired but flat (`.btn-primary`, `.card-featured`, `.toast-success`)
- **Utility classes**: Tailwind used inline in HTML; custom CSS for complex components
- **Animations**: Separate file (`animations.css`) with descriptive `@keyframes` names (`fadeUp`, `scaleIn`, `orbPulse`)
- **Responsive**: Mobile-first with `@media (max-width: ...)` breakpoints at 768px and 1024px

## Patterns

### Toast Notification Pattern

```javascript
// js/shared.js provides the canonical showToast():
showToast('Message text', 'success');  // success | error | info | warning
showToast('Wallet connected: 0x1234', 'success', 4000);  // optional duration

// js/wallet.js has its own early showToast() fallback for before shared.js loads:
function showToast(msg, type) {
  if (typeof window._showToast === 'function') return window._showToast(msg, type);
  console.log(`[${type}] ${msg}`);
}
```

### Wallet Connection Pattern

```javascript
// 1. All pages include wallet.js which registers click handlers on [data-action="connect-wallet"]
// 2. Auto-connect on page load via eth_accounts (silent, no popup)
// 3. Manual connect via eth_requestAccounts (triggers MetaMask popup)
// 4. Network auto-switch to Sepolia if on wrong chain
// 5. Event listeners for accountsChanged and chainChanged

// Check connection before operations:
if (!window.walletState.address) {
  await connectWallet();
  if (!window.walletState.address) throw new Error("Wallet not connected");
}
```

### Contract Call Pattern

```javascript
// All contract calls go through getContract() which handles provider/signer selection:
async function getContract(requireSigner = false) {
  const abi = await loadABI();  // Lazy-loaded from abi.json
  if (requireSigner) {
    return new ethers.Contract(CONTRACT_ADDRESS, abi, walletState.signer);
  } else {
    return new ethers.Contract(CONTRACT_ADDRESS, abi, walletState.provider);
  }
}

// Write calls use requireSigner=true, reads use false
const contract = await getContract(true);  // for writes
const contract = await getContract(false); // for reads
```

### Step-Based Execution (Create Page)

```javascript
// 3-step sequential pipeline on create.html:
// Step 1: Encrypt → enables Step 2
// Step 2: IPFS Upload → enables Step 3
// Step 3: Mint on-chain → shows success card

async function runStep(step) {
  // Each step: show loading → do work → show done → enable next step
  // Error handling restores UI state
  // Success card replaces step buttons
}
```

### ABI Compatibility Guard

```javascript
// contract.js uses getCreateRDOParamFields() to filter params before contract call:
// This prevents errors when the deployed contract ABI doesn't have newer fields
const supportedFields = await getCreateRDOParamFields();
const safeParams = Object.fromEntries(
  Object.entries(paramsObj).filter(([key]) => supportedFields.has(key))
);
```

### RDO ID Extraction (Triple Fallback)

```javascript
// After createRDO() tx, ID is extracted via 3 methods:
// 1. staticCall prediction (before sending tx)
// 2. RDOCreated event log parsing (from receipt)
// 3. Raw topic scraping (last resort)
```

### Owner Bypass Pattern

```javascript
// In view.js, the owner skips the on-chain requestAccess() call entirely:
if (isOwner) {
  // Just check permission flags locally, don't consume openCount
} else {
  const accessResult = await requestAccess(currentRdoId, action);
}
```

## Error Handling

- **No global error boundary** — each async function has its own try/catch
- **User-facing errors**: Displayed via `showToast(err.message, 'error')`
- **Fallback to console**: `console.error()` and `console.warn()` for debugging
- **MetaMask rejection**: Detected via `error.code === 4001`
- **Network errors**: IPFS fetch tries 7 gateways before failing
- **ABI load failure**: Throws error, caught by calling function
- **No retry logic** (except IPFS gateway fallback chain)

## File Organization Rules

1. **One page = one page-specific JS file** (`create.js`, `view.js`, `dashboard.js`)
2. **Shared services are separate files** loaded before page-specific scripts
3. **No JS bundling or minification** — files served raw
4. **CSS split by concern**: `style.css` for design system, `animations.css` for motion
5. **Config is JS, not JSON** — `contractAddress.js` uses `const` declarations (not importable)
6. **ABI is JSON** — loaded via `fetch()` at runtime, not inlined

## UI Conventions

- **Dark-only theme** — all pages use `<html class="dark">`
- **Material Symbols** — icon font used for all icons (not SVG icons)
- **Uppercase labels** — section headers, button text, badges all use `uppercase tracking-widest`
- **Monospace for data** — addresses, CIDs, hashes displayed in `font-mono`
- **Skeleton loading** — shimmer animation placeholders during data fetch
- **Step indicators** — color-coded status labels (Ready → Queued → Done ✓)
