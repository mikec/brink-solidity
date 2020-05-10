pragma solidity ^0.5.2;

contract TestDelegated {
  event ExecutedTestCall();

  bool private _called;

  function testNoReturn() external {
    _called = true;
    emit ExecutedTestCall();
  }

  function testReturn() external returns (uint num) {
    _called = true;
    num = 12345;
    emit ExecutedTestCall();
  }

  function testRevert(bool forceRevert) external {
    require(!forceRevert, "TestDelegated: reverted");
    _called = true;
    emit ExecutedTestCall();
  }

}