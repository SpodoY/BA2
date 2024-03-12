// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

library Utils {

    function toString(uint256 number) internal pure returns(string memory) {
        return string(abi.encode(number));
    }

}