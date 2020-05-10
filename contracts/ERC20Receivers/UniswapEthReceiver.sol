pragma solidity ^0.5.2;

import "../../uniswap/interfaces/IUniswapFactory.sol";
import "../../uniswap/interfaces/IUniswapExchange.sol";
import "./IERC20Receiver.sol";

contract UniswapEthReceiver is IERC20Receiver {
  event EthSwap(IERC20 token, uint tokenAmount, uint ethAmount);

  IUniswapFactory public _uniswapFactory;
  address public _recipient;

  constructor(IUniswapFactory uniswapFactory,address recipient) public {
    _uniswapFactory = uniswapFactory;
    _recipient = recipient;
  }

  function receive(IERC20 token, uint amount) external returns (bool) {
    require(token.transferFrom(msg.sender, address(this), amount), "UniswapEthReceiver: token transferFrom failed");
    IUniswapExchange uniswapExchange = IUniswapExchange(_uniswapFactory.getExchange(address(token)));
    uint ethBought = uniswapExchange.tokenToEthTransferInput(amount, 1, now, _recipient);
    emit EthSwap(token, amount, ethBought);
  }
}
