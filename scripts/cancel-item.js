const { ethers } = require("hardhat")
const { moveBlocks } = require("../utils/move-blocks")

const TOKEN_ID = 0

async function cancel() {
    const NftMarketplace = await ethers.getContract("NftMarketplace")
    const BasicNft = await ethers.getContract("BasicNft")
    const tx = await NftMarketplace.cancelListing(BasicNft.address, TOKEN_ID)
    await tx.wait(1)
    console.log("Item Cancelled")
    if (network.config.chainId == 31337) {
        await moveBlocks(1, (sleepAmount = 1000))
    }
}

cancel()
    .then(() => process.exit(0))
    .catch((error) => {
        console.log(error)
        process.exit(1)
    })
