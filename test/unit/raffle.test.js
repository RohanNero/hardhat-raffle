const { assert, expect } = require("chai")
const { ethers, getNamedAccounts, deployments, network } = require("hardhat")
const {
    developmentChains,
    networkConfig,
} = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Raffle", function () {
          let raffle,
              vrfCoordinatorV2Mock,
              raffleEntranceFee,
              interval,
              deployer,
              player

          beforeEach(async function () {
              ;[deployer, player] = await ethers.getSigners()
              await deployments.fixture(["all"])
              raffle = await ethers.getContract("Raffle", deployer)
              vrfCoordinatorV2Mock = await ethers.getContract(
                  "VRFCoordinatorV2Mock",
                  deployer
              )
              raffleEntranceFee = await raffle.getEntranceFee()
              interval = await raffle.getInterval()
              // console.log(raffle)
              //   console.log(`Raffle: ${raffle.address}`)
              //   console.log(`VRF Mock: ${vrfCoordinatorV2Mock.address} `)
          })
          describe("Constructor", function () {
              // Ideally we make our tests have 1 assert per "it"

              it("Should set the VRFCoordinatorV2 address", async function () {
                  const VRFCoordinatorV2Address =
                      await raffle.getVRFCoordinatorV2Address()
                  assert.equal(
                      VRFCoordinatorV2Address,
                      vrfCoordinatorV2Mock.address
                  )
              })
              it("Should set the gasLane", async function () {
                  const gasLane = await raffle.getGasLane()
                  const expectedValue = networkConfig[31337].gasLane
                  assert.equal(gasLane, expectedValue)
              })
              it("Should set the interval", async function () {
                  const interval = await raffle.getInterval()
                  const expectedValue =
                      networkConfig[31337].keepersUpdateInterval
                  assert.equal(interval.toString(), expectedValue)
              })
              it("Should set the subscriptionId", async function () {
                  const subscriptionId = await raffle.getSubscriptionId()
                  assert.equal(subscriptionId.toString(), 1)
              })
              it("Should set the entrance fee", async function () {
                  const entranceFee = await raffle.getEntranceFee()
                  const expectedValue = networkConfig[31337].raffleEntranceFee
                  assert.equal(entranceFee, expectedValue)
              })
              it("Should set the RaffleState", async function () {
                  const raffleState = await raffle.getRaffleState()
                  assert.equal(raffleState, 0)
              })
              it("Should set the timestamp", async function () {
                  // Solidity timestamp
                  const timeStamp = await raffle.getLastTimeStamp()
                  const timeStampStr = timeStamp.toString()
                  const roundedTimeStamp = timeStampStr.slice(0, -2)
                  // Javascript timestamp
                  const testTx = Date.now()
                  const testTxStr = testTx.toString()
                  const timeStampJS = testTxStr.slice(0, -5)
                  // Sliced a few digits off due to slight variation in the timestamps
                  assert.equal(roundedTimeStamp, timeStampJS)
              })
              it("Should set the callbackGasLimit", async function () {
                  const callbackGasLimit = await raffle.getCallbackGasLimit()
                  const expectedValue = networkConfig[31337].callbackGasLimit
                  assert.equal(callbackGasLimit, expectedValue)
              })
          })
          describe("enterRaffle", function () {
              //   beforeEach(async function () {
              //       await raffle.enterRaffle({ value: "110000000000000000" })
              //   })
              it("should revert if user doesn't send enough ETH", async function () {
                  await expect(raffle.enterRaffle()).to.be.revertedWith(
                      "Raffle__SendMoreToEnterRaffle"
                  )
              })
              it("should revert if raffleState is not 'Open'", async function () {
                  await raffle.enterRaffle({ value: raffleEntranceFee })
                  // for a documentation of the methods below, go here: https://hardhat.org/hardhat-network/reference
                  await network.provider.send("evm_increaseTime", [
                      interval.toNumber() + 1,
                  ])
                  await network.provider.request({
                      method: "evm_mine",
                      params: [],
                  })
                  // we pretend to be a keeper for a second
                  await raffle.performUpkeep([]) // changes the state to calculating for our comparison below
                  await expect(
                      raffle.enterRaffle({ value: raffleEntranceFee })
                  ).to.be.revertedWith(
                      // is reverted as raffle is calculating
                      "Raffle__RaffleNotOpen"
                  )
              })
              it("should add users to the s_players array", async function () {
                  await raffle.enterRaffle({ value: raffleEntranceFee })
                  const address = await raffle.getPlayer(0)
                  assert.equal(deployer.address, address)
              })
              it("should emit the RaffleEnter Event", async function () {
                  await expect(raffle.enterRaffle({ value: raffleEntranceFee }))
                      .to.emit(raffle, "RaffleEnter")
                      .withArgs(deployer.address)
              })
          })
          describe("checkUpkeep", function () {
              it("should return false if the RaffleState is not 'Open'", async function () {
                  await raffle.enterRaffle({ value: raffleEntranceFee })
                  network.provider.send("evm_increaseTime", [
                      interval.toNumber() + 1,
                  ])
                  network.provider.send("evm_mine")
                  await raffle.performUpkeep([])
                  //const tx = await raffle.checkUpkeep("0x")
                  const expectedValue = "false, 0x0"
                  const raffleState = await raffle.getRaffleState()
                  const { upkeepNeeded } = await raffle.checkUpkeep("0x")
                  assert.equal(raffleState == 1, upkeepNeeded == false)
              })
              it("should return false if not enough time has passed", async function () {
                  await raffle.enterRaffle({ value: raffleEntranceFee })
                  const { upkeepNeeded } = await raffle.callStatic.checkUpkeep(
                      "0x"
                  )
                  assert(!upkeepNeeded)
              })
              it("should return false if s_players array is empty & no ETH has been sent", async function () {
                  network.provider.send("evm_increaseTime", [
                      interval.toNumber() + 1,
                  ])
                  network.provider.send("evm_mine")
                  const { upkeepNeeded } = await raffle.checkUpkeep("0x")
                  assert(!upkeepNeeded)
              })
              it("should return true if enough time has passed, raffleState = 'Open', && players have entered Raffle", async function () {
                  await raffle.enterRaffle({ value: raffleEntranceFee })
                  network.provider.send("evm_increaseTime", [
                      interval.toNumber() + 1,
                  ])
                  network.provider.send("evm_mine")
                  const { upkeepNeeded } = await raffle.checkUpkeep("0x")
                  //   assert.equal(upkeepNeeded, true)
                  assert(upkeepNeeded)
              })
          })
          describe("performUpkeep", function () {
              it("should revert if upkeepNeeded == false", async function () {
                  await expect(raffle.performUpkeep([])).to.be.revertedWith(
                      "Raffle__UpkeepNotNeeded"
                  )
              })
              it("should set the RaffleState to 'Calculating'", async function () {
                  await raffle.enterRaffle({ value: raffleEntranceFee })
                  network.provider.send("evm_increaseTime", [
                      interval.toNumber() + 1,
                  ])
                  network.provider.send("evm_mine")
                  await raffle.performUpkeep([])
                  const raffleState = await raffle.getRaffleState()
                  assert.equal(raffleState, 1)
              })
              it("should emit the requestId", async function () {
                  await raffle.enterRaffle({ value: raffleEntranceFee })
                  network.provider.send("evm_increaseTime", [
                      interval.toNumber() + 1,
                  ])
                  network.provider.send("evm_mine")

                  await expect(raffle.performUpkeep([]))
                      .to.emit(raffle, "RequestedRaffleWinner")
                      .withArgs(1)

                  // Another way of getting the emitted requestId
                  // const txResponse = await raffle.performUpkeep([])
                  // const txReceipt = await txResponse.wait(1)
                  // const requestId = txReceipt.events[1].args.requestId
                  // const raffleState = await raffle.getRaffleState()
                  // assert(requestId.toNumber() > 0)
                  // assert(raffleState.toString() == "1")
              })
          })
          describe("fulfillRandomWords", function () {
              beforeEach(async function () {
                  await raffle.enterRaffle({ value: raffleEntranceFee })
                  network.provider.send("evm_increaseTime", [
                      interval.toNumber() + 1,
                  ])
                  network.provider.send("evm_mine")
              })
              it("should revert if performUpkeep hasn't been called", async function () {
                  await expect(
                      vrfCoordinatorV2Mock.fulfillRandomWords(0, raffle.address)
                  ).to.be.revertedWith("nonexistent request")
              })
              it("should pick the winner", async function () {
                  const txResponse = await raffle.performUpkeep([])
                  const vrfTx = await vrfCoordinatorV2Mock.fulfillRandomWords(
                      1,
                      raffle.address
                  )
                  const winner = await raffle.getRecentWinner()
                  assert.equal(winner, deployer.address)
              })
              it("should reset the lottery array", async function () {
                  await raffle.performUpkeep([])
                  const vrfTx = await vrfCoordinatorV2Mock.fulfillRandomWords(
                      1,
                      raffle.address
                  )
                  const players = await raffle.getNumberOfPlayers()
                  assert.equal(players.toString(), "0")
              })
              it("should set the RaffleState to 'Open'", async function () {
                  await raffle.performUpkeep([])
                  await vrfCoordinatorV2Mock.fulfillRandomWords(
                      1,
                      raffle.address
                  )
                  const raffleState = await raffle.getRaffleState()
                  assert.equal(raffleState.toString(), "0")
              })
              it("should set a new s_lastTimeStamp", async function () {
                  const initialTimeStamp = await raffle.getLastTimeStamp()
                  await raffle.performUpkeep([])
                  await vrfCoordinatorV2Mock.fulfillRandomWords(
                      1,
                      raffle.address
                  )
                  const newTimeStamp = await raffle.getLastTimeStamp()
                  assert(newTimeStamp > initialTimeStamp + interval)
              })
              it("should send the funds to the winner", async function () {
                  const initialBalance = await raffle.getContractBalance()
                  await raffle.performUpkeep([])
                  await vrfCoordinatorV2Mock.fulfillRandomWords(
                      1,
                      raffle.address
                  )
                  const finalBalance = await raffle.getContractBalance()
                  assert.equal(
                      finalBalance.toString(),
                      (initialBalance - raffleEntranceFee).toString()
                  )
              })
              it("should emit the winner's address", async function () {
                  await raffle.performUpkeep([])
                  await expect(
                      vrfCoordinatorV2Mock.fulfillRandomWords(1, raffle.address)
                  )
                      .to.emit(raffle, "WinnerPicked")
                      .withArgs(deployer.address)
              })
          })
          describe("additional view/pure functions", function () {
              it("should return the NUM_WORDS variable", async function () {
                  const numWords = await raffle.getNumWords()
                  assert(numWords == 1)
              })
              it("should return the REQUEST_CONFIRMATIONS variable", async function () {
                  const request = await raffle.getRequestConfirmations()
                  assert(request == 3)
              })
          })
        //   describe.only("TestHelper for 100% coverage", function () {
        //       it("should revert if funds aren't transfered to winner", async function () {
        //           const contractFactory = await ethers.getContractFactory(
        //               "TestHelper",
        //               deployer
        //           )
        //           //console.log(raffle.address)
        //           const contract = await contractFactory.deploy(raffle.address)
        //           await contract.deployed()
        //           //console.log(contract.address)
        //           const tx = await contract.enterRaffle({
        //               value: raffleEntranceFee,
        //           })
        //           const player = await raffle.getPlayer(0)
        //           console.log(player)
        //           network.provider.send("evm_increaseTime", [
        //               interval.toNumber() + 1,
        //           ])
        //           network.provider.send("evm_mine")
        //           const txResponse = await raffle.performUpkeep([])
        //         //   const txReceipt = await txResponse.wait(1)
        //         //   const requestId = txReceipt.events[1].args.requestId
        //         //   const players = await raffle.getNumberOfPlayers()
        //         //   console.log(players.toString())
        //           console.log(await raffle.getPlayer(0))
        //           console.log(await raffle.getContractBalance())
        //           const transactionResponse =
        //               await vrfCoordinatorV2Mock.fulfillRandomWords(
        //                   1,
        //                   raffle.address
        //               )
        //           const transactionReceipt = await transactionResponse.wait(1)
        //           console.log(await raffle.getContractBalance())
        //         //   console.log(winnerAddr)
        //           //console.log(transactionResponse)
        //           const winner = await raffle.getRecentWinner()
        //           console.log(winner)
        //       })
          //})
      })
