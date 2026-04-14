# Project Stack

## Core Technologies

- **Frontend**: HTML5, Vanilla JavaScript (ES6+), CSS3
- **Styling**: Tailwind CSS (Utility-first CSS framework via CDN)
- **Web3 Interface**: Ethers.js v6 (for Ethereum blockchain interaction)
- **Smart Contracts**: Solidity ^0.8.20 (Custom `RDO.sol` implementation)
- **Blockchain Network**: Sepolia Testnet (Ethereum)
- **Storage**: IPFS (InterPlanetary File System) via Pinata

## Libraries and Dependencies

### Application Logic & UI
- **Tailwind CSS**: 3.4.1 (Loaded via CDN script `https://cdn.tailwindcss.com`)
  - Configured inline via `<script id="tailwind-config">` in HTML files.
- **Three.js**: Lightweight 3D animation library (Loaded via CDN `https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js`)
  - Used specifically for the interactive background starfield/particle effect.
- **FontAwesome**: Iconography (Loaded via CDN `https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css`)
- **Google Fonts**: Space Grotesk, Inter, and Material Symbols Rounded.

### Web3 & Cryptography
- **Ethers.js**: 6.11.1 (Loaded via CDN `https://cdnjs.cloudflare.com/ajax/libs/ethers/6.11.1/ethers.umd.min.js`)
  - Used for contract abstraction, transaction signing, and ABI decoding.
- **Web Crypto API**: Native browser API (`window.crypto.subtle`)
  - Used for AES-GCM (payload encryption) and RSA-OAEP (key distribution).

### Tooling & Infrastructure
- **Dependency Graphing**: `graphify` via Python `uv` MCP Server
  - Used iteratively to map project imports and analyze structural dependencies. Includes `graph.json` and artifact outputs.
- **Version Control**: Git / GitHub
- **Deployment**: Vercel (Configured via `vercel.json` as a static site)

## Developer Environment
- **Environment**: Client-side execution exclusively. There are no Node.js backend processes or module bundlers (Webpack, Vite, etc.) used for the frontend application at runtime. Execution runs raw in-browser. 
- **Contract Environment**: Hardhat/Foundry (implied for compilation) to derive `abi.json`.
