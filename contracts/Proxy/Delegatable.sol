pragma solidity ^0.5.2;

/**
 * @title Delegatable
 * @dev Gives the possibility to delegate any call to a foreign implementation.
 */
contract Delegatable {
  // Storage position of the address of the current implementation
  bytes32 internal constant _implementationPosition = keccak256("Delegatable.implementation");

  /**
   * @dev Tells the address of the current implementation
   * @return address of the current implementation
   */
  function _implementation() internal view returns (address impl) {
    bytes32 position = _implementationPosition;
    assembly {
      impl := sload(position)
    }
  }

  /**
  * @dev Fallback function allowing to perform a delegatecall to the given implementation.
  * This function will return whatever the implementation call returns
  */
  function() external payable {
    address _impl = _implementation();
    require(_impl != address(0), "Delegatable: implementation address not set");

    assembly {
      let ptr := mload(0x40)
      calldatacopy(ptr, 0, calldatasize)
      let result := delegatecall(gas, _impl, ptr, calldatasize, 0, 0)
      let size := returndatasize
      returndatacopy(ptr, 0, size)

      switch result
      case 0 { revert(ptr, size) }
      default { return(ptr, size) }
    }
  }
}
