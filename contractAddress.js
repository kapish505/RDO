// ── RDO Protocol Configuration ─────────────────────────────────────────────
// Update these values with your actual deployed contract and API keys.

// Deployed smart contract address (Sepolia Testnet)
const CONTRACT_ADDRESS = "0x862043a3867D1B33acca954E31F7Ba76Ad9F88cb";

// Pinata IPFS Configuration
// Get these from https://app.pinata.cloud/keys
const PINATA_API_KEY = "2c0c64ef7771c9e9477b";
const PINATA_SECRET_API_KEY = "3cf3d96f512050cd62b929b6c7907073a3a501eb72dae4e8f39dfcfc28e15e5b";
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
