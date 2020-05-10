pragma solidity ^0.5.2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract IERC20Receiver {
  function receive(IERC20 token, uint amount) external returns (bool);
}
