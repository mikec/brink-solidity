pragma solidity ^0.5.2;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "../../uniswap/interfaces/IUniswapFactory.sol";
import "../../uniswap/interfaces/IUniswapExchange.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract UniswapPriceGetter {

  IUniswapFactory internal _uniswapFactory;

  constructor (IUniswapFactory uniswapFactory) public {
    _uniswapFactory = uniswapFactory;
  }

  function getUniswapFactory() external view returns (IUniswapFactory) {
    return _uniswapFactory;
  }

  function tokenToTokenInputPrice(
    IERC20 tokenIn,
    IERC20 tokenOut,
    uint tokenInAmount
  ) public view returns (uint tokenOutAmount) {
    IUniswapExchange tokenInExchange = IUniswapExchange(_uniswapFactory.getExchange(address(tokenIn)));
    IUniswapExchange tokenOutExchange = IUniswapExchange(_uniswapFactory.getExchange(address(tokenOut)));
    uint tokenInEthPrice = tokenInExchange.getTokenToEthInputPrice(tokenInAmount);
    tokenOutAmount = tokenOutExchange.getEthToTokenInputPrice(tokenInEthPrice);
  }

  function tokenToTokenOutputPrice(
    IERC20 tokenIn,
    IERC20 tokenOut,
    uint tokenOutAmount
  ) public view returns (uint tokenInAmount) {
    IUniswapExchange tokenInExchange = IUniswapExchange(_uniswapFactory.getExchange(address(tokenIn)));
    IUniswapExchange tokenOutExchange = IUniswapExchange(_uniswapFactory.getExchange(address(tokenOut)));
    require(tokenOutAmount < tokenOut.balanceOf(address(tokenOutExchange)), "tokenOutAmount must be less than exchange reserve");
    uint tokenOutEthPrice = tokenOutExchange.getEthToTokenOutputPrice(tokenOutAmount);
    tokenInAmount = tokenInExchange.getTokenToEthOutputPrice(tokenOutEthPrice);
  }

  function ethToTokenInputPrice(
    IERC20 token,
    uint ethInAmount
  ) public view returns (uint tokenOutAmount) {
    IUniswapExchange exchange = IUniswapExchange(_uniswapFactory.getExchange(address(token)));
    tokenOutAmount = exchange.getEthToTokenInputPrice(ethInAmount);
  }

  function ethToTokenOutputPrice(
    IERC20 token,
    uint tokenOutAmount
  ) public view returns (uint ethInAmount) {
    IUniswapExchange exchange = IUniswapExchange(_uniswapFactory.getExchange(address(token)));
    require(tokenOutAmount < token.balanceOf(address(exchange)), "tokenOutAmount must be less than exchange reserve");
    ethInAmount = exchange.getEthToTokenOutputPrice(tokenOutAmount);
  }

  function tokenToEthInputPrice(
    IERC20 token,
    uint tokenInAmount
  ) public view returns (uint ethOutAmount) {
    IUniswapExchange exchange = IUniswapExchange(_uniswapFactory.getExchange(address(token)));
    ethOutAmount = exchange.getTokenToEthInputPrice(tokenInAmount);
  }

  function tokenToEthOutputPrice(
    IERC20 token,
    uint ethOutAmount
  ) public view returns (uint tokenInAmount) {
    IUniswapExchange exchange = IUniswapExchange(_uniswapFactory.getExchange(address(token)));
    require(ethOutAmount < address(exchange).balance, "ethOutAmount must be less than exchange reserve");
    tokenInAmount = exchange.getTokenToEthOutputPrice(ethOutAmount);
  }
}
