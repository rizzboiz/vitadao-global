// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title ResearchFunding
/// @notice Community funding pools for longevity research projects
contract ResearchFunding is ReentrancyGuard, Ownable {
    struct Campaign {
        uint256 id;
        address payable researcher;
        string title;
        string description;
        string researchArea;
        uint256 goal;          // in wei
        uint256 raised;        // in wei
        uint256 deadline;      // unix timestamp
        bool withdrawn;
        bool cancelled;
    }

    uint256 public campaignCount;
    mapping(uint256 => Campaign) public campaigns;
    // campaignId => contributor => amount
    mapping(uint256 => mapping(address => uint256)) public contributions;
    // campaignId => list of contributors
    mapping(uint256 => address[]) public contributors;

    // Platform fee in basis points (e.g. 200 = 2%)
    uint256 public platformFee = 200;
    address public feeRecipient;

    event CampaignCreated(
        uint256 indexed id,
        address indexed researcher,
        string title,
        uint256 goal,
        uint256 deadline
    );
    event Contributed(uint256 indexed id, address indexed contributor, uint256 amount);
    event Withdrawn(uint256 indexed id, address indexed researcher, uint256 amount);
    event Refunded(uint256 indexed id, address indexed contributor, uint256 amount);
    event CampaignCancelled(uint256 indexed id);

    constructor(address initialOwner, address _feeRecipient) Ownable(initialOwner) {
        feeRecipient = _feeRecipient;
    }

    /// @notice Create a new research funding campaign
    function createCampaign(
        string calldata title,
        string calldata description,
        string calldata researchArea,
        uint256 goal,
        uint256 durationDays
    ) external returns (uint256) {
        require(goal > 0, "ResearchFunding: goal must be > 0");
        require(durationDays > 0 && durationDays <= 365, "ResearchFunding: invalid duration");
        require(bytes(title).length > 0, "ResearchFunding: title required");

        uint256 id = campaignCount++;
        campaigns[id] = Campaign({
            id: id,
            researcher: payable(msg.sender),
            title: title,
            description: description,
            researchArea: researchArea,
            goal: goal,
            raised: 0,
            deadline: block.timestamp + (durationDays * 1 days),
            withdrawn: false,
            cancelled: false
        });

        emit CampaignCreated(id, msg.sender, title, goal, campaigns[id].deadline);
        return id;
    }

    /// @notice Contribute ETH to a campaign
    function contribute(uint256 campaignId) external payable nonReentrant {
        Campaign storage campaign = campaigns[campaignId];
        require(!campaign.cancelled, "ResearchFunding: campaign cancelled");
        require(block.timestamp < campaign.deadline, "ResearchFunding: campaign ended");
        require(msg.value > 0, "ResearchFunding: must send ETH");

        if (contributions[campaignId][msg.sender] == 0) {
            contributors[campaignId].push(msg.sender);
        }

        contributions[campaignId][msg.sender] += msg.value;
        campaign.raised += msg.value;

        emit Contributed(campaignId, msg.sender, msg.value);
    }

    /// @notice Researcher withdraws funds after goal is met
    function withdraw(uint256 campaignId) external nonReentrant {
        Campaign storage campaign = campaigns[campaignId];
        require(msg.sender == campaign.researcher, "ResearchFunding: not researcher");
        require(campaign.raised >= campaign.goal, "ResearchFunding: goal not reached");
        require(!campaign.withdrawn, "ResearchFunding: already withdrawn");
        require(!campaign.cancelled, "ResearchFunding: campaign cancelled");

        campaign.withdrawn = true;

        uint256 fee = (campaign.raised * platformFee) / 10000;
        uint256 payout = campaign.raised - fee;

        (bool feeSent, ) = feeRecipient.call{value: fee}("");
        require(feeSent, "ResearchFunding: fee transfer failed");

        (bool sent, ) = campaign.researcher.call{value: payout}("");
        require(sent, "ResearchFunding: withdrawal failed");

        emit Withdrawn(campaignId, campaign.researcher, payout);
    }

    /// @notice Contributors get refund if campaign fails or is cancelled
    function refund(uint256 campaignId) external nonReentrant {
        Campaign storage campaign = campaigns[campaignId];
        bool expired = block.timestamp >= campaign.deadline && campaign.raised < campaign.goal;
        require(
            campaign.cancelled || expired,
            "ResearchFunding: not eligible for refund"
        );

        uint256 amount = contributions[campaignId][msg.sender];
        require(amount > 0, "ResearchFunding: no contribution");

        contributions[campaignId][msg.sender] = 0;

        (bool sent, ) = payable(msg.sender).call{value: amount}("");
        require(sent, "ResearchFunding: refund failed");

        emit Refunded(campaignId, msg.sender, amount);
    }

    /// @notice Cancel a campaign (researcher only, before deadline)
    function cancelCampaign(uint256 campaignId) external {
        Campaign storage campaign = campaigns[campaignId];
        require(msg.sender == campaign.researcher || msg.sender == owner(), "ResearchFunding: unauthorized");
        require(!campaign.withdrawn, "ResearchFunding: already withdrawn");
        require(!campaign.cancelled, "ResearchFunding: already cancelled");

        campaign.cancelled = true;
        emit CampaignCancelled(campaignId);
    }

    /// @notice Get all contributors for a campaign
    function getContributors(uint256 campaignId) external view returns (address[] memory) {
        return contributors[campaignId];
    }

    /// @notice Update platform fee (owner only)
    function setPlatformFee(uint256 newFee) external onlyOwner {
        require(newFee <= 1000, "ResearchFunding: fee too high"); // max 10%
        platformFee = newFee;
    }

    /// @notice Update fee recipient
    function setFeeRecipient(address newRecipient) external onlyOwner {
        feeRecipient = newRecipient;
    }

    /// @notice Get campaign funding progress (0-100)
    function getProgress(uint256 campaignId) external view returns (uint256) {
        Campaign storage campaign = campaigns[campaignId];
        if (campaign.goal == 0) return 0;
        uint256 progress = (campaign.raised * 100) / campaign.goal;
        return progress > 100 ? 100 : progress;
    }
}
