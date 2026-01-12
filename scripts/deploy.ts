import { ethers, run } from "hardhat";

async function main() {
    console.log("Deploying RDORegistry...");

    // 1. Deploy
    const RDORegistry = await ethers.getContractFactory("RDORegistry");
    const rdoRegistry = await RDORegistry.deploy();

    await rdoRegistry.waitForDeployment();
    const contractAddress = await rdoRegistry.getAddress();

    console.log(`RDORegistry deployed to ${contractAddress}`);

    // 2. Wait for confirmations (Etherscan needs this)
    if (process.env.ETHERSCAN_API_KEY) {
        console.log("Waiting 6 confirmations for Etherscan verification...");
        // ethers.js v6 syntax: deploymentTransaction()?.wait(6)
        // or manual wait if needed. safest is waiting a few seconds manually or using deployment tx wait.
        const deploymentTx = rdoRegistry.deploymentTransaction();
        if (deploymentTx) {
            await deploymentTx.wait(6);
        }

        // 3. Verify
        console.log("Verifying contract...");
        try {
            await run("verify:verify", {
                address: contractAddress,
                constructorArguments: [],
            });
            console.log("Contract verified successfully!");
        } catch (error: any) {
            if (error.message.toLowerCase().includes("already verified")) {
                console.log("Contract already verified.");
            } else {
                console.error("Verification failed:", error);
            }
        }
    } else {
        console.log("Skipping verification (No ETHERSCAN_API_KEY)");
    }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
