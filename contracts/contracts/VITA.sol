// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title VITA - VitaDAO Governance Token
/// @notice ERC20 token with voting power for DAO governance
contract VITA is ERC20Votes, ERC20Permit, Ownable {
    uint256 public constant MAX_SUPPLY = 100_000_000 * 10 ** 18; // 100M VITA

    constructor(
        address initialOwner
    )
        ERC20("VitaDAO", "VITA")
        ERC20Permit("VitaDAO")
        Ownable(initialOwner)
    {
        // Mint initial supply to deployer
        _mint(initialOwner, MAX_SUPPLY);
    }

    /// @notice Mint additional tokens (only owner, up to max supply)
    function mint(address to, uint256 amount) external onlyOwner {
        require(totalSupply() + amount <= MAX_SUPPLY, "VITA: max supply exceeded");
        _mint(to, amount);
    }

    // Required overrides for ERC20Votes + ERC20Permit
    function _update(
        address from,
        address to,
        uint256 value
    ) internal override(ERC20, ERC20Votes) {
        super._update(from, to, value);
    }

    function nonces(
        address owner
    ) public view override(ERC20Permit, Nonces) returns (uint256) {
        return super.nonces(owner);
    }
}
