//SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import "@openzeppelin/contracts/interfaces/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

error NftMarketplace__PriceMustBeAboveZer();
error NftMarketplace__NotApprovedForMarketPlace();
error NftMarketplace__AlreadyListed(address nftAddres, uint256 tokenId);
error NftMarketplace__NotListed(address nftAddres, uint256 tokenId);
error NftMarketplace__NotOwner();
error NftMarketplace__PriceNotMet(address nftAddres, uint256 tokenId, uint256 nftPrice);
error NftMarketplace__NotProceeds();
error NftMarketplace__WithdrawFailed();

contract NftMarketplace is ReentrancyGuard {
    // Nueva struct con le listado de el token y su precio.

    struct Listing {
        uint256 price;
        address seller;
    }

    ////////////////
    ///Events//////
    ///////////////

    event ItemListed(
        address indexed seller,
        address indexed nftAddress,
        uint256 indexed tokenId,
        uint256 price
    );

    event ItemBougth(
        address indexed buyer,
        address indexed nftAddress,
        uint256 indexed tokenId,
        uint256 price
    );

    event ItemCanceled(address indexed seller, address indexed nftAddress, uint256 indexed tokenId);

    // Mapping del NFT contract => token ID => listado de precio/vendedor en forma de struct.
    mapping(address => mapping(uint256 => Listing)) private s_listings;
    // Mapping the address of the seller to its proceeds
    mapping(address => uint256) private s_proceeds;

    ///////////////////
    /////Modifiers////
    //////////////////

    modifier notListed(
        address nftAddres,
        uint256 tokenId,
        address owner
    ) {
        Listing memory listing = s_listings[nftAddres][tokenId];
        if (listing.price > 0) {
            revert NftMarketplace__AlreadyListed(nftAddres, tokenId);
        }
        _;
    }

    modifier isListed(address nftAddres, uint256 tokenId) {
        Listing memory listing = s_listings[nftAddres][tokenId];
        if (listing.price <= 0) {
            revert NftMarketplace__NotListed(nftAddres, tokenId);
        }
        _;
    }

    modifier isOwner(
        address nftAddress,
        uint256 tokenId,
        address spender
    ) {
        IERC721 nft = IERC721(nftAddress);
        address owner = nft.ownerOf(tokenId);
        if (spender != owner) {
            revert NftMarketplace__NotOwner();
        }
        _;
    }

    ///////////////////
    //Main Functions//
    //////////////////

    /**
     * @notice Method for listing your NFT on the market place
     * @param nftAddress: Address of the NFT
     * @param tokenId: The Token Id of the NFT
     * @param price: sale price of the listed NFT
     * @dev we could have the contract be the escrow for the nft but this
     * way people can still hold their nfts while listed.
     */

    function listItem(
        address nftAddress,
        uint256 tokenId,
        uint256 price
    ) external notListed(nftAddress, tokenId, msg.sender) isOwner(nftAddress, tokenId, msg.sender) {
        if (price <= 0) {
            revert NftMarketplace__PriceMustBeAboveZer();
        }
        IERC721 nft = IERC721(nftAddress);
        if (nft.getApproved(tokenId) != address(this)) {
            revert NftMarketplace__NotApprovedForMarketPlace();
        }

        s_listings[nftAddress][tokenId] = Listing(price, msg.sender);
        emit ItemListed(msg.sender, nftAddress, tokenId, price);
    }

    function buyItem(
        address nftAddress,
        uint256 tokenId
    ) external payable nonReentrant isListed(nftAddress, tokenId) {
        Listing memory listedItem = s_listings[nftAddress][tokenId];
        if (msg.value < listedItem.price) {
            revert NftMarketplace__PriceNotMet(nftAddress, tokenId, listedItem.price);
        }

        // actualizo el mapping de las procceeds
        s_proceeds[listedItem.seller] = s_proceeds[listedItem.seller] + msg.value;
        // lo borro del listing mapping
        delete (s_listings[nftAddress][tokenId]);
        IERC721(nftAddress).safeTransferFrom(listedItem.seller, msg.sender, tokenId);
        emit ItemBougth(msg.sender, nftAddress, tokenId, listedItem.price);
    }

    function cancelListing(
        address nftAddress,
        uint256 tokenId
    ) external isOwner(nftAddress, tokenId, msg.sender) isListed(nftAddress, tokenId) {
        delete (s_listings[nftAddress][tokenId]);
        emit ItemCanceled(msg.sender, nftAddress, tokenId);
    }

    function updateListing(
        address nftAddress,
        uint256 tokenId,
        uint256 newPrice
    ) external isListed(nftAddress, tokenId) isOwner(nftAddress, tokenId, msg.sender) {
        s_listings[nftAddress][tokenId].price = newPrice;
        emit ItemListed(msg.sender, nftAddress, tokenId, newPrice);
    }

    function withdrawProceeds() external {
        uint256 proceeds = s_proceeds[msg.sender];
        if (proceeds <= 0) {
            revert NftMarketplace__NotProceeds();
        }

        s_proceeds[msg.sender] = 0;
        (bool succeess, ) = payable(msg.sender).call{value: proceeds}("");
        if (!succeess) {
            revert NftMarketplace__WithdrawFailed();
        }
    }

    ///////////////////////
    ///Getters Functions///
    ///////////////////////

    //https://youtu.be/gyMwXuJrbJQ?t=87878

    function getListings(
        address nftAddress,
        uint256 tokenId
    ) external view returns (Listing memory) {
        return s_listings[nftAddress][tokenId];
    }

    function getProceeds(address seller) external view returns (uint256) {
        return s_proceeds[seller];
    }
}
