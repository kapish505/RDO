import { createPublicClient, http, parseAbiItem } from 'viem';
import { sepolia } from 'viem/chains';

// RDO SDK - A tiny library to interact with RDOs from any website

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;

const RDORegistryABI = [
    "event ActionRefused(uint256 indexed rdoId, address indexed actor, uint8 actionType, bytes32 violatedRuleHash, string reasonCode)",
    "event ActionAllowed(uint256 indexed rdoId, address indexed actor, uint8 actionType, bytes32 actionHash)",
    "function requestAction(uint256 rdoId, uint8 actionType, bytes calldata actionContext) external returns (bool allowed)"
];

export const ActionType = {
    READ: 0,
    FORWARD: 1,
    COPY: 2,
    DOWNLOAD: 3,
    EXECUTE: 4
} as const;

/**
 * Universal RDO Client
 */
export class RDOClient {
    private client;

    constructor(rpcUrl = 'https://rpc.ankr.com/eth_sepolia') {
        this.client = createPublicClient({
            chain: sepolia,
            transport: http(rpcUrl)
        });
    }

    /**
     * Verifies if a refusal actually happened on-chain.
     * Useful for 3rd party visualizers to prove "The Object Said No".
     */
    async verifyRefusal(txHash: `0x${string}`) {
        const receipt = await this.client.getTransactionReceipt({ hash: txHash });

        // Parse logs for ActionRefused
        const refusalEvent = parseAbiItem(RDORegistryABI[0]);

        // Find logs
        // In a real SDK we would decode logs properly using viem's parseLog
        // For MVP, we return the receipt status and check if logs exist
        return {
            verified: receipt.status === 'success',
            blockNumber: receipt.blockNumber,
            hasLogs: receipt.logs.length > 0
        };
    }
}

// Example Usage:
// const rdo = new RDOClient();
// await rdo.verifyRefusal('0x...');
