// contracts/FHCW-Vendor.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./CampusToken.sol";

contract FHVendor {
    CampusToken public campusToken;

    uint64 private rewardTimestamp = uint64(block.timestamp + (2 minutes));
    uint64 private rewardInterval = 10 minutes;
    uint64 private nextRandomReward = uint64(block.timestamp);

    mapping(address => uint256) public balances;
    mapping(address => mapping(address => uint256)) public allowances;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    constructor(address _campusTokenAddress) {
        campusToken = CampusToken(_campusTokenAddress);
    }

    function deposit() public payable {
        require(campusToken.balanceOf(msg.sender) >= msg.value);
        
        balances[msg.sender] = msg.value;
    }

    // Transfers amount from the invoker to a given address
    function transfer(address _to, uint _amount) public {
        require(balances[msg.sender] >= _amount, "Insufficient balance");
        balances[msg.sender] -= _amount;
        balances[_to] += _amount;
        emit Transfer(msg.sender, _to, _amount);
    }

    // Grants a specific spender a certain amount to spend
    function approve(address _spender, uint _amount) public {
        allowances[msg.sender][_spender] = _amount;
        emit Approval(msg.sender, _spender, _amount);
    }

    // Allows transfer for 3rd parties as long as allowance is given
    function transferFrom(
        address _from,
        address _to,
        uint _amount
    ) public returns (bool) {
        require(balances[_from] >= _amount, "Insufficient balance");
        require(allowances[_from][msg.sender] >= _amount, "Allowance exceeded");
        balances[_from] -= _amount;
        balances[_to] += _amount;
        allowances[_from][msg.sender] -= _amount;
        emit Transfer(_from, _to, _amount);
        return true;
    }

    // Pseudo Reward function
    function reward(address _recipient, uint _amount) public {
        //TODO: Implement some pseudo Reward
    }

    // SC03 - Timestamp dependence
    function distributeRewards(
        uint256 _rewardAmount,
        address[] memory receivers
    ) external {
        // Check if current timestamp is greater than or equal to a specific timestamp
        require(
            block.timestamp >= rewardTimestamp,
            "Rewards not available yet"
        );

        // Distribute rewards to all users
        for (uint i = 0; i < receivers.length; i++) {
            campusToken.transfer(receivers[i], _rewardAmount);
        }

        // Update the reward timestamp for the next distribution
        rewardTimestamp += rewardInterval;
    }

    function randomReward() public {
        require(block.timestamp >= nextRandomReward);
        uint randomNumber = uint256(keccak256(abi.encodePacked(block.timestamp))) % 100;
        transfer(msg.sender, randomNumber);
        nextRandomReward = uint64(block.timestamp + 1 days);
    }
}
