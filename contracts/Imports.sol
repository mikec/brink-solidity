pragma solidity ^0.5.2;

import "@openzeppelin/contracts/token/ERC20/ERC20Mintable.sol";
import "../test/contracts/MockERC20Receiver.sol";
import "../test/contracts/MockExchangeAdapter_InsufficientTokenOut.sol";
import "../test/contracts/MockExchangeAdapter_SwapFail.sol";
import "../test/contracts/MockExchangeAdapter.sol";
import "../test/contracts/TestDelegated.sol";
import "../test/contracts/TestERC20.sol";
import "../test/contracts/TestFulfillSwap.sol";
import "../test/contracts/TestMetaDelegated.sol";
import "../test/contracts/TestMetaProxy.sol";
import "../test/contracts/TestToken_V0.sol";
import "../test/contracts/TestToken_V1.sol";

contract Imports { }
