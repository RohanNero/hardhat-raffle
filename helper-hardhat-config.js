const { network } = require("hardhat")

const developmentChains = ["localhost", "hardhat"]
const networkConfig = {
    default: {
        name: "hardhat",
        keepersUpdateInterval: "30",
        subscriptionId: "777",
    },
    31337: {
        name: "localhost",
        subscriptionId: "777",
        gasLane:
            "0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc", // 30 gwei
        keepersUpdateInterval: "30",
        raffleEntranceFee: "100000000000000000", // 0.1 ETH
        callbackGasLimit: "500000", // 500,000 gas
    },
    // 4: {
    //     name: "rinkeby",
    //     subscriptionId: "9764",
    //     gasLane:
    //         "0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc", // 30 gwei
    //     keepersUpdateInterval: "30",
    //     raffleEntranceFee: "100000000000000000", // 0.1 ETH
    //     callbackGasLimit: "500000", // 500,000 gas
    //     vrfCoordinatorV2: "0x6168499c0cFfCaCD319c818142124B7A15E857ab",
    // },
    5: {
        name: "goerli",
        subscriptionId: "9764",
        gasLane:
            "0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15", // 30 gwei
        keepersUpdateInterval: "30",
        raffleEntranceFee: "100000000000000000", // 0.1 ETH
        callbackGasLimit: "500000", // 500,000 gas
        vrfCoordinatorV2: "0x2Ca8E0C643bDe4C2E08ab1fA0da3401AdAD7734D",
    },
    1: {
        name: "mainnet",
        keepersUpdateInterval: "30",
    },
}
module.exports = {
    developmentChains,
    networkConfig,
}
