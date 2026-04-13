# Concerns

## 🔴 Critical Security Issues

### Exposed API Secrets in Source Code

**File**: `contractAddress.js` (lines 9-10)

Pinata API key and secret are hardcoded in plain text and committed to the repository:

```javascript
const PINATA_API_KEY = "2c0c64ef7771c9e9477b";
const PINATA_SECRET_API_KEY = "3cf3d96f512050cd62b929b6c7907073a3a501eb72dae4e8f39dfcfc28e15e5b";
```

**Impact**: Anyone with repository access (or who views page source) can use these keys to upload/manage files on the Pinata account. Since this is a client-side app, these keys are also visible in the browser's network inspector.

**Recommendation**: Move to a server-side proxy or use Pinata's JWT-based auth with short-lived upload tokens.

### Client-Side Access Enforcement

The contract's `requestAccess()` returns a boolean + reason, but the actual decryption happens entirely client-side. A sophisticated attacker could:

1. Skip the `requestAccess()` call entirely
2. Fetch the IPFS content directly by CID (publicly available)
3. If they have the AES key (from URL, localStorage, or intercepted key delivery), decrypt without on-chain enforcement

The PKI system mitigates this for whitelist-gated RDOs (attacker needs RSA private key), but public RDOs with keys shared via URL/localStorage remain vulnerable.

### No Payment Enforcement on Client

In `js/view.js`, paid access uses `sendAccessPayment()` which is a **separate** ETH transfer to the creator wallet — it is not part of the `requestAccess()` contract call. A user could call `requestAccess()` directly without paying, since payment verification on-chain was added later but the frontend still uses the old pattern.

**Update**: The Solidity contract *does* support `msg.value` payment in `requestAccess()`, but the frontend sends payment separately via `sendAccessPayment()` instead of attaching value to the contract call.

## 🟠 Technical Debt

### Inconsistent Tailwind Configuration Across Pages

Each HTML page contains its own inline `<script id="tailwind-config">` with slightly different color values:

| Token | `index.html` | Other pages |
|-------|-------------|-------------|
| `surface` | `#090909` | `#0e0e11` |
| `background` | `#090909` | `#0e0e11` |
| Font families | Space Grotesk + Inter | Varies per page |

This leads to visual inconsistencies and makes design updates error-prone.

### Duplicated `showToast()` Function

`showToast()` is defined in **two places**:
1. `js/wallet.js` (line 14) — early fallback version
2. `js/shared.js` (line 7) — full version with DOM rendering

When `shared.js` loads after `wallet.js`, the full version overwrites the fallback — but this depends on script loading order. If loading order changes, toast behavior breaks silently.

### Binary Search for RDO Discovery

`js/contract.js` → `getMyRDOIds()` uses a binary search up to 4096 to discover total RDO count because `rdoCounter()` apparently reverts on the deployed contract. This is slow and fragile:

```javascript
let high = 4096; // sufficiently high max for this phase
while (low <= high) {
  let mid = Math.floor((low + high) / 2);
  try { await contract.getRDO(mid); ... }
}
```

Then it fetches ALL RDOs sequentially to filter by creator address. For large-scale usage, this will be extremely slow.

### Missing `test.html` Page

Footer links in `create.html` and `view.html` reference `test.html`, but this file doesn't exist in the repository. Clicking the "Test Console" link produces a 404.

### No Build Step or Minification

All JavaScript and CSS are served unminified. For a production dApp:
- No tree-shaking (entire Three.js loaded for a background effect)
- No code splitting
- No asset hashing for cache busting (only `?v=2` on `animations.css`)

### localStorage Key Management

Decryption keys stored in `localStorage` under `rdo_keys` are plaintext base64 AES keys. If a user clears browser data, keys are lost. The PKI system provides a recovery path, but only if the user has registered a profile.

### Unused CSS Design System

`css/style.css` defines a comprehensive design system with CSS custom properties (`:root` variables), but the HTML pages predominantly use **Tailwind utility classes** with hardcoded values instead. The design system is largely dead code — the token values don't match what's used inline.

## 🟡 Performance Concerns

### Three.js Background on All Pages

`js/background.js` creates a full Three.js scene with 2,475 animated dots (45×55 grid) on **every page**, including data-heavy pages like the dashboard. This:
- Adds ~200KB of Three.js library overhead
- Runs a continuous `requestAnimationFrame` loop
- Could cause jank on lower-end devices

### No Pagination for Dashboard

`js/dashboard.js` loads ALL of a user's RDOs at once. With the binary search discovery method, this means:
- Up to 12 binary search calls to find max RDO count
- Then N parallel `getRDO()` calls for every RDO that exists
- All rendered into the DOM simultaneously

### IPFS Multi-Gateway Retry

`fetchFromIPFS()` tries 7 gateways sequentially with 60-second timeout each. Worst case: **7 minutes** before reporting failure. No parallel/race strategy is used.

### Large File Handling

Files are uploaded to IPFS via the create flow, but the encrypted content goes through `JSON.stringify()` and base64 encoding. A large file (e.g., 50MB) would:
- Be read into memory as a data URL (base64 → ~33% larger)
- Get JSON.stringify'd (further overhead)
- Hit the IPFS upload as a single huge payload

## 🟡 Fragile Areas

### RDO ID Extraction After Mint (Triple Fallback)

`contract.js` → `createRDO()` has 3 sequential fallback methods to extract the minted RDO ID, suggesting past unreliability:

1. `staticCall` prediction (can fail)
2. `RDOCreated` event parsing (can fail if ABI mismatch)
3. Raw log topic scraping (brittle, can misidentify)

### ABI Deployed Contract Mismatch Guard

The `getCreateRDOParamFields()` function dynamically filters parameters to only include fields the deployed contract supports. This suggests the ABI has been updated progressively while the deployed contract may be an older version.

### Provider Override Hack

`getRDO()` accepts a `providerOverride` parameter and temporarily mutates `walletState.provider` during the call, then restores it. This is not thread-safe if multiple calls happen concurrently.

### Wallet State as Global Mutable Object

`window.walletState` is mutated from multiple places (`wallet.js`, `contract.js` provider override hack) without any synchronization. Race conditions are possible during wallet connection + immediate contract calls.

## 🔵 Missing Features / Gaps

- **No ownership transfer** — explicitly flagged as V2 (banner in `dashboard.html`)
- **No access log display** — `view.html` has an access log table section (`#access-log-section`) but it remains `hidden-section` — `getRDOEvents()` exists in `contract.js` but is never called from the UI
- **No mobile navigation** — the `<nav>` hides links on mobile (`hidden md:flex`) with no hamburger menu
- **No offline support** — no service worker, no PWA manifest
- **No error recovery** — if the 3-step create process fails at step 2 or 3, user must re-encrypt (step 1 data is lost on page reload)
- **No ENS support** — whitelist addresses must be raw hex, no name resolution
- **No batch operations** — revoking/unlocking multiple RDOs requires individual transactions
