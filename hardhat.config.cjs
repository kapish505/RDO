require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();
require("ts-node").register({
    project: "./tsconfig.hardhat.json",
    files: true,
});

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    solidity: "0.8.20",
    networks: {
        sepolia: {
            url: process.env.SEPOLIA_RPC_URL || "",
            accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
        },
        hardhat: {
            chainId: 1337,
        },
    },
    paths: {
        sources: "./contracts",
        tests: "./test",
        cache: "./cache",
        artifacts: "./artifacts",
    },
    etherscan: {
        apiKey: process.env.ETHERSCAN_API_KEY,
    },
};
