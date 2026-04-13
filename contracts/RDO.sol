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
            bool        isPaid;
            uint256     pricePerAccess; // wei, required per access action when isPaid=true
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

        /// @dev user address => registered encryption public key (from MetaMask eth_getEncryptionPublicKey)
        mapping(address => string) public encryptionPubKeys;

        /// @dev rdoId => accessor address => encrypted AES key shard
        mapping(uint256 => mapping(address => string)) private _encryptedAESKeys;

        // ── Events ────────────────────────────────────────────
        event RDOCreated(
            uint256 indexed rdoId,
            address indexed creator,
            string  ipfsCid,
            AccessType accessType,
            uint256 maxOpens,
            bool isPaid,
            uint256 pricePerAccess
        );

        event EncryptionKeyRegistered(address indexed user, string pubKey);

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
        * @notice Register a user's MetaMask encryption public key.
        * @param pubKey Base64 encoded x25519 public key.
        */
        function registerEncryptionKey(string calldata pubKey) external {
            require(bytes(pubKey).length > 0, "RDO: empty pubKey");
            encryptionPubKeys[msg.sender] = pubKey;
            emit EncryptionKeyRegistered(msg.sender, pubKey);
        }

        struct CreateRDOParams {
            string ipfsCid;
            AccessType accessType;
            bool allowRead;
            bool allowCopy;
            bool allowDownload;
            bool isPaid;
            uint256 pricePerAccess;
            uint256 maxOpens;
            bool lockOnViolation;
            address[] initialWhitelist;
            string[] encryptedKeys;
            string creatorEncryptedKey;
        }

        /**
        * @notice Mint a new Refusable Digital Object.
        */
        function createRDO(CreateRDOParams calldata params) external returns (uint256 rdoId) {
            require(bytes(params.ipfsCid).length > 0, "RDO: empty CID");
            if (params.isPaid) {
                require(params.pricePerAccess > 0, "RDO: price must be > 0");
            }

            rdoCounter++;
            rdoId = rdoCounter;

            DigitalObject storage rdo = _rdos[rdoId];
            rdo.creator = msg.sender;
            rdo.ipfsCid = params.ipfsCid;
            rdo.accessType = params.accessType;
            rdo.allowRead = params.allowRead;
            rdo.allowCopy = params.allowCopy;
            rdo.allowDownload = params.allowDownload;
            rdo.isPaid = params.isPaid;
            rdo.pricePerAccess = params.isPaid ? params.pricePerAccess : 0;
            rdo.maxOpens = params.maxOpens;
            rdo.openCount = 0;
            rdo.lockOnViolation = params.lockOnViolation;
            rdo.isLocked = false;
            rdo.isRevoked = false;
            rdo.createdAt = block.timestamp;

            if (bytes(params.creatorEncryptedKey).length > 0) {
                _encryptedAESKeys[rdoId][msg.sender] = params.creatorEncryptedKey;
            }

            // Whitelist seed
            if (params.accessType == AccessType.Whitelist) {
                require(params.initialWhitelist.length == params.encryptedKeys.length, "RDO: key count mismatch");
                for (uint256 i = 0; i < params.initialWhitelist.length; i++) {
                    _whitelist[rdoId][params.initialWhitelist[i]] = true;
                    _encryptedAESKeys[rdoId][params.initialWhitelist[i]] = params.encryptedKeys[i];
                }
                // Creator always has access to their own RDO
                _whitelist[rdoId][msg.sender] = true;
            }

            emit RDOCreated(rdoId, msg.sender, params.ipfsCid, params.accessType, params.maxOpens, rdo.isPaid, rdo.pricePerAccess);
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
        ) external payable rdoExists(rdoId) returns (bool allowed, string memory reason) {
            DigitalObject storage rdo = _rdos[rdoId];

            // ── Creator Bypass ──
            if (msg.sender == rdo.creator) {
                // Creator always has unconditional access to their own RDO.
                // Does NOT consume openCount or get blocked by locks/revocations.
                if (msg.value > 0) {
                    emit RDOAccessed(rdoId, msg.sender, action, false, "Creator should not send payment");
                    return (false, "Creator should not send payment");
                }
                emit RDOAccessed(rdoId, msg.sender, action, true, "Creator access bypass");
                return (true, "");
            }

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

            // ── Enforce on-chain payment ──
            if (rdo.isPaid) {
                if (msg.value != rdo.pricePerAccess) {
                    emit RDOAccessed(rdoId, msg.sender, action, false, "Incorrect payment amount");
                    return (false, "Incorrect payment amount");
                }

                (bool sent, ) = payable(rdo.creator).call{value: msg.value}("");
                if (!sent) {
                    emit RDOAccessed(rdoId, msg.sender, action, false, "Payment transfer failed");
                    return (false, "Payment transfer failed");
                }
            } else if (msg.value > 0) {
                emit RDOAccessed(rdoId, msg.sender, action, false, "Payment not required");
                return (false, "Payment not required");
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
        * @notice Add addresses to the whitelist along with their encrypted key shards.
        */
        function addToWhitelist(
            uint256 rdoId,
            address[] calldata addresses,
            string[] calldata encryptedKeys
        ) external rdoExists(rdoId) onlyCreator(rdoId) {
            require(_rdos[rdoId].accessType == AccessType.Whitelist, "RDO: not whitelist-gated");
            require(addresses.length == encryptedKeys.length, "RDO: key count mismatch");
            for (uint256 i = 0; i < addresses.length; i++) {
                _whitelist[rdoId][addresses[i]] = true;
                _encryptedAESKeys[rdoId][addresses[i]] = encryptedKeys[i];
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
        * @notice Get the encrypted AES key shard for a specific user and RDO.
        */
        function getEncryptedKey(uint256 rdoId, address user) external view rdoExists(rdoId) returns (string memory) {
            return _encryptedAESKeys[rdoId][user];
        }

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
            bool    isPaid,
            uint256 pricePerAccess,
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
                rdo.isPaid,
                rdo.pricePerAccess,
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
            bool       isPaid;
            uint256    pricePerAccess;
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
            v.isPaid          = rdo.isPaid;
            v.pricePerAccess  = rdo.pricePerAccess;
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
