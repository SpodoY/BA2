// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
// SC02 => Over/Underflow

import "hardhat/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

contract CampusToken is Ownable, AccessControl, ERC20Burnable {

    // SC09 => Gas Limit

    // Priviliged role 
    bytes32 public constant PRIV_ROLE = keccak256("PRIV_ROLE");

    // Tracks balances and allowances per account
    mapping(address accout => uint256) balances;
    mapping(address accout => mapping(address spender => uint)) allowances;

    // Custom error when caller is not privileged
    error CallerNotPriviledged(address caller);

    constructor() Ownable(msg.sender) ERC20("Campus Token", "FHCW") {

        // Grant the contract deployer the default admin role and the priv role
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PRIV_ROLE, msg.sender);

        // Add initial funds to the deployed of contract
        _mint(msg.sender, 100_000 * 10 ** decimals());
    }

    /**
     * @dev Creates `amount` new tokens for `to`
     */
    function mint(address to, uint256 amount) public {
        require(hasRole(PRIV_ROLE, _msgSender()), "Must have priviledged role to mint");
        _mint(to, amount);
    }

    /**
     * @dev Returns the balance of the sender
     */
    function selfBalance() public view returns(uint256) {
        return balances[msg.sender];
    }

    /**
     * @dev Overrides decimals to allow for only 1 decimal place
     */
    function transferFrom(address from, address to, uint256 value) public override returns (bool) {
        address spender = _msgSender();
        if (hasRole(PRIV_ROLE, spender)) {
            _approve(from, spender, value);
        }
        _spendAllowance(from, spender, value);
        _transfer(from, to, value);
        return true;
    }

    /**
     * @dev Overrides decimals to allow for only 1 decimal place
     */
    function decimals() public view virtual override returns (uint8) {
        return 1;
    }
}