const { assert, expect } = require("chai")
const { network, deployments, ethers, getNamedAccounts } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("NFT Market Place Test", function () {
          let nftMarketPalce, basicNft, deployer, player
          const PRICE = ethers.utils.parseEther("0.1")
          const LESSPRICE = ethers.utils.parseEther("0.01")
          const TOKEN_ID = 0

          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer
              const accounts = await ethers.getSigners()
              player = accounts[1]
              await deployments.fixture(["all"])
              nftMarketPalce = await ethers.getContract("NftMarketplace")
              basicNft = await ethers.getContract("BasicNft")
              await basicNft.mintNft()
              await basicNft.approve(nftMarketPalce.address, TOKEN_ID)
          })

          describe("listing Items", async function () {
              it("emit an event after listing the item", async function () {
                  await expect(nftMarketPalce.listItem(basicNft.address, TOKEN_ID, PRICE)).to.emit(
                      nftMarketPalce,
                      "ItemListed"
                  )
              })
              it("only allows owners to list items", async function () {
                  const playerConnectedWithMarketplace = await nftMarketPalce.connect(player)
                  await expect(
                      playerConnectedWithMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  ).to.be.revertedWith("NftMarketplace__NotOwner")
              })
              it("update listing with seller and price", async function () {
                  await nftMarketPalce.listItem(basicNft.address, TOKEN_ID, PRICE)
                  const listing = await nftMarketPalce.getListings(basicNft.address, TOKEN_ID)
                  assert.equal(listing.price.toString(), PRICE)
                  assert.equal(listing.seller.toString(), deployer)
              })
          })
          describe("Cancelling items", function () {
              it("reverts if not listed", async function () {
                  await expect(
                      nftMarketPalce.cancelListing(basicNft.address, TOKEN_ID)
                  ).to.be.revertedWith("NftMarketplace__NotListed")
              })
              it("reverts if other but the owner tries to cancel", async function () {
                  await nftMarketPalce.listItem(basicNft.address, TOKEN_ID, PRICE)
                  const playerConnectedWithMarketplace = await nftMarketPalce.connect(player)
                  await expect(
                      playerConnectedWithMarketplace.cancelListing(basicNft.address, TOKEN_ID)
                  ).to.be.revertedWith("NftMarketplace__NotOwner")
              })
              it("emits an event when canceling item", async function () {
                  await nftMarketPalce.listItem(basicNft.address, TOKEN_ID, PRICE)
                  expect(await nftMarketPalce.cancelListing(basicNft.address, TOKEN_ID)).to.emit(
                      "ItemCanceled"
                  )
                  await expect(
                      nftMarketPalce.cancelListing(basicNft.address, TOKEN_ID)
                  ).to.be.revertedWith("NftMarketplace__NotListed")
              })
          })
          describe("buyItem function", function () {
              it("reverts if the item is not listed", async function () {
                  await expect(
                      nftMarketPalce.buyItem(basicNft.address, TOKEN_ID, { value: PRICE })
                  ).to.be.revertedWith("NftMarketplace__NotListed")
              })
              it("reverts if the price is not met", async function () {
                  await nftMarketPalce.listItem(basicNft.address, TOKEN_ID, PRICE)
                  await expect(
                      nftMarketPalce.buyItem(basicNft.address, TOKEN_ID, { value: LESSPRICE })
                  ).to.be.revertedWith("NftMarketplace__PriceNotMet")
              })
              it("can list and bougth item", async function () {
                  await nftMarketPalce.listItem(basicNft.address, TOKEN_ID, PRICE)
                  const playerConnectedWithMarketplace = await nftMarketPalce.connect(player)
                  await playerConnectedWithMarketplace.buyItem(basicNft.address, TOKEN_ID, {
                      value: PRICE,
                  })
                  const newOwner = await basicNft.ownerOf(TOKEN_ID)
                  const deployerProceeds = await nftMarketPalce.getProceeds(deployer)
                  assert.equal(newOwner.toString(), player.address)
                  assert.equal(deployerProceeds.toString(), PRICE.toString())
              })
          })
          describe("Withdrawals Proceeds", function () {
              it("doesn't allow 0 proceed withdarwalls", async function () {
                  await expect(nftMarketPalce.withdrawProceeds()).to.be.revertedWith(
                      "NftMarketplace__NotProceeds"
                  )
              })
              it("withdraws proceeds", async function () {
                  await nftMarketPalce.listItem(basicNft.address, TOKEN_ID, PRICE)
                  const playerConnectedWithMarketplace = await nftMarketPalce.connect(player)
                  await playerConnectedWithMarketplace.buyItem(basicNft.address, TOKEN_ID, {
                      value: PRICE,
                  })
                  const oldproceeds = await nftMarketPalce.getProceeds(deployer)
                  const deployerConnectedWithMarketplace = await nftMarketPalce.connect(deployer)
                  await nftMarketPalce.withdrawProceeds()
                  assert.equal(oldproceeds.toString(), PRICE.toString())
                  assert.equal((await nftMarketPalce.getProceeds(deployer)).toString(), "0")
              })
          })
      })

//https://youtu.be/gyMwXuJrbJQ?t=89027
