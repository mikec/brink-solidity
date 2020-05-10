pragma solidity ^0.5.2;

import "../../contracts/ERC20Receivers/IERC20Receiver.sol";

contract MockERC20Receiver is IERC20Receiver {
  event MockEvent_ERC20Received(IERC20 token, uint amount);

  function receive(IERC20 token, uint amount) external returns (bool) {
    require(token.transferFrom(msg.sender, address(this), amount), "MockERC20Receiver: token transferFrom failed");
    emit MockEvent_ERC20Received(token, amount);
  }
}
