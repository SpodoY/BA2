// contracts/FHCW-Vendor.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./CampusToken.sol";

contract FHCWVendor {

    // Owner of the smart contract
    address public owner;

    // Link to the campus token smart contract
    CampusToken public campusToken;

    // How many tokens one gets for 1 ETH
    uint256 public tokenEthRatio = 1000; 

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

    receive() external payable {}

    // Pseudo Reward function
    // SC10 => Unchecked External Calls
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

    // SC03, SC06 => Timestamp dependence, DoS Attacks
    // SC09 => Gas Limit
    function multipleReward(uint256 _rewardAmount, address[] memory receivers) external {
        // Check if current timestamp is greater than or equal to a specific timestamp
        require(block.timestamp >= rewardTimestamp, "Rewards not available yet");

        // Distribute rewards to all users
        for (uint i = 0; i < receivers.length; i++) {
            campusToken.transfer(receivers[i], _rewardAmount);
        }

        // Update the reward timestamp for the next distribution
        rewardTimestamp += rewardInterval;
    }

    // SC03, SC08 => Timestamp dependence, Insecure Randomness
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

    function buyTokens() public payable returns (uint256 tokensCount) {
        require(msg.value > 0, "Send ETH to buy tokens");

        uint256 tokenAmount = (msg.value / 10 ** 18)  * tokenEthRatio;

        uint256 senderBalance = balanceOfVendor();
        require(senderBalance >= tokenAmount, "Vendor contract seems to not have enough tokens");

        // Transfers tokens from Vendor to sender
        require(campusToken.transfer(msg.sender, tokenAmount));

        return tokenAmount;
    }

    /**
     * @dev Sells the amount of tokens the user provides
     * @param sellAmount The amount of tokens to sell
     */
    function sellTokens(uint256 sellAmount) public {
        // Checks if requested amount is more than 0
        require(sellAmount > 0, "You must sell more than zero tokens");

        uint256 sellETHVal = (sellAmount / tokenEthRatio) * 10 ** 18;
        console.log("sellEthVal", sellETHVal);

        require(address(this).balance >= sellETHVal, "Contract has insufficient funding");

        // Checks if sender has enough tokens to sell requested amount
        uint256 senderBalance = campusToken.balanceOf(msg.sender);
        require(senderBalance >= sellAmount, "Seems like you haven't got enough tokens");

        (bool sent, ) = msg.sender.call{value: sellETHVal}("");
        require(sent, "Could not send ETH");

        // console.log("Transferring Tokens");
        // campusToken.transferFrom(msg.sender, address(this), sellAmount);

    }

    function withdraw() public {
        require(msg.sender == owner, "You are not the owner and therefore cannot withdraw");
        uint256 contractBalance = address(this).balance;
        require(contractBalance > 0, "Contract holds no ETH currently");

        (bool sent, ) = msg.sender.call{value: contractBalance}("");
        require(sent, "Couldn't transfer ETH to owner");
    }
}
