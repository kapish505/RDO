# Integrations & Dependencies

## 1. MetaMask (EVM Wallet)

The app relies heavily on browser-based Ethereum wallets (primarily MetaMask) injected globally as `window.ethereum`.

### Usage
- **Identity**: Connects to user's designated `window.walletState.address`.
- **Transactions**: Signs transactions through `ethers.js` connected to the `web3Provider`.
- **E2EE Bootstrapping**: Requires PKI Signature creation to derive an internal Master AES Key locally inside the client's transient memory environment for payload decryption bootstrapping.

## 2. Pinata (IPFS Gateway API)

IPFS is the exclusive asset storage solution for RDO JSON blobs and media objects, accessed globally via Pinata.

### Implementation Details
- **Upload API**: `https://api.pinata.cloud/pinning/pinJSONToIPFS` (Handles JSON serialization and content anchoring)
- **Read APIs**: Multi-gateway fallback configuration to fetch objects via CID. (Primary gateway: `gateway.pinata.cloud`)
- **Key Exposure Security Context**: Keys are currently stored directly inside `contractAddress.js`. This remains a known architectural requirement for statically hosted apps, but migrating to a proxy server to mask the bearer tokens for upload procedures is recommended to avoid abuse.

## 3. Custom Solidity Smart Contract (`RDO.sol`)

The Ethereum VM functions as the ultimate arbiter of access rights and Monetization logic. The integration happens via the `/abi.json` artifact synced from Hardhat/Foundry compilations.

### Key Workflows
- **Retrieving MetaData**: `getRDOMeta(rdoId)` extracts high-level definitions without full iteration.
- **Pay-Per-Open Execution**: When $isPaid$, users confirm a transaction on ETH natively, sending specific WEI values appended directly inside a `contract.requestAccess{value}` operation. The contract now enforces strict matching requirements and bypass reversions cleanly.
- **Verification Mapping**: Stores all encrypted AES key payloads securely via PKI user bindings mapping. Contracts operate off mapped struct types synced locally to matching exact struct lengths.

## 4. Graphify (Architecture/Dependency Analysis)

An active MCP integration used offline during planning to parse inter-module JavaScript file import structures and code path references. Relies on the Python `uv` MCP Server logic pointing precisely across `js/` dependencies.

## External Network Dependencies Summary
- `gateway.pinata.cloud` (IPFS Read)
- `api.pinata.cloud` (IPFS Write)
- `cloudflare-ipfs.com` (Fallback IPFS read)
- `ipfs.io` (Fallback IPFS read)
- `cdn.tailwindcss.com` (CSS Framework)
- `cdnjs.cloudflare.com` (Scripts & Libraries)
