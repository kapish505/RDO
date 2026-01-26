import { ethers } from 'ethers';

// Monad Testnet Config
export const MONAD_TESTNET_CONFIG = {
    chainId: 10143,
    name: 'Monad Testnet',
    rpcUrl: 'https://testnet-rpc.monad.xyz',
    explorer: 'https://testnet.monadexplorer.com',
    currency: 'MON'
};

// RDO Registry Address (Monad Testnet)
export const CONTRACT_ADDRESS = "0xC7c2B004Dc5Ee30D3a1114b6f33E989c81dD0d2F";

// Simplified ABI for RDO Interactions
export const RDORegistryABI = [
    "function createRDO(bytes32 rdoHash, uint8 rdoType, tuple(bool forbidCopy, bool forbidForward, bool forbidExport, uint256 expiry, uint8 accessType, uint256 maxUses, bool lockOnViolation, bool requireIdentity) rules, string metadataCID, address[] whitelist) external returns (uint256)",
    "function rdos(uint256) view returns (uint256 id, address creator, bytes32 rulesHash, uint8 rdoType, string metadataCID, bool locked, uint256 violationCount)",
    "function requestAction(uint256 rdoId, uint8 actionType, bytes signature) external",
    "event RDOCreated(uint256 indexed id, address indexed creator, uint8 rdoType)"
];
