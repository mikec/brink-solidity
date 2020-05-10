pragma solidity ^0.5.2;

import "../../contracts/ExchangeAdapters/IExchangeAdapter.sol";

contract MockExchangeAdapter_InsufficientTokenOut is IExchangeAdapter {
  event DoNothing(IERC20 tokenIn, IERC20 tokenOut, uint tokenInAmount, uint tokenOutAmount);

  function swap(IERC20 tokenIn, IERC20 tokenOut, uint tokenInAmount, uint tokenOutAmount) external returns (bool) {
    require(tokenIn.transferFrom(msg.sender, address(this), tokenInAmount), "MockExchangeAdapter: tokenIn transferFrom failed");

    // doesn't transfer enough tokenOut to the sender
    require(tokenOut.transfer(msg.sender, 1), "MockExchangeAdapter: tokenOut transfer failed");

    // emit event with params to avoid compilation errors
    emit DoNothing(tokenIn, tokenOut, tokenInAmount, tokenOutAmount);

    return true;
  }
}