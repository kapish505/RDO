// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/Context.sol";

/**
 * @title RDORegistry
 * @dev The core registry for Refusable Digital Objects.
 *      Enforces immutable rules and emits refusal proofs.
 */
contract RDORegistry is Context {
    
    // Enums
    enum RDOType { MESSAGE, FILE, LINK, PERMISSION }

    // Compact Rules Struct (Gas Optimized)
    struct Rules {
        bool forbidCopy;
        bool forbidForward;
        bool forbidExport;
        uint64 expiry; // unix ts, 0 = never
        uint8 accessType; // 0=ANY, 1=LINK, 2=CREATOR, 3=SINGLE, 4=LIST
        uint256 maxUses; // 0 = unlimited
        bool lockOnViolation;
        bool requireIdentity;
    }

    // Core definition of an RDO
    struct RDO {
        uint256 id;
        address creator;
        RDOType rdoType;
        bytes32 rulesHash;      // Immutable hash of the rules JSON
        Rules rules;            // Compact enforceable rules
        string metadataCID;     // IPFS CID for metadata (name, desc, etc.)
        uint256 createdAt;
        bool locked;            // Locked state if lockOnViolation triggered
    }

    // Counter for RDO IDs
    uint256 private _currentRdoId;

    // Mapping from ID to RDO
    mapping(uint256 => RDO) public rdos;

    // Events
    event RDOCreated(
        uint256 indexed rdoId,
        address indexed creator,
        RDOType rdoType,
        bytes32 rulesHash,
        string metadataCID
    );

    event ActionAllowed(
        uint256 indexed rdoId,
        address indexed actor,
        uint8 actionType,
        bytes32 actionHash
    );

    event ActionRefused(
        uint256 indexed rdoId,
        address indexed actor,
        uint8 actionType,
        bytes32 violatedRuleHash,
        string reason
    );

    constructor() {}

    /**
     * @dev Creates a new RDO with immutable rules.
     */
    function createRDO(
        bytes32 _rulesHash, 
        RDOType _rdoType,
        Rules calldata _rulesCompact,
        string memory _metadataCID
    ) external returns (uint256) {
        _currentRdoId++;
        uint256 newId = _currentRdoId;

        rdos[newId] = RDO({
            id: newId,
            creator: _msgSender(),
            rdoType: _rdoType,
            rulesHash: _rulesHash,
            rules: _rulesCompact,
            metadataCID: _metadataCID,
            createdAt: block.timestamp,
            locked: false
        });

        emit RDOCreated(newId, _msgSender(), _rdoType, _rulesHash, _metadataCID);

        return newId;
    }

    /**
     * @dev Requests an action on an RDO.
     */
    function requestAction(
        uint256 _rdoId,
        uint8 _actionType, // 0=READ, 1=FORWARD...
        bytes calldata _contextData
    ) external returns (bool) {
        RDO storage rdo = rdos[_rdoId];
        require(rdo.id != 0, "RDO does not exist");

        // 1. Check Locked State
        if (rdo.locked) {
            emit ActionRefused(_rdoId, _msgSender(), _actionType, rdo.rulesHash, "RDO is permanently locked");
            return false;
        }

        // 2. Check Expiry
        if (rdo.rules.expiry > 0 && block.timestamp > rdo.rules.expiry) {
             emit ActionRefused(_rdoId, _msgSender(), _actionType, rdo.rulesHash, "RDO has expired");
             return false;
        }

        bool refused = false;
        string memory refusalReason = "";

        // 3. Check Forbidden Flag
        // ActionType: READ=0, FORWARD=1, COPY=2, DOWNLOAD=3, EXECUTE=4
        if (_actionType == 1 && rdo.rules.forbidForward) { // FORWARD
            refused = true;
            refusalReason = "Forwarding forbidden";
        } else if (_actionType == 2 && rdo.rules.forbidCopy) { // COPY
            refused = true;
            refusalReason = "Copying forbidden";
        } else if (_actionType == 3 && rdo.rules.forbidExport) { // EXPORT/DOWNLOAD
            refused = true;
            refusalReason = "Export forbidden";
        }

        // 4. Emit Result & Enforce Lock
        bytes32 actionHash = keccak256(abi.encodePacked(_actionType, _contextData));

        if (refused) {
            if (rdo.rules.lockOnViolation) {
                rdo.locked = true;
                refusalReason = string(abi.encodePacked(refusalReason, " (Object Locked)"));
            }
            emit ActionRefused(_rdoId, _msgSender(), _actionType, rdo.rulesHash, refusalReason);
            return false;
        } else {
            // Success Logic
             if (rdo.rules.maxUses > 0) {
                 if (rdo.rules.maxUses == 1) {
                     // Last use used up
                     rdo.rules.maxUses--; 
                 } else {
                     rdo.rules.maxUses--;
                 }
            }
            emit ActionAllowed(_rdoId, _msgSender(), _actionType, actionHash);
            return true;
        }
    }
}
