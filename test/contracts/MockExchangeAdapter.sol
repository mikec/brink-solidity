pragma solidity ^0.5.2;

import "../../contracts/ExchangeAdapters/IExchangeAdapter.sol";

contract MockExchangeAdapter is IExchangeAdapter {
  function swap(IERC20 tokenIn, IERC20 tokenOut, uint tokenInAmount, uint tokenOutAmount) external returns (bool) {
    require(tokenIn.transferFrom(msg.sender, address(this), tokenInAmount), "MockExchangeAdapter: tokenIn transferFrom failed");
    require(tokenOut.transfer(msg.sender, tokenOutAmount), "MockExchangeAdapter: tokenOut transfer failed");
    return true;
  }
}