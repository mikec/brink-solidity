pragma solidity ^0.5.2;

import '@openzeppelin/contracts/token/ERC20/ERC20Detailed.sol';
import '@openzeppelin/contracts/token/ERC20/ERC20Mintable.sol';

/**
 * @title TestERC20
 * @dev mintable and detailed ERC20 for test deployment only
 */
contract TestERC20 is ERC20Detailed, ERC20Mintable {
  constructor (string memory name, string memory symbol, uint8 decimals)
    ERC20Detailed(name, symbol, decimals)
    public
  { }
}
