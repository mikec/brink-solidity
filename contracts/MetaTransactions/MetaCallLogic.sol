pragma solidity ^0.5.2;

import "../Proxy/ProxyGettable.sol";
import "../MetaTransactions/MetaTxBase.sol";

contract MetaCallLogic is ProxyGettable, MetaTxBase {
  event CallExecuted(uint value, address indexed to, bytes data);
  event DelegateCallExecuted(address indexed to, bytes data);

  /**
   * executeCall function
   */

  function executeCall(
    bytes32 salt, uint8 v, bytes32 r, bytes32 s,
    uint value, address to, bytes memory data
  )
    public
  {
    address signer = _metaTx(
      salt,
      keccak256(abi.encodePacked(address(this), "executeCall", salt, value, to, data)),
      v, r, s
    );
    require(signer == proxyOwner(), "MetaCallLogic: executeCall signer is not proxyOwner");

    assembly {
      let result := call(gas, to, value, add(data, 0x20), mload(data), 0, 0)
      if eq(result, 0) {
        let ptr := mload(0x40)
        let size := returndatasize
        returndatacopy(ptr, 0, size)
        revert(ptr, size)
      }
    }

    emit CallExecuted(value, to, data);
  }

  /**
   * executeDelegateCall function
   */

  function executeDelegateCall(
    bytes32 salt, uint8 v, bytes32 r, bytes32 s,
    address to, bytes memory data
  )
    public
  {
    address signer = _metaTx(
      salt,
      keccak256(abi.encodePacked(address(this), "executeDelegateCall", salt, to, data)),
      v, r, s
    );
    require(signer == proxyOwner(), "MetaCallLogic: executeDelegateCall signer is not proxyOwner");

    assembly {
      let result := delegatecall(gas, to, add(data, 0x20), mload(data), 0, 0)
      if eq(result, 0) {
        let ptr := mload(0x40)
        let size := returndatasize
        returndatacopy(ptr, 0, size)
        revert(ptr, size)
      }
    }

    emit DelegateCallExecuted(to, data);
  }
}
