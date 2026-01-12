import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("RDORegistry", function () {
    async function deployFixture() {
        const [owner, otherAccount] = await ethers.getSigners();
        const RDORegistry = await ethers.getContractFactory("RDORegistry");
        const rdoRegistry = await RDORegistry.deploy();
        return { rdoRegistry, owner, otherAccount };
    }

    describe("Core Logic", function () {
        it("Should create an RDO and emit event", async function () {
            const { rdoRegistry, owner } = await loadFixture(deployFixture);

            const expiry = Math.floor(Date.now() / 1000) + 3600; // 1 hour later
            const allowForward = false;
            const rulesHash = ethers.solidityPackedKeccak256(["uint256", "bool"], [expiry, allowForward]);
            const metadataCID = "QmTest";

            await expect(rdoRegistry.createRDO(rulesHash, metadataCID))
                .to.emit(rdoRegistry, "RDOCreated")
                .withArgs(1, owner.address, rulesHash, metadataCID);
        });

        it("Should allow permissible action", async function () {
            const { rdoRegistry, owner } = await loadFixture(deployFixture);

            // Create RDO: Allow forward = true
            const expiry = Math.floor(Date.now() / 1000) + 3600;
            const allowForward = true;
            const rulesHash = ethers.solidityPackedKeccak256(["uint256", "bool"], [expiry, allowForward]);
            await rdoRegistry.createRDO(rulesHash, "QmTest");

            // Request Forward
            const actionType = "FORWARD";
            const contextData = "0x";
            // Expect ActionAllowed
            await expect(rdoRegistry.requestAction(1, actionType, contextData, expiry, allowForward))
                .to.emit(rdoRegistry, "ActionAllowed");
        });

        it("Should refuse forbidden action (Refusal Proof)", async function () {
            const { rdoRegistry, owner } = await loadFixture(deployFixture);

            // Create RDO: Allow forward = MFALSE
            const expiry = Math.floor(Date.now() / 1000) + 3600;
            const allowForward = false;
            const rulesHash = ethers.solidityPackedKeccak256(["uint256", "bool"], [expiry, allowForward]);
            await rdoRegistry.createRDO(rulesHash, "QmTest");

            // Request Forward
            const actionType = "FORWARD";
            const contextData = "0x";

            // Expect Refusal
            // We need to calculate the actionHash for the expect
            const actionHash = ethers.solidityPackedKeccak256(["string", "bytes"], [actionType, contextData]);

            await expect(rdoRegistry.requestAction(1, actionType, contextData, expiry, allowForward))
                .to.emit(rdoRegistry, "ActionRefused")
                .withArgs(1, owner.address, actionHash, "Forwarding is not allowed");
        });

        it("Should refuse expired RDO", async function () {
            const { rdoRegistry, owner } = await loadFixture(deployFixture);

            // Create RDO: Expired 1 second ago
            const expiry = Math.floor(Date.now() / 1000) - 1;
            const allowForward = true;
            const rulesHash = ethers.solidityPackedKeccak256(["uint256", "bool"], [expiry, allowForward]);
            await rdoRegistry.createRDO(rulesHash, "QmTest");

            const actionType = "READ";
            const contextData = "0x";
            const actionHash = ethers.solidityPackedKeccak256(["string", "bytes"], [actionType, contextData]);

            await expect(rdoRegistry.requestAction(1, actionType, contextData, expiry, allowForward))
                .to.emit(rdoRegistry, "ActionRefused")
                .withArgs(1, owner.address, actionHash, "RDO has expired");
        });

        it("Should revert if rules provided do not match hash", async function () {
            const { rdoRegistry } = await loadFixture(deployFixture);

            const expiry = Math.floor(Date.now() / 1000) + 3600;
            const allowForward = false;
            const rulesHash = ethers.solidityPackedKeccak256(["uint256", "bool"], [expiry, allowForward]);
            await rdoRegistry.createRDO(rulesHash, "QmTest");

            // Pass wrong expiry
            await expect(rdoRegistry.requestAction(1, "READ", "0x", expiry + 1, allowForward))
                .to.be.revertedWith("Provided rules do not match stored hash");
        });
    });
});
