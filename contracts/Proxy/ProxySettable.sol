pragma solidity ^0.5.2;

/**
 * @title ProxySettable
 * @dev Internal setter functions for proxy contracts
 */
contract ProxySettable {
  // Storage position of the address of the current implementation
  bytes32 internal constant _implementationPosition = keccak256("Delegatable.implementation");

  // Storage position of the owner of the contract
  bytes32 internal constant _proxyOwnerPosition = keccak256("Proxy.owner");

  /**
   * @dev Sets the address of the current implementation
   * @param newImplementation address representing the new implementation to be set
   */
  function _setImplementation(address newImplementation) internal {
    bytes32 position = _implementationPosition;
    assembly {
      sstore(position, newImplementation)
    }
  }

  /**
   * @dev Sets the address of the owner
   */
  function _setProxyOwner(address newProxyOwner) internal {
    bytes32 position = _proxyOwnerPosition;
    assembly {
      sstore(position, newProxyOwner)
    }
  }
}