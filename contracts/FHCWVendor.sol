// contracts/FHCW-Vendor.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./CampusToken.sol";
import "hardhat/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract FHCWVendor is Ownable {

    // Link to the campus token smart contract
    CampusToken public campusToken;

    // How many tokens one gets for 1 ETH
    uint256 public tokenEthRatio = 1000;

    // The time between blocks in solidity for time calculations
    uint8 private ethBlockInterval = 6;

    // Timed reward parameters
    uint64 private rewardBlocknumber;
    uint64 private rewardBlockInterval = 10 minutes / ethBlockInterval;

    // Next random reward timestamp
    uint64 private nextRandomReward;
    uint64 private randomRewardInterval = 1 days / ethBlockInterval;

    // Riddle variables
    bytes32 public curRiddleHash = 0x53e61710ae17ed8d626f337ee873b5712496127c5b096c597ed1e733518c48b2; // It's 'Raccoon' ;)
    uint256 public riddleRewardAmount = 2 ether;
    bool private hasbeenSolved = false;

    struct Commit {
        bytes32 riddleHash;
        uint256 commitTime; 
        bool isRevealed;
    }

    // Maps addresses to their commit
    mapping(address => Commit) commits;

    modifier notSolvedYet {
        require(!hasbeenSolved, "The riddle has been solved already, wait for the next riddle");
        _;
    }

    constructor(address _campusTokenAddress) payable Ownable(msg.sender) {

        // Defines the first reward block-timestamp
        rewardBlocknumber = uint64(block.number + (2 minutes / ethBlockInterval));

        // Random reward can stay in block.timestamp
        nextRandomReward = uint64(block.number);

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
        console.log(block.number, rewardBlocknumber);
        require(block.number >= rewardBlocknumber, "Rewards not available yet");

        // Distribute rewards to all users
        for (uint i = 0; i < receivers.length; i++) {
            campusToken.transfer(receivers[i], _rewardAmount);
        }

        // Update the reward timestamp for the next distribution
        rewardBlocknumber += rewardBlockInterval;
    }

    // SC03, SC08 => Timestamp dependence, Insecure Randomness
    /**
     * @dev Returns a random token amount between 0 and 99 Tokens
     */
    function randomReward() public returns(uint256) {
        // Checks if the next reward is available yet
        console.log(block.number, nextRandomReward);
        require(block.number >= nextRandomReward, "No reward available yet - Try again later");

        // Calculates random reward based on number
        uint randomNumber = (block.number * 1234) % 100;

        // Transfers Tokens to sender
        campusToken.transfer(msg.sender, randomNumber);

        // Sets the next random reward time
        nextRandomReward = uint64(block.number + randomRewardInterval);
        console.log(nextRandomReward);

        return randomNumber;
    }

    // SC05 => Front running
    /**
     * @dev Returns a reward of 5 ETH when guessing the correct riddle string
     * If the caller is the owner, the new riddleString is set instead
     */
    function riddleReward(string memory riddleInput) public {
        if (msg.sender == owner()) {
            curRiddleHash = bytes32(bytes(riddleInput)); // Needs to be a keccak256 hash already
            hasbeenSolved = false;
            return;
        }
        require(!hasbeenSolved, "The riddle has been solved already, wait for the next riddle");
        require(curRiddleHash == keccak256(abi.encodePacked(riddleInput)), "Wrong answer");

        (bool sent, ) = msg.sender.call{value: riddleRewardAmount}("");
        require(sent, "Failed to send ether");
        hasbeenSolved = true;
    }

    /**
     * @dev Takes a calculated hash and puts it in the mapping - Also checks if the users has ever commited before
     * Commit function to store the hash calculated using keccak256(address in lowercase + solution + secret).
     */
    function commitSolution(bytes32 _hash) public notSolvedYet {
        Commit storage commit = commits[msg.sender];
        require(commit.commitTime == 0, "Already commited");
        commit.riddleHash = _hash;
        commit.commitTime = block.timestamp;
        commit.isRevealed = false;
    }

    /**
     * @dev Reveals the answer by requireing the secret and solution to generate the hash
     * If the hashes match then the inputs in the commits were the same and the riddle is solved
     * If not, then the function is roled back
     */
    function revealSolution(string memory _solution, string memory _secret) public notSolvedYet {
        Commit storage commit = commits[msg.sender];
        require(commit.commitTime != 0, "No commit yet!");
        require(commit.commitTime < block.timestamp, "Cannot commit and reveal in the same block!");
        require(!commit.isRevealed, "You already revealed your solution");

        bytes32 riddleHash = keccak256(abi.encodePacked(msg.sender, _solution, _secret));
        require(riddleHash == commit.riddleHash, "Hash doesn't match");
        require(keccak256(abi.encodePacked(_solution)) == curRiddleHash, "Incorrent answer");

        (bool sent, ) = payable(msg.sender).call{value: riddleRewardAmount}("");
        if (!sent) { revert("Failed to reward winner, reverting..."); }

        hasbeenSolved = true;
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
        require(sellAmount > 0, "You most sell more than zero tokens");

        uint256 sellETHVal = (sellAmount / tokenEthRatio) * 10 ** 18;

        require(address(this).balance > sellETHVal, "You most sell more than zero tokens");

        // Checks if sender has enough tokens to sell requested amount
        uint256 senderBalance = campusToken.balanceOf(msg.sender);
        require(senderBalance >= sellAmount, "Seems like you haven't got enough tokens");

        campusToken.transferFrom(msg.sender, address(this), sellAmount);

        (bool sent, ) = msg.sender.call{value: sellETHVal}("");
        require(sent, "Couldn't send ETH to user");
    }

    function withdraw() public onlyOwner() {
        uint256 contractBalance = address(this).balance;
        require(contractBalance > 0, "Contract holds no ETH currently");

        (bool sent, ) = msg.sender.call{value: contractBalance}("");
        require(sent, "Couldn't transfer ETH to owner");
    }
}
