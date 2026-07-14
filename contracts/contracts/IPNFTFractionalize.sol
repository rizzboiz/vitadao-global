// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./IPNFT.sol";

/// @title IPNFTFractionalize
/// @notice Locks an IP-NFT and issues ERC20 fraction tokens representing shared ownership
contract IPNFTFractionalize is ERC20, Ownable, ReentrancyGuard {
    IPNFT public immutable ipnft;

    struct Vault {
        uint256 tokenId;
        address originalOwner;
        uint256 totalFractions;
        uint256 salePrice;       // if set, allows buyout
        bool forSale;
        bool redeemed;
    }

    // vaultId => Vault
    mapping(uint256 => Vault) public vaults;
    uint256 public vaultCount;

    // vaultId => holder => fractions
    mapping(uint256 => mapping(address => uint256)) public fractionBalance;

    event Fractionalized(
        uint256 indexed vaultId,
        uint256 indexed tokenId,
        address indexed owner,
        uint256 totalFractions
    );
    event BuyoutInitiated(uint256 indexed vaultId, uint256 salePrice);
    event Redeemed(uint256 indexed vaultId, address indexed buyer);

    constructor(
        address _ipnft,
        address initialOwner
    ) ERC20("VITA Fractions", "VITAF") Ownable(initialOwner) {
        ipnft = IPNFT(_ipnft);
    }

    /// @notice Fractionalize an IP-NFT into ERC20 tokens
    /// @param tokenId The IP-NFT token to fractionalize
    /// @param totalFractions How many fraction tokens to mint
    function fractionalize(
        uint256 tokenId,
        uint256 totalFractions
    ) external nonReentrant returns (uint256 vaultId) {
        require(totalFractions > 0, "Fractionalize: fractions must be > 0");
        require(
            ipnft.ownerOf(tokenId) == msg.sender,
            "Fractionalize: not token owner"
        );
        require(
            !ipnft.getIPNFTData(tokenId).fractionalized,
            "Fractionalize: already fractionalized"
        );

        // Transfer NFT to this contract
        ipnft.transferFrom(msg.sender, address(this), tokenId);

        vaultId = vaultCount++;
        vaults[vaultId] = Vault({
            tokenId: tokenId,
            originalOwner: msg.sender,
            totalFractions: totalFractions,
            salePrice: 0,
            forSale: false,
            redeemed: false
        });

        // Mint fraction tokens to owner
        _mint(msg.sender, totalFractions);
        fractionBalance[vaultId][msg.sender] = totalFractions;

        // Mark NFT as fractionalized
        ipnft.setFractionalized(tokenId, true);

        emit Fractionalized(vaultId, tokenId, msg.sender, totalFractions);
    }

    /// @notice Set a buyout price to allow someone to purchase the entire vault
    function setBuyoutPrice(uint256 vaultId, uint256 price) external {
        Vault storage vault = vaults[vaultId];
        require(vault.originalOwner == msg.sender, "Fractionalize: not vault owner");
        require(!vault.redeemed, "Fractionalize: already redeemed");

        vault.salePrice = price;
        vault.forSale = price > 0;

        emit BuyoutInitiated(vaultId, price);
    }

    /// @notice Buy out the entire vault, reclaim the NFT
    function buyout(uint256 vaultId) external payable nonReentrant {
        Vault storage vault = vaults[vaultId];
        require(vault.forSale, "Fractionalize: not for sale");
        require(!vault.redeemed, "Fractionalize: already redeemed");
        require(msg.value >= vault.salePrice, "Fractionalize: insufficient payment");

        vault.redeemed = true;
        vault.forSale = false;

        // Transfer NFT to buyer
        ipnft.transferFrom(address(this), msg.sender, vault.tokenId);
        ipnft.setFractionalized(vault.tokenId, false);

        // Distribute ETH to fraction holders proportionally (simplified: send to original owner)
        (bool sent, ) = vault.originalOwner.call{value: msg.value}("");
        require(sent, "Fractionalize: payment failed");

        emit Redeemed(vaultId, msg.sender);
    }

    /// @notice Get vault details
    function getVault(uint256 vaultId) external view returns (Vault memory) {
        return vaults[vaultId];
    }
}
