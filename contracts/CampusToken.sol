// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract CampusToken {

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

    /**
     * @dev Validates if the sender has the appropriate balance
     */
    modifier validBalance(uint _val) {
        require(balances[msg.sender] >= _val, "Insufficient balance");
        _;
    }

    // 
    /**
     * @dev Validates if allowance is sufficient for transaction
     */
    modifier validAllowance(address _from, uint _val) {
        require(allowances[_from][msg.sender] >= _val, "Allowance exceeded");
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

    /**
     * @dev Transfers tokens from the sender to a given receiver
     * @param _to Receiver
     * @param _val Amount of token to be tranfsered
     */
    function transfer(address _to, uint _val) validBalance(_val) public returns(bool success) {
        require(balances[msg.sender] >= _val, "Insufficient funds!");
        balances[msg.sender] -= _val;
        balances[_to] += _val;
        return true;
    }

    /**
     * @dev Allows for a specific address to spend a given amount of tokens of another account
     * @param _spender The intended spenders address
     * @param _val How many tokens can be spent
     */
    function approve(address _spender, uint _val) public returns (bool success) {
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

    //Missing valid balance check - SC07
    /**
     * @dev Allows transfer of tokens through a 3rd party as long as allowance is given
     * @param _from The address where the tokens are deducted
     * @param _to The address where the tokens are added
     * @param _val How many tokens should be tranfered
     */
    function transferFrom(address _from, address _to, uint _val) validAllowance(_from, _val) public returns(bool success) {
        require(balances[_from] >= _val, "Insufficient funds!");
        require(allowances[_from][msg.sender] >= _val, "Insufficient allowance!");
        
        balances[_from] -= _val;
        balances[_to] += _val;
        allowances[_from][msg.sender] -= _val;

        return true;
    }

    /**
     * @dev Adds tokens to totalSupply
     * @param _val How many tokens get added
     */
    function mint(address account, uint _val) public ownerOnly {
        totalSupply += _val;
        balances[account] += _val;
    }

    /**
     * @dev Destroys all passed tokens from user
     * @param _val How many tokens to burn
     */
    function burn(uint _val) public validBalance(_val) returns(bool) {
        totalSupply -= _val;
        balances[msg.sender] -= _val;
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
}