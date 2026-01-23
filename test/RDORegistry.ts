import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import "@nomicfoundation/hardhat-chai-matchers";
import { expect } from "chai";
import { ethers } from "hardhat";

console.log("Loading RDORegistry test file...");

describe("RDORegistry", function () {
    async function deployFixture() {
        const [owner, otherAccount] = await ethers.getSigners();
        const RDORegistry = await ethers.getContractFactory("RDORegistry");
        const rdoRegistry = await RDORegistry.deploy();
        return { rdoRegistry, owner, otherAccount };
    }

    // Enum Mappings
    const RDOType = { MESSAGE: 0, FILE: 1, LINK: 2, PERMISSION: 3 };
    const ActionType = { READ: 0, FORWARD: 1, COPY: 2, DOWNLOAD: 3, EXECUTE: 4 };

    // Helper to create valid rules struct
    const createRules = (overrides = {}) => ({
        forbidCopy: false,
        forbidForward: false,
        forbidExport: false,
        expiry: 0,
        accessType: 0,
        maxUses: 0,
        lockOnViolation: false,
        requireIdentity: false,
        ...overrides
    });

    describe("Core Logic", function () {
        it("Should create an RDO and emit event", async function () {
            const { rdoRegistry, owner } = await loadFixture(deployFixture);

            const rules = createRules({ expiry: Math.floor(Date.now() / 1000) + 3600 });
            const rulesHash = ethers.keccak256(ethers.toUtf8Bytes("canonical-json-mock"));
            const metadataCID = "QmTest";
            const whitelist: string[] = [];

            await expect((rdoRegistry as any).createRDO(rulesHash, RDOType.MESSAGE, rules, metadataCID, whitelist))
                .to.emit(rdoRegistry, "RDOCreated")
                .withArgs(1, owner.address, RDOType.MESSAGE, rulesHash, metadataCID);
        });

        it("Should allow permissible action", async function () {
            const { rdoRegistry } = await loadFixture(deployFixture);

            const rules = createRules({ forbidForward: false });
            const rulesHash = ethers.keccak256(ethers.toUtf8Bytes("mock"));
            await (rdoRegistry as any).createRDO(rulesHash, RDOType.MESSAGE, rules, "QmTest", []);

            // Request Forward (Allowed)
            // ActionType.FORWARD = 1
            const context = "0x";
            const actionHash = ethers.solidityPackedKeccak256(["uint8", "bytes"], [1, context]);

            await expect((rdoRegistry as any).requestAction(1, 1, context))
                .to.emit(rdoRegistry, "ActionAllowed")
                .withArgs(1, await (await ethers.getSigners())[0].getAddress(), 1, actionHash);
        });

        it("Should refuse forbidden action (Refusal Proof)", async function () {
            const { rdoRegistry, owner } = await loadFixture(deployFixture);

            // Create RDO that Forbids Forwarding
            const rules = createRules({ forbidForward: true });
            const rulesHash = ethers.keccak256(ethers.toUtf8Bytes("mock"));

            await (rdoRegistry as any).createRDO(rulesHash, RDOType.MESSAGE, rules, "QmTest", []);

            // Request Forward
            const context = "0x";
            // Action hash calculation in contract: keccak256(abi.encodePacked(_actionType, _contextData))
            // Solidity: abi.encodePacked(uint8, bytes)
            const actionHash = ethers.solidityPackedKeccak256(["uint8", "bytes"], [1, context]);

            await expect((rdoRegistry as any).requestAction(1, 1, context))
                .to.emit(rdoRegistry, "ActionRefused")
                .withArgs(1, owner.address, 1, rulesHash, "Forwarding forbidden");
        });

        it("Should refuse expired RDO", async function () {
            const { rdoRegistry, owner } = await loadFixture(deployFixture);

            // Create Expired RDO
            const expiredTimestamp = Math.floor(Date.now() / 1000) - 100;
            const rules = createRules({ expiry: expiredTimestamp });
            const rulesHash = ethers.keccak256(ethers.toUtf8Bytes("mock"));

            await (rdoRegistry as any).createRDO(rulesHash, RDOType.MESSAGE, rules, "QmTest", []);

            const context = "0x";
            // READ = 0
            const actionHash = ethers.solidityPackedKeccak256(["uint8", "bytes"], [0, context]);

            await expect((rdoRegistry as any).requestAction(1, 0, context))
                .to.emit(rdoRegistry, "ActionRefused")
                .withArgs(1, owner.address, 0, rulesHash, "RDO has expired");
        });

        it("Should lock on violation if configured", async function () {
            const { rdoRegistry, owner } = await loadFixture(deployFixture);

            // Create Lock-on-Violation RDO
            const rules = createRules({ forbidCopy: true, lockOnViolation: true });
            const rulesHash = ethers.keccak256(ethers.toUtf8Bytes("mock"));

            await (rdoRegistry as any).createRDO(rulesHash, RDOType.FILE, rules, "QmTest", []);

            const context = "0x";
            // COPY = 2

            // First Attempt: Refused + Locked
            await expect((rdoRegistry as any).requestAction(1, 2, context))
                .to.emit(rdoRegistry, "ActionRefused")
                .withArgs(1, owner.address, 2, rulesHash, "Copying forbidden (Object Locked)");

            // Second Attempt (Valid Action like READ): Still Refused because Locked
            await expect((rdoRegistry as any).requestAction(1, 0, context))
                .to.emit(rdoRegistry, "ActionRefused")
                .withArgs(1, owner.address, 0, rulesHash, "OBJECT_LOCKED");
        });

        it("Should enforce Whitelist Access", async function () {
            const { rdoRegistry, owner, otherAccount } = await loadFixture(deployFixture);

            // Create RDO with LIST access (4)
            const rules = createRules({ accessType: 4 });
            const rulesHash = ethers.keccak256(ethers.toUtf8Bytes("mock-whitelist"));

            // Allow otherAccount. NOT owner (unless explicitly added).
            await (rdoRegistry as any).createRDO(rulesHash, RDOType.MESSAGE, rules, "QmTest", [otherAccount.address]);

            const context = "0x";
            const actionHash = ethers.solidityPackedKeccak256(["uint8", "bytes"], [0, context]); // READ

            // 1. Owner attempts access (NOT in whitelist) -> FAIL
            await expect((rdoRegistry as any).requestAction(1, 0, context))
                .to.emit(rdoRegistry, "ActionRefused")
                .withArgs(1, owner.address, 0, rulesHash, "Access denied (Not in whitelist)");

            // 2. otherAccount (Whitelisted) attempts access -> ALLOW
            await expect((rdoRegistry.connect(otherAccount) as any).requestAction(1, 0, context))
                .to.emit(rdoRegistry, "ActionAllowed")
                .withArgs(1, otherAccount.address, 0, actionHash);
        });
    });
});

