// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract CampusToken {

    address public owner;

    // Name and Symbol of Token
    string name;
    string symbol;
    uint256 public totalSupply;

    // Commas for Token to allow for floats - This token is not planned to have more than one comma
    uint decimals = 1;

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
     * 
     * @param name_ Name of token
     * @param symbol_ Symobl of token
     */
    constructor(string memory name_, string memory symbol_) {
        // Specifies contract deployer as owner
        owner = msg.sender;

        // Sets name and Symbol of Token
        name = name_;
        symbol = symbol_;

        // Adds initial supply to totalSupply
        totalSupply += convToken(10_000);

        // Add initial funds to the deployed of contract
        balances[msg.sender] = convToken(10_000);
    }

    /**
     * @dev Return the right amount of tokens based on the decimals
     * @param amount The amount of tokens that should be returned
     */
    function convToken(uint amount) private view returns(uint) {
        return amount * 10 ** decimals;
    }

    /**
     * @dev Transfers tokens from the sender to a given receiver
     * @param _to Receiver
     * @param _val Amount of token to be tranfsered
     */
    function transfer(address _to, uint _val) validBalance(_val) public returns(bool) {
        balances[msg.sender] -= _val;
        balances[_to] += _val;
        return true;
    }

    /**
     * @dev Allows for a specific address to spend a given amount of tokens of another account
     * @param _spender The intended spenders address
     * @param _val How many tokens can be spent
     */
    function approve(address _spender, uint _val) public {
        allowances[msg.sender][_spender] = _val;
    }

    /**
     * @dev Returns the remaining number of tokens that spender has allowed
     * @param owner The token owner
     * @param spender The token spender
     */
    function allowance(address owner, address spender) public view returns(uint) {
        return allowances[owner][spender];
    }

    //missing valid balance check - SC07
    /**
     * @dev Allows transfer of tokens through a 3rd party as long as allowance is given
     * @param _from The address where the tokens are deducted
     * @param _to The address where the tokens are added
     * @param _val How many tokens should be tranfered
     */
    function transferFrom(address _from, address _to, uint _val) validAllowance(_from, _val) public returns(bool) {
        balances[_from] -= _val;
        balances[_to] += _val;
        allowances[_from][msg.sender] -= _val;
        return true;
    }

    // No access control SC04 & SC01 via Reentrancy
    /**
     * @dev Adds tokens to totalSupply
     * @param _val How many tokens get added
     */
    function mint(uint _val) public {
        totalSupply += _val;
    }

    function burn(uint _val) public validBalance(_val) returns(bool) {
        totalSupply -= _val;
        balances[msg.sender] -= _val;
        return true;
    }

    function balanceOf(address usr) public view returns(uint256) {
        return balances[usr];
    }
}