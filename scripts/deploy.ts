import { ethers } from "hardhat";

async function main() {
    const currentTimestampInSeconds = Math.round(Date.now() / 1000);
    const unlockTime = currentTimestampInSeconds + 60;

    console.log("Deploying RDORegistry...");

    const RDORegistry = await ethers.getContractFactory("RDORegistry");
    const rdoRegistry = await RDORegistry.deploy();

    await rdoRegistry.waitForDeployment();

    console.log(
        `RDORegistry deployed to ${rdoRegistry.target}`
    );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
