pragma solidity ^0.5.2;

import "../Proxy/ProxyGettable.sol";
import "../MetaTransactions/MetaTxBase.sol";

contract MetaCancelLogic is ProxyGettable, MetaTxBase {
  event CancelExecuted(bytes32 salt);

  /**
   * cancel function
   */

  function cancel(bytes32 salt, uint8 v, bytes32 r, bytes32 s)
    public
  {
    address signer = _metaTx(
      salt,
      keccak256(abi.encodePacked(address(this), "cancel", salt)),
      v, r, s
    );
    require(signer == proxyOwner(), "MetaCallLogic: cancel signer is not proxyOwner");

    emit CancelExecuted(salt);
  }
}
