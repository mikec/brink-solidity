pragma solidity ^0.5.2;

import "../Proxy/ProxySettable.sol";
import "../Proxy/ProxyGettable.sol";

contract ProxyAdminDelegated is ProxyGettable, ProxySettable {
  /**
    * @dev This event will be emitted every time the implementation gets upgraded
    * @param impl representing the address of the upgraded implementation
    */
  event Upgraded(address indexed impl);

  /**
    * @dev Event to show ownership has been transferred
    * @param newOwner representing the address of the new owner
    */
  event OwnershipTransferred(address newOwner);

  /**
   * @dev Upgrades the implementation address
   * @param impl representing the address of the new implementation to be set
   */
  function upgradeTo(address impl) public {
    require(impl != address(0), "ProxyAdminDelegated: upgradeTo with zero address implementation");
    require(impl != implementation(), "ProxyAdminDelegated: upgradeTo with no change to implementation address");
    _setImplementation(impl);
    emit Upgraded(impl);
  }

  /**
   * @dev Transfers proxy ownership to a new owner address
   * @param newOwner the address of the new owner
   */
  function transferProxyOwnership(address newOwner) external {
    require(newOwner != address(0), "ProxyAdminDelegated: transferProxyOwnership with zero address for newOwner");
    _setProxyOwner(newOwner);
    emit OwnershipTransferred(newOwner);
  }
}
