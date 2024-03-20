// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
// SC02 => Over/Underflow

import "hardhat/console.sol";

contract CampusToken {

    // SC09 => Gas Limit
    address public owner;

    // Name and Symbol of Token
    string name;
    string symbol;
    uint256 public totalSupply;

    // Commas for Token to allow for floats - This token is not planned to have more than one comma
    uint public decimals = 1;

    // Tracks balances and allowances per account
    mapping(address accout => uint256) balances;
    mapping(address accout => mapping(address spender => uint)) allowances;

    // Allows contracts in mapping to call sepcial functions
    mapping(address contracts => bool) priviliges;

    /**
     * @dev Validates if the sender has the appropriate balance
     */
    modifier validBalance(uint _val) {
        require(balances[msg.sender] >= _val, "Insufficient balance");
        _;
    }

    /**
     * @dev Validates if the sender is the owner
     */
    modifier ownerOnly() {
        require(msg.sender == owner, "You are not owner!");
        _;
    }

    constructor() {
        // Specifies contract deployer as owner
        owner = msg.sender;

        // Sets name and Symbol of Token
        name = "Campus Token";
        symbol = "FHCW";

        uint initialTokenAmount = 100_000 * 10 ** decimals;

        // Adds initial supply to totalSupply
        totalSupply += initialTokenAmount;

        // Add initial funds to the deployed of contract
        balances[msg.sender] = initialTokenAmount;
    }

    // SC07 => Logic Erros (No address checking)
    /**
     * @dev Transfers tokens from the sender to a given receiver
     * @param _to Receiver
     * @param _val Amount of token to be tranfsered
     */
    function transfer(address _to, uint _val) validBalance(_val) public returns(bool) {
        require(balances[msg.sender] >= _val, "Insufficient funds!");
        balances[msg.sender] -= _val;
        balances[_to] += _val;
        return true;
    }

    // SC01 => Reentrancy
    /**
     * @dev Allows transfer of tokens through a 3rd party as long as allowance is given
     * @param _from The address where the tokens are deducted
     * @param _to The address where the tokens are added
     * @param _val How many tokens should be tranfered
     */
    function transferFrom(address _from, address _to, uint _val) public returns(bool) {
        require(balances[_from] >= _val, "Insufficient funds!");

        if (!priviliges[msg.sender]) {
            validAllowance(_from, _val);
            allowances[_from][msg.sender] -= _val;
        }
        
        balances[_from] -= _val;
        balances[_to] += _val;

        return true;
    }

    // SC05 => Front running
    /**
     * @dev Allows for a specific address to spend a given amount of tokens of another account
     * @param _spender The intended spenders address
     * @param _val How many tokens can be spent
     */
    function approve(address _spender, uint _val) public returns (bool) {
        allowances[msg.sender][_spender] = _val;
        return true;
    }

    /**
     * @dev Returns the remaining number of tokens that spender has allowed
     * @param _owner The token owner
     * @param _spender The token spender
     */
    function allowance(address _owner, address _spender) public view returns(uint) {
        return allowances[_owner][_spender];
    }

    /**
     * @dev Adds tokens to totalSupply
     * @param _val How many tokens get added
     */
    function mint(address account, uint _val) public ownerOnly {
        totalSupply += _val;
        balances[account] += _val;
    }

    // SC04 => Access Control
    /**
     * @dev Destroys all passed tokens from user
     * @param _val How many tokens to burn
     */
    function burn(uint _val) public validBalance(_val) returns(bool) {
        totalSupply -= _val;
        balances[msg.sender] -= _val;
        return true;
    }

    // SC01 => Reentrancy
    /**
     * @dev Burns `_val` amount of tokens for address `adr`
     */
    function burnFrom(address adr, uint _val) public returns(bool) {
        require(priviliges[msg.sender]);
        require(balances[adr] - _val >= 0);
        balances[adr] -= _val;
        totalSupply -= _val;
        return true;
    }

    /**
     * @dev Displays the balance of a given `usr`
     */
    function balanceOf(address usr) public view returns(uint256) {
        return balances[usr];
    }

    /**
     * @dev Returns the balance of the sender
     */
    function selfBalance() public view returns(uint256) {
        return balances[msg.sender];
    }

    // 
    /**
     * @dev Validates if allowance is sufficient for transaction
     */
    function validAllowance(address _from, uint _val) private view {
        require(allowances[_from][msg.sender] >= _val, "Allowance exceeded");
    }

    function hasPriv(address adr) public view returns(bool) {
        return priviliges[adr];
    }

    /**
     * @dev Meant to grant smart contracs prviliges to execute certain functions
     * @param sc The Smart contract access shall be granted to
     */
    function grantPrivileges(address sc) public ownerOnly() {
        priviliges[sc] = true;
    }
}