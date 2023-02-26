const { ethers } = require("hardhat")
const { moveBlocks } = require("../utils/move-blocks")

const TOKEN_ID = 2

async function buyItem() {
    const NftMarketplace = await ethers.getContract("NftMarketplace")
    const BasicNft = await ethers.getContract("BasicNft")
    const listing = await NftMarketplace.getListing(BasicNft.address, TOKEN_ID)
    const price = await listing.price.toString()
    const tx = await NftMarketplace.buyItem(BasicNft.address, TOKEN_ID, { value: price })
    await tx.wait(1)
    console.log("Item Bougth")
    if (network.config.chainId == 31337) {
        await moveBlocks(2, (sleepAmount = 1000))
    }
}

buyItem()
    .then(() => process.exit(0))
    .catch((error) => {
        console.log(error)
        process.exit(1)
    })
