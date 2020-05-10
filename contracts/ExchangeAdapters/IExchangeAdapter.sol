pragma solidity ^0.5.2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract IExchangeAdapter {
  function tokenToTokenSwapExcess(
    IERC20 tokenIn,
    IERC20 tokenOut,
    uint tokenInAmount,
    uint tokenOutAmount
  ) external view returns (int excessTokenIn, int excessTokenOut);

  function ethToTokenSwapExcess(
    IERC20 token,
    uint ethAmount,
    uint tokenAmount
  ) external view returns (int excessEth, int excessToken);

  function tokenToEthSwapExcess(
    IERC20 token,
    uint tokenAmount,
    uint ethAmount
  ) external view returns (int excessToken, int excessEth);

  function tokenToTokenInputPrice(
    IERC20 tokenIn,
    IERC20 tokenOut,
    uint tokenInAmount
  ) public view returns (uint tokenOutAmount);

  function tokenToTokenOutputPrice(
    IERC20 tokenIn,
    IERC20 tokenOut,
    uint tokenOutAmount
  ) public view returns (uint tokenInAmount);

  function ethToTokenInputPrice(
    IERC20 token,
    uint ethInAmount
  ) public view returns (uint tokenOutAmount);

  function ethToTokenOutputPrice(
    IERC20 token,
    uint tokenOutAmount
  ) public view returns (uint ethInAmount);

  function tokenToEthInputPrice(
    IERC20 token,
    uint tokenInAmount
  ) public view returns (uint ethOutAmount);

  function tokenToEthOutputPrice(
    IERC20 token,
    uint ethOutAmount
  ) public view returns (uint tokenInAmount);

  function tokenToTokenSwap(
    IERC20 tokenIn,
    IERC20 tokenOut,
    uint tokenInAmount,
    uint tokenOutAmount
  ) external;

  function ethToTokenSwap(
    IERC20 token,
    uint tokenAmount
  ) external payable;

  function tokenToEthSwap(
    IERC20 token,
    uint tokenAmount,
    uint ethAmount
  ) external;
}
