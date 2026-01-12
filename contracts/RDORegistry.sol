// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/Context.sol";

/**
 * @title RDORegistry
 * @dev The core registry for Refusable Digital Objects.
 *      Enforces immutable rules and emits refusal proofs.
 */
contract RDORegistry is Context {
    
    // Core definition of an RDO
    struct RDO {
        uint256 id;
        address creator;
        bytes32 rulesHash;      // Immutable hash of the rules JSON
        string metadataCID;     // IPFS CID for metadata (name, desc, etc.)
        uint256 createdAt;
    }

    // Counter for RDO IDs
    uint256 private _currentRdoId;

    // Mapping from ID to RDO
    mapping(uint256 => RDO) public rdos;

    // Events
    event RDOCreated(
        uint256 indexed rdoId,
        address indexed creator,
        bytes32 rulesHash,
        string metadataCID
    );

    event ActionAllowed(
        uint256 indexed rdoId,
        address indexed actor,
        bytes32 actionHash
    );

    event ActionRefused(
        uint256 indexed rdoId,
        address indexed actor,
        bytes32 actionHash,
        string reason
    );

    constructor() {}

    /**
     * @dev Creates a new RDO with immutable rules.
     * @param _rulesHash Keccak256 hash of the canonical rules JSON.
     * @param _metadataCID IPFS CID of the RDO metadata.
     */
    function createRDO(bytes32 _rulesHash, string memory _metadataCID) external returns (uint256) {
        _currentRdoId++;
        uint256 newId = _currentRdoId;

        rdos[newId] = RDO({
            id: newId,
            creator: _msgSender(),
            rulesHash: _rulesHash,
            metadataCID: _metadataCID,
            createdAt: block.timestamp
        });

        emit RDOCreated(newId, _msgSender(), _rulesHash, _metadataCID);

        return newId;
    }

    /**
     * @dev Requests an action on an RDO.
     *      The contract records the attempt. Verification logic is currently strictly on-chain
     *      enforcing simple flags, or emitting events for off-chain verification agents/clients
     *      to prove the refusal. 
     *      
     *      For the MVP, we assume the client checks the rules. If the client tries to perform
     *      a forbidden action (e.g. forward), the OBJECT (code) should refuse.
     *      However, on-chain refusal needs on-chain knowledge of rules.
     *      
     *      To strictly follow local refusal logic ("Objects that say no"):
     *      The user calls this function. IF the contract determines it is refused, it emits Refused.
     *      Since we store only hash, we pass the rule params to verify?
     *      
     *      Simplified for MVP: The contract blindly emits Allowed or Refused based on 
     *      input flags? No, that's fake.
     *      
     *      REAL MVP IMPLEMENTATION:
     *      We map `rulesHash` to a simplified on-chain config if we want on-chain enforcement.
     *      OR we pass the rules plaintext + proof that hash matches.
     *      Let's go with: Pass the rule components. The contract verifies hash matches stored hash.
     *      Then contract enforces the logic.
     */
    function requestAction(
        uint256 _rdoId,
        string memory _actionType, // "READ", "FORWARD", "COPY"
        bytes memory _contextData, // e.g. target address, timestamp
        // Rule verification params
        uint256 _expiry,
        bool _allowForward
        // In real impl, we'd pass a Merkle proof or the full JSON string if small
        // For MVP, we will require the creator to salt/hash these specific params 
        // to equal the rulesHash? Or just simple hash for MVP.
    ) external {
        RDO memory rdo = rdos[_rdoId];
        require(rdo.id != 0, "RDO does not exist");

        // 1. Verify that the provided rule params match the stored hash
        // For MVP, assume rulesHash = keccak256(abi.encodePacked(_expiry, _allowForward))
        // This is a simplification to allow on-chain enforcement without excessive gas/calldata.
        // In a full version, we'd validte a ZK proof or Merkle proof against the hash.
        bytes32 calculatedHash = keccak256(abi.encodePacked(_expiry, _allowForward));
        
        // If the hash doesn't match, we can't trust the params, so we revert? 
        // Or we treat it as an INVALID request attempt? 
        // Let's revert for "Invalid Proof of Rules". 
        // But for "Refusal", we want the params to be correct but the ACTION to be bad.
        require(calculatedHash == rdo.rulesHash, "Provided rules do not match stored hash");

        bytes32 actionHash = keccak256(abi.encodePacked(_actionType, _contextData));

        // 2. Execute Logic
        bool refused = false;
        string memory refusalReason = "";

        // Rule: Expiry
        if (_expiry > 0 && block.timestamp > _expiry) {
            refused = true;
            refusalReason = "RDO has expired";
        }

        // Rule: Forwarding
        // Use keccak for string comparison
        if (!refused && keccak256(bytes(_actionType)) == keccak256(bytes("FORWARD"))) {
            if (!_allowForward) {
                refused = true;
                refusalReason = "Forwarding is not allowed";
            }
        }

        // 3. Emit Result
        if (refused) {
            emit ActionRefused(_rdoId, _msgSender(), actionHash, refusalReason);
        } else {
            emit ActionAllowed(_rdoId, _msgSender(), actionHash);
        }
    }
}
