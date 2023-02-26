const { ethers, network } = require("hardhat")
const { moveBlocks } = require("../utils/move-blocks")

async function mint() {
    //const nftMarketPalce = await ethers.getContract("NftMarketplace")
    const basicNft = await ethers.getContract("BasicNft")
    // first we mint a basic NFT
    console.log("Minting NFT...")
    const BasicNfttx = await basicNft.mintNft()
    const BasicNfttxRcpt = await BasicNfttx.wait(1)
    const tokenId = await BasicNfttxRcpt.events[0].args.tokenId

    console.log(`Minted tokenId ${tokenId.toString()} from contract: ${basicNft.address}`)

    if (network.config.chainId == 31337) {
        await moveBlocks(1, (sleepAmount = 1000))
    }
}

mint()
    .then(() => process.exit(0))
    .catch((error) => {
        console.log(error)
        process.exit(1)
    })
