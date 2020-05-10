pragma solidity ^0.5.2;

import "../../uniswap/interfaces/IUniswapFactory.sol";
import "../../uniswap/interfaces/IUniswapExchange.sol";
import "./IERC20Receiver.sol";

contract UniswapTokenReceiver is IERC20Receiver {
  event TokenSwap(IERC20 token, uint tokenAmount, uint baseTokenAmount);

  IUniswapFactory public _uniswapFactory;
  address public _baseTokenAddress;
  address public _recipient;

  constructor(IUniswapFactory uniswapFactory, address baseTokenAddress, address recipient) public {
    _uniswapFactory = uniswapFactory;
    _baseTokenAddress = baseTokenAddress;
    _recipient = recipient;
  }

  function receive(IERC20 token, uint amount) external returns (bool) {
    require(token.transferFrom(msg.sender, address(this), amount), "UniswapTokenReceiver: token transferFrom failed");
    IUniswapExchange uniswapExchange = IUniswapExchange(_uniswapFactory.getExchange(address(token)));
    uint tokensBought = uniswapExchange.tokenToTokenTransferInput(amount, 1, 1, now, _recipient, _baseTokenAddress);
    emit TokenSwap(token, amount, tokensBought);
  }
}
