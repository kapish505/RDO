# RDO (Refusable Digital Object)

![RDO Logo](https://img.shields.io/badge/RDO-Web3-blue?style=for-the-badge&color=blue)
![License](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)

**RDO (Refusable Digital Object)** is a revolutionary decentralized application that allows creators to encrypt, share, and monetize digital files with absolute cryptographic sovereignty. 

Have you ever sent a file to someone and wished you could take it back, or make them pay every time they open it? RDO lets you lock your files, distribute them securely over the IPFS network, and maintain absolute control over who gets to view them using an Ethereum Smart Contract.

---

## 🌟 What makes RDO different?

When you normally encrypt a file and send it over the internet, you have to find a secure way to send the recipient the password! If your friend leaks the password, you lose control of your file forever.

RDO entirely fixes the "Key Delivery Problem" by using an **Invisible PKI system**. 

When a user visits RDO, they connect their MetaMask wallet, and the app generates a hidden "Digital Key" uniquely tied to their Ethereum account. When you choose to share a file with them, RDO encrypts your file using their public lock! 
There are **no passwords to copy/paste, no emails to send**. When they open the file, their wallet automatically unlocks it.

## 🚀 Key Features

- **Refusable Access**: You can instantly revoke a recipient's access to an RDO with a single transaction. Since their UI must query the Smart Contract before decrypting, the file stays locked forever.
- **Pay-Per-View Monetization**: Set a price for your file in Sepolia ETH. Whenever a user wants to read or download your content, they must pay the exact fee inside their browser before the smart contract releases the payload.
- **Granular Rights Management**: Allow users to 'Read', but disable their ability to 'Copy Text' or 'Download' the actual source file.
- **Decentralized Storage**: Files are encrypted with AES-256-GCM client-side inside your browser and uploaded directly to IPFS natively. Our servers never see your unencrypted data or your keys.

---

## 🛠 Tech Stack

- **Frontend Interface**: Vaniila Javascript, HTML5, CSS3, Three.js (for high-end 3D visual geometry), Tailwind CSS.
- **Cryptography**: Native Web Crypto API (AES-GCM & RSA-OAEP). No external cryptography libraries required.
- **Smart Contract**: Solidity (ERC-721 inspired object management). Deployed on the Sepolia Testnet.
- **Decentralized Storage**: IPFS, pinned via a serverless Vercel function wrapping the Pinata API.
- **Blockchain Interaction**: Ethers.js ^6.0.

## ⚙️ Getting Started

1. **Clone the Repository**
   ```bash
   git clone https://github.com/kapish505/RDO.git
   cd RDO
   ```

2. **Configure Environment** (If deploying locally)
   You'll need a Pinata API Key for IPFS storage.
   Create a `.env` file for your Vercel deployment containing:
   ```
   PINATA_API_KEY=your_key
   PINATA_SECRET_API_KEY=your_secret
   ```

3. **Install & Run**
   Since it uses standard HTML/JS, simply serve the root directory using any local development server.
   ```bash
   # example using npm's http-server
   npx http-server .
   ```

4. **Connect Wallet**
   Ensure your MetaMask is connected to the **Sepolia Testnet**.

## 🛡 Security Notes
This is experimental beta software deployed to a testnet. While the cryptographic logic successfully ensures files cannot be viewed without possession of the derived web-crypto wallet keys, always exercise caution when integrating highly sensitive personal information onto distributed protocols like IPFS.
