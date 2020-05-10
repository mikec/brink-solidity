pragma solidity ^0.5.2;

import "./ProxySettable.sol";

/**
 * @title ProxyGettable
 * @dev Public getter functions for proxy contracts
 */
contract ProxyGettable {
  // Storage position of the address of the current implementation
  bytes32 internal constant _implementationPosition = keccak256("Delegatable.implementation");

  // Storage position of the owner of the contract
  bytes32 internal constant _proxyOwnerPosition = keccak256("Proxy.owner");

  /**
   * @dev Tells the address of the owner
   * @return the address of the owner
   */
  function proxyOwner() public view returns (address owner) {
    bytes32 position = _proxyOwnerPosition;
    assembly {
      owner := sload(position)
    }
  }

  /**
   * @dev Tells the address of the current implementation
   * @return address of the current implementation
   */
  function implementation() public view returns (address impl) {
    bytes32 position = _implementationPosition;
    assembly {
      impl := sload(position)
    }
  }
}
