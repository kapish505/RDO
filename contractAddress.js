// ── RDO Protocol Configuration ─────────────────────────────────────────────
// Update these values with your actual deployed contract and API keys.

// Deployed smart contract address (Sepolia Testnet)
const CONTRACT_ADDRESS = "0xaddF555472161276a0389e955335d01a8F71bcE7";

// Pinata IPFS Configuration
// Keys removed for security; uploads now route through Vercel serverless functions
const PINATA_GATEWAY = "https://coffee-tricky-felidae-740.mypinata.cloud/ipfs/";

// ── Expose config for test console ─────────────────────────────────────────
// The test console uses window.RDO_CONFIG to access ABI + address
window.RDO_CONFIG = {
  CONTRACT_ADDRESS,
  // ABI is loaded lazily from abi.json by contract.js — exposed here for direct use
  get ABI() {
    // Synchronous placeholder; real ABI is always fetched via loadABI() in contract.js
    return [];
  }
};
