pragma solidity ^0.5.2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract TestFulfillSwap {

  function fulfillTokenOutSwap(IERC20 tokenOut, uint tokenOutAmount) external payable {
    tokenOut.transfer(msg.sender, tokenOutAmount);
  }

  function fulfillEthOutSwap(uint ethOutAmount) external {
    bool success;
    (success, ) = address(msg.sender).call.value(ethOutAmount)("");
    require(success, "TestFulfillSwap: fulfillEthOutSwap send ether to msg.sender failed");
  }

  function() external payable {}
}