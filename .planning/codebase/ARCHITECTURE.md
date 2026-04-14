# Architecture

## High-Level Web3 System Design

The application is structured as a **Serverless Static dApp**, relying on distributed nodes and client browsers rather than a centralized backend architecture. 

```mermaid
flowchart TD
    Browser[Client Browser\n(HTML/JS)]
    Wallet[MetaMask / Web3 Wallet]
    SmartContract[RDO.sol\nSepolia Testnet]
    IPFS[Pinata IPFS Gateway]

    Browser <-->|Signs Txs| Wallet
    Wallet <-->|Executes Logic & Auth| SmartContract
    Browser <-->|Upload/Read Encrypted Payload| IPFS
    Browser <-->|Reads State/Events| SmartContract
```

## Component Architecture

### 1. Presentation Layer (`*.html`, `js/{page}.js`)
Each distinct application state exists as an independent static HTML file binding to a specific logic script.
- **`index.html`**: Marketing layer & connect wallet entry point.
- **`dashboard.html` (`dashboard.js`)**: Hub for PKI Registration, Object Tracking, and Status Updates.
- **`create.html` (`create.js`)**: Encrypting payloads, Pinata uploads, handling RDO Configuration (Pay-Per-Open).
- **`view.html` (`view.js`)**: Display operations, access authorization calls, processing on-chain Decryption Keys.

### 2. State & Protocol Layer (`js/contract.js`, `js/wallet.js`)
Abstracts UI complexity from asynchronous EVM transaction lifecycles and standardizes the ethers.js interaction mapping.
- Validates struct sizing ensuring ABI encoding compliance before dispatching to nodes.
- Serves as the master cache layer for dynamic states (`window.walletState`) controlling connection states application-wide.
- Executes fallbacks (like recursive topic parsing on creation failure) securing data pipelines.

### 3. Cryptography Engine (`js/crypto.js`)
Handles WebCrypto standards exclusively.
- Implements strict **AES-GCM 256** object-payload chunking for files & text.
- Generates **RSA-OAEP** key pairs for users.
- Facilitates the "Key Distribution" strategy handling Key Encryption Keys (KEK) across PKI. 

## End-to-End Key Operation Flows

### PKI Registration Loop
1. User connects Wallet.
2. User clicks "Generate & Register Profile".
3. `crypto.js` asks MetaMask to sign a standard message deterministically.
4. Hash derived from signature crafts an AES Key Encryption Key.
5. Generated RSA keypair wraps payload. Public key is uploaded explicitly into EVM public mapping.

### Monetized Interaction Loop (`Pay-Per-Open`)
1. Creator toggles **isPaid** inside `create.js`, establishing an ETH price.
2. ABI Encodes parameter tuple properly mapped avoiding sequence overruns. 
3. User visits `view.html`. Application detects RDO involves financial barriers.
4. User clicks "Unlock" and confirms Native ETH Transaction passing specific `.value` payloads identical to defined `.pricePerAccess`.
5. Smartcontract (`RDO.sol`) extracts the exact payment, redirects it securely to the Creator, bypassing logic vulnerabilities successfully recording the Action as an Event for frontend ingestion.
