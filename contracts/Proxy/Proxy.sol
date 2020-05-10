pragma solidity ^0.5.2;

import "./ProxySettable.sol";
import "./Delegatable.sol";

/**
 * @title Proxy
 * @dev A proxy contract that is constructed with an implementation and a proxyOwner
 */
contract Proxy is ProxySettable, Delegatable {
  /**
  * @dev The constructor sets the implementation and proxyOwner.
  * @param implementation The address of the proxy implementation contract.
  * @param proxyOwner The address of the proxy owner.
  */
  constructor(address implementation, address proxyOwner) public {
    _setImplementation(implementation);
    _setProxyOwner(proxyOwner);
  }
}
