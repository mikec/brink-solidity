pragma solidity ^0.5.2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract IWETH is IERC20 {
    event Deposit(address indexed sender, uint value);
    event Withdrawal(address indexed receiver, uint value);
    function deposit() public payable;
    function withdraw(uint value) public;
}
