const { ethers } = require("hardhat")


describe("raffle", function () {
    beforeEach(async function () {
        const contract = await ethers.getContractFactory("Raffle", deployer)
        const raffle = await contract.deploy()
        await raffle.deployed()

    })
    it("should ", async function () {
        
    })
})