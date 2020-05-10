pragma solidity ^0.5.2;

import './TestToken_V0.sol';

/**
 * @title TestToken_V1
 * @dev Version 1 of a token to show upgradeability.
 * The idea here is to extend a token behaviour providing burnable functionalities
 * in addition to what's provided in version 0
 */
contract TestToken_V1 is TestToken_V0 {
  event Burn(address indexed burner, uint256 value);

  function burn(uint256 value) public {
    require(balanceOf(msg.sender) >= value, "TestToken_V1: burn msg.sender has insufficient balance");
    _balances[msg.sender] = _balances[msg.sender].sub(value);
    _totalSupply = _totalSupply.sub(value);
    emit Burn(msg.sender, value);
  }
}