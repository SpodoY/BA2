// contracts/FHCW-Vendor.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./CampusToken.sol";

contract FHCWVendor {

    // Owner of the smart contract
    address owner;

    // Link to the campus token smart contract
    CampusToken public campusToken;

    // Timed reward parameters
    uint64 private rewardTimestamp = uint64(block.timestamp + (2 minutes));
    uint64 private rewardInterval = 10 minutes;

    // Next random reward timestamp
    uint64 private nextRandomReward = uint64(block.timestamp);
    uint64 private randomRewardInterval = 1 days;

    constructor(address _campusTokenAddress) {
        // Specifies contract deployer as owner
        owner = msg.sender;

        // Links to a CampusToken smart-contract
        campusToken = CampusToken(_campusTokenAddress);
    }

    // Pseudo Reward function
    function reward(uint tokens) public returns(string memory) {
        if (tokens >= 10_000) {
            campusToken.burnFrom(msg.sender, 10_000);
            return "You traded your tokens for a premium reward";
        } else if(tokens >= 1_000) {
            campusToken.burnFrom(msg.sender, 1_000);
            return "You traded your tokens for a normal reward";
        } else {
            revert("Submit at least 1.000 Tokens for a normal, 10.000 for a premium reward");
        }
    }

    // SC03 - Timestamp dependence
    function multipleReward(
        uint256 _rewardAmount,
        address[] memory receivers
    ) external {
        // Check if current timestamp is greater than or equal to a specific timestamp
        require(block.timestamp >= rewardTimestamp, "Rewards not available yet");

        // Distribute rewards to all users
        for (uint i = 0; i < receivers.length; i++) {
            campusToken.transfer(receivers[i], _rewardAmount);
        }

        // Update the reward timestamp for the next distribution
        rewardTimestamp += rewardInterval;
    }

    /**
     * @dev Returns a random token amount between 0 and 99 Tokens
     */
    function randomReward() public {
        require(block.timestamp >= nextRandomReward, "No reward available yet - Try again later");
        uint randomNumber = uint256(keccak256(abi.encodePacked(block.timestamp))) % 100;
        campusToken.transfer(msg.sender, randomNumber);
        nextRandomReward = uint64(block.timestamp + randomRewardInterval);
    }

    function balanceOfVendor() public view returns(uint256) {
        return campusToken.balanceOf(address(this));
    }
}
