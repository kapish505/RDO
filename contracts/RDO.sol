// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title RDO — Refusable Digital Objects
 * @notice On-chain registry for encrypted digital assets with programmable access rights.
 * @dev Deploy on Sepolia testnet via Remix. After deployment, copy the contract address
 *      into contractAddress.js and paste the ABI into abi.json.
 *
 * ── Flow ──────────────────────────────────────────────────
 *  1. Creator encrypts content off-chain (AES-256-GCM, Web Crypto API)
 *  2. Encrypted payload is pinned to IPFS via Pinata → CID obtained
 *  3. Creator calls createRDO() with the CID + access policy
 *  4. Users call requestAccess() to record an on-chain access event
 *  5. Front-end verifies the event and decrypts content locally
 *  6. Owner can revoke, unlock, or add addresses to the whitelist
 */
contract RDO {

    // ── Enums ─────────────────────────────────────────────
    enum AccessType { Public, Whitelist }

    // ── Structs ───────────────────────────────────────────
    struct DigitalObject {
        address     creator;
        string      ipfsCid;        // CID of encrypted payload on IPFS
        AccessType  accessType;
        bool        allowRead;
        bool        allowCopy;
        bool        allowDownload;
        uint256     maxOpens;       // 0 = unlimited
        uint256     openCount;      // total successful accesses
        bool        lockOnViolation;
        bool        isLocked;       // locked by violation or manually
        bool        isRevoked;      // permanently disabled
        uint256     createdAt;
    }

    // ── Storage ───────────────────────────────────────────
    uint256 public rdoCounter;

    /// @dev rdoId => DigitalObject
    mapping(uint256 => DigitalObject) private _rdos;

    /// @dev rdoId => address => whitelisted
    mapping(uint256 => mapping(address => bool)) private _whitelist;

    // ── Events ────────────────────────────────────────────
    event RDOCreated(
        uint256 indexed rdoId,
        address indexed creator,
        string  ipfsCid,
        AccessType accessType,
        uint256 maxOpens
    );

    event RDOAccessed(
        uint256 indexed rdoId,
        address indexed accessor,
        string  action,     // "read" | "copy" | "download"
        bool    allowed,
        string  reason      // "" if allowed
    );

    event RDORevoked(uint256 indexed rdoId, address indexed revokedBy);
    event RDOLocked(uint256 indexed rdoId, string reason);
    event RDOUnlocked(uint256 indexed rdoId, address indexed unlockedBy);

    event WhitelistUpdated(
        uint256 indexed rdoId,
        address[]       added,
        address[]       removed
    );

    // ── Modifiers ─────────────────────────────────────────
    modifier onlyCreator(uint256 rdoId) {
        require(_rdos[rdoId].creator == msg.sender, "RDO: caller is not the creator");
        _;
    }

    modifier rdoExists(uint256 rdoId) {
        require(rdoId > 0 && rdoId <= rdoCounter, "RDO: does not exist");
        _;
    }

    modifier rdoActive(uint256 rdoId) {
        DigitalObject storage rdo = _rdos[rdoId];
        require(!rdo.isRevoked, "RDO: revoked");
        require(!rdo.isLocked, "RDO: locked");
        _;
    }

    // ─────────────────────────────────────────────────────
    //  WRITE FUNCTIONS
    // ─────────────────────────────────────────────────────

    /**
     * @notice Mint a new Refusable Digital Object.
     * @param ipfsCid        IPFS CID of the encrypted content payload.
     * @param accessType     0 = Public, 1 = Whitelist-only.
     * @param allowRead      Whether READ access is permitted.
     * @param allowCopy      Whether COPY access is permitted.
     * @param allowDownload  Whether DOWNLOAD access is permitted.
     * @param maxOpens       Maximum total allowed accesses (0 = unlimited).
     * @param lockOnViolation Lock the RDO automatically when a rule is violated.
     * @param initialWhitelist Initial list of whitelisted addresses (ignored if Public).
     */
    function createRDO(
        string       calldata ipfsCid,
        AccessType   accessType,
        bool         allowRead,
        bool         allowCopy,
        bool         allowDownload,
        uint256      maxOpens,
        bool         lockOnViolation,
        address[]    calldata initialWhitelist
    ) external returns (uint256 rdoId) {
        require(bytes(ipfsCid).length > 0, "RDO: empty CID");

        rdoCounter++;
        rdoId = rdoCounter;

        _rdos[rdoId] = DigitalObject({
            creator:         msg.sender,
            ipfsCid:         ipfsCid,
            accessType:      accessType,
            allowRead:       allowRead,
            allowCopy:       allowCopy,
            allowDownload:   allowDownload,
            maxOpens:        maxOpens,
            openCount:       0,
            lockOnViolation: lockOnViolation,
            isLocked:        false,
            isRevoked:       false,
            createdAt:       block.timestamp
        });

        // Whitelist seed
        if (accessType == AccessType.Whitelist) {
            for (uint256 i = 0; i < initialWhitelist.length; i++) {
                _whitelist[rdoId][initialWhitelist[i]] = true;
            }
            // Creator always has access to their own RDO
            _whitelist[rdoId][msg.sender] = true;
        }

        emit RDOCreated(rdoId, msg.sender, ipfsCid, accessType, maxOpens);
    }

    /**
     * @notice Record an access request for a given action.
     * @param rdoId  The target RDO identifier.
     * @param action "read" | "copy" | "download"
     * @return allowed  Whether the request was granted.
     * @return reason   Denial reason if not allowed.
     */
    function requestAccess(
        uint256 rdoId,
        string calldata action
    ) external rdoExists(rdoId) returns (bool allowed, string memory reason) {
        DigitalObject storage rdo = _rdos[rdoId];

        // ── Check revocation / lock ──
        if (rdo.isRevoked) {
            emit RDOAccessed(rdoId, msg.sender, action, false, "RDO revoked");
            return (false, "RDO revoked");
        }
        if (rdo.isLocked) {
            emit RDOAccessed(rdoId, msg.sender, action, false, "RDO locked");
            return (false, "RDO locked");
        }

        // ── Check max opens ──
        if (rdo.maxOpens > 0 && rdo.openCount >= rdo.maxOpens) {
            if (rdo.lockOnViolation) {
                rdo.isLocked = true;
                emit RDOLocked(rdoId, "Max opens exceeded");
            }
            emit RDOAccessed(rdoId, msg.sender, action, false, "Max opens reached");
            return (false, "Max opens reached");
        }

        // ── Check whitelist ──
        if (rdo.accessType == AccessType.Whitelist) {
            if (!_whitelist[rdoId][msg.sender]) {
                emit RDOAccessed(rdoId, msg.sender, action, false, "Not whitelisted");
                return (false, "Not whitelisted");
            }
        }

        // ── Check permission for specific action ──
        bytes32 actionHash = keccak256(bytes(action));
        if (actionHash == keccak256("read") && !rdo.allowRead) {
            _handleViolation(rdoId, action, "Read not permitted");
            return (false, "Read not permitted");
        }
        if (actionHash == keccak256("copy") && !rdo.allowCopy) {
            _handleViolation(rdoId, action, "Copy not permitted");
            return (false, "Copy not permitted");
        }
        if (actionHash == keccak256("download") && !rdo.allowDownload) {
            _handleViolation(rdoId, action, "Download not permitted");
            return (false, "Download not permitted");
        }

        // ── Grant access ──
        rdo.openCount++;
        emit RDOAccessed(rdoId, msg.sender, action, true, "");
        return (true, "");
    }

    /**
     * @notice Permanently revoke an RDO. Only the creator can call this.
     */
    function revokeRDO(uint256 rdoId) external rdoExists(rdoId) onlyCreator(rdoId) {
        require(!_rdos[rdoId].isRevoked, "RDO: already revoked");
        _rdos[rdoId].isRevoked = true;
        emit RDORevoked(rdoId, msg.sender);
    }

    /**
     * @notice Unlock a previously locked RDO. Only the creator can call this.
     */
    function unlockRDO(uint256 rdoId) external rdoExists(rdoId) onlyCreator(rdoId) {
        require(_rdos[rdoId].isLocked, "RDO: not locked");
        _rdos[rdoId].isLocked = false;
        emit RDOUnlocked(rdoId, msg.sender);
    }

    /**
     * @notice Add addresses to the whitelist. Only the creator can call this.
     */
    function addToWhitelist(
        uint256 rdoId,
        address[] calldata addresses
    ) external rdoExists(rdoId) onlyCreator(rdoId) {
        require(_rdos[rdoId].accessType == AccessType.Whitelist, "RDO: not whitelist-gated");
        for (uint256 i = 0; i < addresses.length; i++) {
            _whitelist[rdoId][addresses[i]] = true;
        }
        emit WhitelistUpdated(rdoId, addresses, new address[](0));
    }

    /**
     * @notice Remove addresses from the whitelist. Only the creator can call this.
     */
    function removeFromWhitelist(
        uint256 rdoId,
        address[] calldata addresses
    ) external rdoExists(rdoId) onlyCreator(rdoId) {
        for (uint256 i = 0; i < addresses.length; i++) {
            _whitelist[rdoId][addresses[i]] = false;
        }
        emit WhitelistUpdated(rdoId, new address[](0), addresses);
    }

    // ─────────────────────────────────────────────────────
    //  READ FUNCTIONS
    // ─────────────────────────────────────────────────────

    /**
     * @notice Core identity + content fields for an RDO.
     *         Split from getRDOPolicy to avoid "stack too deep".
     */
    function getRDOMeta(uint256 rdoId) external view rdoExists(rdoId) returns (
        address    creator,
        string     memory ipfsCid,
        AccessType accessType,
        uint256    createdAt
    ) {
        DigitalObject storage rdo = _rdos[rdoId];
        return (rdo.creator, rdo.ipfsCid, rdo.accessType, rdo.createdAt);
    }

    /**
     * @notice Access-control + lifecycle fields for an RDO.
     *         Split from getRDOMeta to avoid "stack too deep".
     */
    function getRDOPolicy(uint256 rdoId) external view rdoExists(rdoId) returns (
        bool    allowRead,
        bool    allowCopy,
        bool    allowDownload,
        uint256 maxOpens,
        uint256 openCount,
        bool    lockOnViolation,
        bool    isLocked,
        bool    isRevoked
    ) {
        DigitalObject storage rdo = _rdos[rdoId];
        return (
            rdo.allowRead,
            rdo.allowCopy,
            rdo.allowDownload,
            rdo.maxOpens,
            rdo.openCount,
            rdo.lockOnViolation,
            rdo.isLocked,
            rdo.isRevoked
        );
    }

    /**
     * @notice Convenience struct so JS can call a single function and
     *         destructure everything via ethers.js.
     *         Returns all 12 fields without hitting the stack limit because
     *         the struct is ABI-encoded as a single tuple (one stack slot).
     */
    struct RDOView {
        address    creator;
        string     ipfsCid;
        AccessType accessType;
        bool       allowRead;
        bool       allowCopy;
        bool       allowDownload;
        uint256    maxOpens;
        uint256    openCount;
        bool       lockOnViolation;
        bool       isLocked;
        bool       isRevoked;
        uint256    createdAt;
    }

    function getRDO(uint256 rdoId) external view rdoExists(rdoId) returns (RDOView memory v) {
        DigitalObject storage rdo = _rdos[rdoId];
        v.creator         = rdo.creator;
        v.ipfsCid         = rdo.ipfsCid;
        v.accessType      = rdo.accessType;
        v.allowRead       = rdo.allowRead;
        v.allowCopy       = rdo.allowCopy;
        v.allowDownload   = rdo.allowDownload;
        v.maxOpens        = rdo.maxOpens;
        v.openCount       = rdo.openCount;
        v.lockOnViolation = rdo.lockOnViolation;
        v.isLocked        = rdo.isLocked;
        v.isRevoked       = rdo.isRevoked;
        v.createdAt       = rdo.createdAt;
    }

    /**
     * @notice Check whether a specific address is whitelisted for an RDO.
     */
    function isWhitelisted(uint256 rdoId, address user) external view rdoExists(rdoId) returns (bool) {
        return _whitelist[rdoId][user];
    }

    /**
     * @notice Returns true if the RDO is active (not locked, not revoked, opens not exhausted).
     */
    function isActive(uint256 rdoId) external view rdoExists(rdoId) returns (bool) {
        DigitalObject storage rdo = _rdos[rdoId];
        if (rdo.isRevoked || rdo.isLocked) return false;
        if (rdo.maxOpens > 0 && rdo.openCount >= rdo.maxOpens) return false;
        return true;
    }

    // ─────────────────────────────────────────────────────
    //  INTERNAL
    // ─────────────────────────────────────────────────────

    function _handleViolation(
        uint256 rdoId,
        string calldata action,
        string memory reason
    ) internal {
        DigitalObject storage rdo = _rdos[rdoId];
        if (rdo.lockOnViolation) {
            rdo.isLocked = true;
            emit RDOLocked(rdoId, reason);
        }
        emit RDOAccessed(rdoId, msg.sender, action, false, reason);
    }
}
