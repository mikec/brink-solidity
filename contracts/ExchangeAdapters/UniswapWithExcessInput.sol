pragma solidity ^0.5.2;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "../../uniswap/interfaces/IUniswapFactory.sol";
import "../../uniswap/interfaces/IUniswapExchange.sol";
import "./IExchangeAdapter.sol";
import "./UniswapPriceGetter.sol";

contract UniswapWithExcessInput is IExchangeAdapter, UniswapPriceGetter {
  using SafeMath for uint;

  event TokenToTokenSwapExecuted(IERC20 tokenIn, IERC20 tokenOut, uint tokenInAmount, uint tokenOutAmount, uint excessTokenIn);
  event EthToTokenSwapExecuted(IERC20 token, uint ethAmount, uint tokenAmount, uint excessEth);
  event TokenToEthSwapExecuted(IERC20 token, uint tokenAmount, uint ethAmount, uint excessToken);

  uint constant MAX_UINT = 2**256 - 1;
  address payable private _excessRecipient;

  constructor(IUniswapFactory uniswapFactory, address payable excessRecipient) UniswapPriceGetter(uniswapFactory) public {
    _excessRecipient = excessRecipient;
  }

  function getExcessRecipient() external view returns (address) {
    return _excessRecipient;
  }

  function tokenToTokenSwapExcess(IERC20 tokenIn, IERC20 tokenOut, uint tokenInAmount, uint tokenOutAmount)
    external view
    returns (int excessTokenIn, int excessTokenOut)
  {
    excessTokenIn = int(tokenInAmount - tokenToTokenOutputPrice(tokenIn, tokenOut, tokenOutAmount));
    excessTokenOut = 0;
  }

  function ethToTokenSwapExcess(IERC20 token, uint ethAmount, uint tokenAmount)
    external view
    returns (int excessEth, int excessToken)
  {
    excessEth = int(ethAmount - ethToTokenOutputPrice(token, tokenAmount));
    excessToken = 0;
  }

  function tokenToEthSwapExcess(IERC20 token, uint tokenAmount, uint ethAmount)
    external view
    returns (int excessToken, int excessEth)
  {
    excessToken = int(tokenAmount - tokenToEthOutputPrice(token, ethAmount));
    excessEth = 0;
  }

  function tokenToTokenSwap(IERC20 tokenIn, IERC20 tokenOut, uint tokenInAmount, uint tokenOutAmount) external {
    IUniswapExchange uniswapExchange = IUniswapExchange(_uniswapFactory.getExchange(address(tokenIn)));

    // approve token to be spent by Uniswap exchange
    tokenIn.approve(address(uniswapExchange), tokenInAmount);

    // execute swap on Uniswap exchange contract for tokenIn
    // set max_eth_sold to MAX_UINT
    uint tokenInSold = uniswapExchange.tokenToTokenTransferOutput(tokenOutAmount, tokenInAmount, MAX_UINT, now, msg.sender, address(tokenOut));

    // transfer excess tokenIn to excessRecipient
    uint excessTokenIn = tokenInAmount.sub(tokenInSold);
    if (excessTokenIn > 0) {
      tokenIn.transfer(_excessRecipient, excessTokenIn);
    }

    emit TokenToTokenSwapExecuted(tokenIn, tokenOut, tokenInAmount, tokenOutAmount, excessTokenIn);
  }

  function ethToTokenSwap(IERC20 token, uint tokenAmount) external payable {
    IUniswapExchange uniswapExchange = IUniswapExchange(_uniswapFactory.getExchange(address(token)));

    // execute transfer on Uniswap exchange contract for token to msg.sender
    uint ethSold = uniswapExchange.ethToTokenTransferOutput.value(msg.value)(tokenAmount, now, msg.sender);

    // transfer excess ETH to excessRecipient
    uint excessEth = msg.value.sub(ethSold);
    if (excessEth > 0) {
      (bool success, ) = _excessRecipient.call.value(excessEth)("");
      require(success, "UniswapWithExcessInput: ethToTokenSwap failed to send excess ether");
    }

    emit EthToTokenSwapExecuted(token, msg.value, tokenAmount, excessEth);
  }

  function tokenToEthSwap(IERC20 token, uint tokenAmount, uint ethAmount) external {
    IUniswapExchange uniswapExchange = IUniswapExchange(_uniswapFactory.getExchange(address(token)));

    // approve token to be spent by Uniswap exchange
    token.approve(address(uniswapExchange), tokenAmount);

    // execute swap on Uniswap exchange contract for token
    uint tokensSold = uniswapExchange.tokenToEthTransferOutput(ethAmount, tokenAmount, now, msg.sender);

    // transfer excess token to excessRecipient
    uint excessToken = tokenAmount.sub(tokensSold);
    if (excessToken > 0) {
      token.transfer(_excessRecipient, excessToken);
    }

    emit TokenToEthSwapExecuted(token, tokenAmount, ethAmount, excessToken);
  }

  function () external payable {}
}
