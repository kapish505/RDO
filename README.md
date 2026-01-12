# RDO - Objects That Say No

**A new Web3 primitive for digital sovereignty.**  
RDOs (Refusable Digital Objects) are digital containers that enforce their own usage rules. They autonomously refuse forbidden actions (like "Copy" or "Forward") and emit cryptographic proofs of their refusal on the Ethereum blockchain.

---

## 🚀 Features

*   **Self-Sovereign Rules**: Rules (e.g., "No Forwarding") are stored immutably on-chain.
*   **Cryptographic Refusal**: When a rule is violated, the object emits an `ActionRefused` event — a permanent, verifiable proof that "No" was said.
*   **Encrypted Payloads**: Content is encrypted client-side (AES-GCM); only the rules are public.
*   **Decentralized Storage**: Metadata lives on IPFS (Pinata); Logic lives on Sepolia.

---

## 🛠️ Architecture

1.  **Frontend (`app/`)**: Next.js 14, Tailwind, RainbowKit. Handles encryption and wallet signatures.
2.  **Smart Contract (`contracts/`)**: `RDORegistry.sol`. Maps `rdoId` to `rulesHash` and validates `requestAction` calls.
3.  **Storage (`lib/ipfs.ts`)**: IPFS via Pinata.
4.  **Cryptography (`lib/crypto.ts`)**: Web Crypto API for client-side AES-GCM.

---

## 🏁 Deployment Instructions

### Prerequisites
*   Node.js v18+
*   Metamask Wallet (with Sepolia ETH)
*   Pinata Account (Free Tier)
*   WalletConnect Project ID (Free)

### 1. Environment Variables
Copy the example file:
```bash
cp .env.example .env
```

Fill in `.env` with your secrets:
*   `NEXT_PUBLIC_PINATA_JWT`: Your Pinata JWT (Admin Key).
*   `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID`: From WalletConnect Cloud.
*   `NEXT_PUBLIC_CONTRACT_ADDRESS`: (Leave blank until deployed).
*   `PRIVATE_KEY`: Your generic testing wallet private key (for deploying contracts).

### 2. Deploy Smart Contract
Deploy the Registry to Sepolia:
```bash
npx hardhat run scripts/deploy.ts --network sepolia
```
Copy the generic address output (e.g., `0xeA50...`) and paste it into `.env` as `NEXT_PUBLIC_CONTRACT_ADDRESS`.

### 3. Deploy Frontend (Vercel)
1.  Push code to GitHub.
2.  Import project into Vercel.
3.  Add the **Usage Environment Variables** (See `walkthrough.md` for the table).
4.  Deploy.

---

## 🛡️ Security & Threat Model

*   **Client-Side Integrity**: RDOs rely on a compliant "Viewer" (the reference runtime) to ask the contract for permission.
    *   *Risk*: A malicious viewer bypasses the contract check.
    *   *Mitigation*: The payload is encrypted. A more advanced version (post-MVP) uses Threshold Cryptography, where decryption keys are only released by a network of nodes *after* they verify the `ActionAllowed` event on-chain.
*   **Key Management**: Currently uses browser-based AES keys.
    *   *Risk*: User clears local storage.
    *   *Mitigation*: Keys should be wrapped in a JWS and stored in a secure enclave or decentralized key manager (Lit Protocol / Threshold).
*   **Contract Immutability**: Rules are hashed.
    *   *Feature*: Once minted, rules cannot be changed. This creates trust for the recipient.

---

## 🎤 Judge Demo Script

**Pitch (30s):**
"RDOs are the first class of digital objects that can say no. Today, when you send a file, you lose control. RDOs change that. You mint an object, define its immutable rules, and share it. If someone tries to Forward a non-forwardable RDO, the object *itself* refuses the action and validates that refusal on-chain. It's not just DRM; it's a new sovereign primitive for the web."

**Demo (90s):**
1.  **Create**: Go to `/create`. Type "Top Secret Memo". Set Rule: "No Forwarding". Mint. (Show Metamask sign).
2.  **Verify**: Show the "RDOCreated" transaction hash.
3.  **View**: Open the RDO. Read the content.
4.  **Refuse**: Click the "Forward" button.
5.  **Proof**: Watch the **Refusal Animation** (Shield blocks the token).
6.  **Trust**: Click "Verify Refusal". It takes you to Etherscan. Show the `ActionRefused` event log. "The blockchain proves this object said No."

---

## 📜 SDK Integration

Any website can reference an RDO:

```typescript
import { RDOClient } from './lib/sdk';

const rdo = new RDOClient();
// Verify if an object refused an action
const result = await rdo.verifyRefusal('0xTxHash...');
if (result.verified) console.log("Refusal Confirmed.");
```
