# Technology Stack

## Languages & Runtime

| Layer | Technology | Version / Notes |
|-------|-----------|-----------------|
| Smart Contract | Solidity | `^0.8.20` — single contract `contracts/RDO.sol` |
| Frontend | HTML5 + Vanilla JavaScript | No framework; plain `.html` pages + ES2020+ JS modules |
| Styling | TailwindCSS (CDN) + Vanilla CSS | Tailwind loaded via `cdn.tailwindcss.com` with `forms` and `container-queries` plugins; custom CSS in `css/style.css` and `css/animations.css` |

## Frontend Dependencies (CDN-loaded, no npm)

| Library | CDN Source | Purpose |
|---------|-----------|---------|
| **ethers.js** v6.11.1 | `cdnjs.cloudflare.com/ajax/libs/ethers/6.11.1/ethers.umd.min.js` | Ethereum wallet interaction, contract calls, ABI encoding |
| **TailwindCSS** (latest) | `cdn.tailwindcss.com?plugins=forms,container-queries` | Utility-first CSS framework |
| **Three.js** r128 | `cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js` | Animated dotted wave background (`js/background.js`) |
| **Google Fonts** | fonts.googleapis.com | Space Grotesk (headlines), Inter (body), Material Symbols Outlined (icons) |

> **No package.json, no npm, no build toolchain.** The project is a pure static site with all dependencies loaded via CDN `<script>` tags.

## Smart Contract Stack

- **Compiler**: Solidity `^0.8.20`
- **Deployment target**: Sepolia Testnet (chainId `0xaa36a7`)
- **Deployed address**: `0xdD1BE8d2cc176A18A6d401e85aa5420288A42746` (in `contractAddress.js`)
- **Deployment method**: Remix IDE (as noted in contract comments)
- **No Hardhat/Foundry** — no test suite, no migration scripts, no local node config

## Configuration Files

| File | Purpose |
|------|---------|
| `contractAddress.js` | Contract address, Pinata API keys, Pinata gateway URL, and `window.RDO_CONFIG` global |
| `abi.json` | Full ABI of the deployed `RDO` contract (647 lines) |
| `vercel.json` | Deployment config — `cleanUrls: true`, `trailingSlash: false` |

## Hosting / Deployment

- **Platform**: Vercel (static hosting)
- **Config**: `vercel.json` with clean URLs (no `.html` extensions needed)
- **No server-side logic** — everything runs in the browser

## Browser APIs Used

| API | Usage |
|-----|-------|
| **Web Crypto API** | AES-256-GCM encryption/decryption, RSA-OAEP key wrapping, PBKDF2 key derivation, SHA-256 hashing |
| **MetaMask / window.ethereum** | Wallet connection, transaction signing, message signing (for PKI recovery) |
| **Clipboard API** | Copy-to-clipboard for RDO IDs, share links, decryption keys |
| **IntersectionObserver** | Scroll-triggered reveal animations |
| **WebGL / Three.js** | Animated particle background |
| **localStorage** | Persisting `rdo_keys` (decryption keys) and `rdo_meta` (monetization metadata) |

## Tailwind Configuration

Tailwind is configured inline via `<script id="tailwind-config">` in each HTML file with:
- **Dark mode**: `class` strategy (all pages use `<html class="dark">`)
- **Custom color tokens**: Material Design 3-inspired surface hierarchy (`surface`, `surface-container`, `surface-container-high`, etc.)
- **Custom fonts**: `headline` (Space Grotesk), `body` (Inter), `label` (Inter)
- **Custom radii**: Very tight defaults (`0.125rem`) with incrementally larger options

> ⚠ Each HTML page re-declares its own Tailwind config inline. Color definitions are slightly inconsistent across pages (e.g., `index.html` uses `"surface": "#090909"` while other pages use `"surface": "#0e0e11"`).
