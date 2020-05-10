pragma solidity ^0.5.2;

import "./IERC20Receiver.sol";

contract DirectTokenReceiver is IERC20Receiver {
  event DirectTransfer(IERC20 token, uint tokenAmount);

  address public _recipient;

  constructor(address recipient) public {
    _recipient = recipient;
  }

  function receive(IERC20 token, uint amount) external returns (bool) {
    require(token.transferFrom(msg.sender, _recipient, amount), "DirectTokenReceiver: token transferFrom failed");
    emit DirectTransfer(token, amount);
  }
}
