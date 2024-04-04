// SPDX-License-Identifier: MIT
pragma solidity ^0.7.6;

contract SC02 {

    uint8 public overflow = 2 ** 8 - 1;
    uint256 public underflow = 0;

    constructor() {
        unlockTime = block.timestamp + 1 days;
    }

    function causeOverflow() public returns(uint8) {
        overflow++;
        return overflow;
    }

    function causeUnderflow() public returns(uint256) {
        underflow--;
        return underflow;
    }
    
}