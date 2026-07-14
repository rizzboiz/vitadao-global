// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title IPNFT - Intellectual Property NFT
/// @notice Represents research IP assets as NFTs. Each token is a unique research project.
contract IPNFT is ERC721URIStorage, Ownable, ReentrancyGuard {
    uint256 private _tokenIdCounter;

    struct IPNFTData {
        string title;
        string researchArea;
        address researcher;
        uint256 fundingGoal;   // in wei
        uint256 currentFunding;
        uint256 mintedAt;
        bool fractionalized;
    }

    // tokenId => metadata
    mapping(uint256 => IPNFTData) public ipnftData;

    // Minimum mint fee (goes to DAO treasury)
    uint256 public mintFee = 0.01 ether;

    address public treasury;

    event IPNFTMinted(
        uint256 indexed tokenId,
        address indexed researcher,
        string title,
        string researchArea,
        uint256 fundingGoal
    );

    event FundingReceived(uint256 indexed tokenId, address indexed funder, uint256 amount);
    event FractionalizationSet(uint256 indexed tokenId, bool status);

    constructor(
        address initialOwner,
        address _treasury
    ) ERC721("IP-NFT", "IPNFT") Ownable(initialOwner) {
        treasury = _treasury;
    }

    /// @notice Mint a new IP-NFT representing a research project
    function mintIPNFT(
        address researcher,
        string calldata title,
        string calldata researchArea,
        uint256 fundingGoal,
        string calldata tokenURI_
    ) external payable nonReentrant returns (uint256) {
        require(msg.value >= mintFee, "IPNFT: insufficient mint fee");
        require(bytes(title).length > 0, "IPNFT: title required");
        require(fundingGoal > 0, "IPNFT: funding goal must be > 0");

        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;

        _safeMint(researcher, tokenId);
        _setTokenURI(tokenId, tokenURI_);

        ipnftData[tokenId] = IPNFTData({
            title: title,
            researchArea: researchArea,
            researcher: researcher,
            fundingGoal: fundingGoal,
            currentFunding: 0,
            mintedAt: block.timestamp,
            fractionalized: false
        });

        // Forward mint fee to treasury
        (bool sent, ) = treasury.call{value: msg.value}("");
        require(sent, "IPNFT: fee transfer failed");

        emit IPNFTMinted(tokenId, researcher, title, researchArea, fundingGoal);
        return tokenId;
    }

    /// @notice Fund a specific IP-NFT research project
    function fundIPNFT(uint256 tokenId) external payable nonReentrant {
        require(_ownerOf(tokenId) != address(0), "IPNFT: token does not exist");
        require(msg.value > 0, "IPNFT: must send ETH");

        ipnftData[tokenId].currentFunding += msg.value;

        // Forward funds to the researcher
        address researcher = ipnftData[tokenId].researcher;
        (bool sent, ) = researcher.call{value: msg.value}("");
        require(sent, "IPNFT: funding transfer failed");

        emit FundingReceived(tokenId, msg.sender, msg.value);
    }

    /// @notice Mark an IP-NFT as fractionalized (called by fractionalization contract)
    function setFractionalized(uint256 tokenId, bool status) external onlyOwner {
        ipnftData[tokenId].fractionalized = status;
        emit FractionalizationSet(tokenId, status);
    }

    /// @notice Update mint fee
    function setMintFee(uint256 newFee) external onlyOwner {
        mintFee = newFee;
    }

    /// @notice Update treasury address
    function setTreasury(address newTreasury) external onlyOwner {
        treasury = newTreasury;
    }

    /// @notice Total number of IP-NFTs minted
    function totalSupply() external view returns (uint256) {
        return _tokenIdCounter;
    }

    /// @notice Get full IP-NFT data
    function getIPNFTData(uint256 tokenId) external view returns (IPNFTData memory) {
        return ipnftData[tokenId];
    }
}
