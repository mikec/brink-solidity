pragma solidity ^0.5.2;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "../../uniswap/interfaces/IUniswapFactory.sol";
import "../../uniswap/interfaces/IUniswapExchange.sol";
import "./IExchangeAdapter.sol";
import "./UniswapPriceGetter.sol";

contract UniswapWithExcessOutput is IExchangeAdapter, UniswapPriceGetter {
  using SafeMath for uint;

  event TokenToTokenSwapExecuted(IERC20 tokenIn, IERC20 tokenOut, uint tokenInAmount, uint tokenOutAmount, uint excessTokenOut);
  event EthToTokenSwapExecuted(IERC20 token, uint ethAmount, uint tokenAmount, uint excessToken);
  event TokenToEthSwapExecuted(IERC20 token, uint tokenAmount, uint ethAmount, uint excessEth);

  address payable public _excessRecipient;

  constructor(IUniswapFactory uniswapFactory, address payable excessRecipient) UniswapPriceGetter(uniswapFactory) public {
    _excessRecipient = excessRecipient;
  }

  function tokenToTokenSwapExcess(IERC20 tokenIn, IERC20 tokenOut, uint tokenInAmount, uint tokenOutAmount)
    external view
    returns (int excessTokenIn, int excessTokenOut)
  {
    excessTokenIn = 0;
    excessTokenOut = int(tokenToTokenInputPrice(tokenIn, tokenOut, tokenInAmount) - tokenOutAmount);
  }

  function ethToTokenSwapExcess(IERC20 token, uint ethAmount, uint tokenAmount)
    external view
    returns (int excessEth, int excessToken)
  {
    excessEth = 0;
    excessToken = int(ethToTokenInputPrice(token, ethAmount) - tokenAmount);
  }

  function tokenToEthSwapExcess(IERC20 token, uint tokenAmount, uint ethAmount)
    external view
    returns (int excessToken, int excessEth)
  {
    excessToken = 0;
    excessEth = int(tokenToEthInputPrice(token, tokenAmount) - ethAmount);
  }

  function tokenToTokenSwap(IERC20 tokenIn, IERC20 tokenOut, uint tokenInAmount, uint tokenOutAmount) external {
    IUniswapExchange uniswapExchange = IUniswapExchange(_uniswapFactory.getExchange(address(tokenIn)));

    // approve token to be spent by Uniswap exchange
    tokenIn.approve(address(uniswapExchange), tokenInAmount);

    // execute swap on Uniswap exchange contract for tokenOut
    // set minEthBought to 1
    uint tokenOutBought = uniswapExchange.tokenToTokenSwapInput(tokenInAmount, tokenOutAmount, 1, now, address(tokenOut));

    // transfer tokenOut amount to msg.sender
    tokenOut.transfer(msg.sender, tokenOutAmount);

    // transfer excess tokenOut to excessRecipient
    uint excessTokenOut = tokenOutBought.sub(tokenOutAmount);
    if (excessTokenOut > 0) {
      tokenOut.transfer(_excessRecipient, excessTokenOut);
    }

    emit TokenToTokenSwapExecuted(tokenIn, tokenOut, tokenInAmount, tokenOutAmount, excessTokenOut);
  }

  function ethToTokenSwap(IERC20 token, uint tokenAmount) external payable {
    IUniswapExchange uniswapExchange = IUniswapExchange(_uniswapFactory.getExchange(address(token)));

    // execute swap on Uniswap exchange contract for token
    uint tokensBought = uniswapExchange.ethToTokenSwapInput.value(msg.value)(tokenAmount, now);

    // transfer token amount to msg.sender
    token.transfer(msg.sender, tokenAmount);

    // transfer excess token to excessRecipient
    uint excessToken = tokensBought.sub(tokenAmount);
    if (excessToken > 0) {
      token.transfer(_excessRecipient, excessToken);
    }

    emit EthToTokenSwapExecuted(token, msg.value, tokenAmount, excessToken);
  }

  function tokenToEthSwap(IERC20 token, uint tokenAmount, uint ethAmount) external {
    IUniswapExchange uniswapExchange = IUniswapExchange(_uniswapFactory.getExchange(address(token)));

    // approve token to be spent by Uniswap exchange
    token.approve(address(uniswapExchange), tokenAmount);

    // execute swap on Uniswap exchange contract for token
    uint ethBought = uniswapExchange.tokenToEthSwapInput(tokenAmount, ethAmount, now);

    (bool success, ) = address(msg.sender).call.value(ethAmount)("");
    require(success, "UniswapWithExcessInput: ethToTokenSwap failed to send ether to msg.sender");

    // transfer excess ETH to excessRecipient
    uint excessEth = ethBought.sub(ethAmount);
    if (excessEth > 0) {
      (success, ) = _excessRecipient.call.value(excessEth)("");
      require(success, "UniswapWithExcessOutput: tokenToEthSwap failed to send excess ether");
    }

    emit TokenToEthSwapExecuted(token, tokenAmount, ethAmount, excessEth);
  }

  function () external payable {}
}
