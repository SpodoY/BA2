// contracts/SecretStroage.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract SecretStorage is UUPSUpgradeable, OwnableUpgradeable {

    string private mySecret;

    function initialize() public initializer {
        __Ownable_init(msg.sender);
        mySecret = "VerySecure";
    }

    function newSecret(string memory _newSecret) public {
        mySecret = _newSecret;
    }

    function getSecret() public view returns (string memory) {
        return mySecret;
    }

    function _authorizeUpgrade(address newImplementation) internal override virtual onlyOwner() {}
}

contract SecretStorageV2 is SecretStorage {
    function version() pure public returns (int8) {
        return 2;
    }   
}