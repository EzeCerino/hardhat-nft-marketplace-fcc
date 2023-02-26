const { ethers, network } = require("hardhat")
const { moveBlocks } = require("../utils/move-blocks")
const PRICE = ethers.utils.parseEther("0.1")

async function mintAndList() {
    const nftMarketPalce = await ethers.getContract("NftMarketplace")
    const basicNft = await ethers.getContract("BasicNft")
    // first we mint a basic NFT
    console.log("Minting NFT...")
    const BasicNfttx = await basicNft.mintNft()
    const BasicNfttxRcpt = await BasicNfttx.wait(1)
    const tokenId = await BasicNfttxRcpt.events[0].args.tokenId

    //Approving NFT
    console.log("approving...")
    const tx_appoval = await basicNft.approve(nftMarketPalce.address, tokenId)
    await tx_appoval.wait(1)

    console.log("listing NFT...")
    /// with the tokenId we list the item
    const tx_marketPlace = await nftMarketPalce.listItem(basicNft.address, tokenId, PRICE)
    await tx_marketPlace.wait(1)
    console.log("Listed!!")

    if (network.config.chainId == 31337) {
        await moveBlocks(1, (sleepAmount = 1000))
    }
}

mintAndList()
    .then(() => process.exit(0))
    .catch((error) => {
        console.log(error)
        process.exit(1)
    })
