pragma solidity ^0.5.2;

import "../../contracts/ExchangeAdapters/IExchangeAdapter.sol";

contract MockExchangeAdapter_SwapFail is IExchangeAdapter {
  event DoNothing(IERC20 tokenIn, IERC20 tokenOut, uint tokenInAmount, uint tokenOutAmount);

  function swap(IERC20 tokenIn, IERC20 tokenOut, uint tokenInAmount, uint tokenOutAmount) external returns (bool) {
    // emit event with params to avoid compilation errors
    emit DoNothing(tokenIn, tokenOut, tokenInAmount, tokenOutAmount);

    return false;
  }
}