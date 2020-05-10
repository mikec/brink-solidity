pragma solidity ^0.5.2;

import "../MetaTransactions/MetaSwapLogic.sol";
import "../MetaTransactions/MetaCallLogic.sol";
import "../MetaTransactions/MetaCancelLogic.sol";

contract AccountLogic is MetaSwapLogic, MetaCallLogic, MetaCancelLogic {
  event ReceivedEth(address sender, uint value);

  function() external payable {
    emit ReceivedEth(msg.sender, msg.value);
  }
}
