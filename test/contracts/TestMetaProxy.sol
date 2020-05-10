pragma solidity ^0.5.2;

import '../../contracts/MetaTransactions/MetaCallLogic.sol';
import '../../contracts/Delegated/ProxyAdminDelegated.sol';

contract TestMetaProxy is MetaCallLogic, ProxyAdminDelegated { }
