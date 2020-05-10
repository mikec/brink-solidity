pragma solidity ^0.5.2;

contract ContractDeployer {
  event Deployed(address contractAddress);

  function getAddress(bytes memory code, bytes32 salt) public view returns (address) {
    bytes32 addr = keccak256(abi.encodePacked(
      uint8(0xff),
      address(this),
      salt,
      keccak256(code)
    ));
    return address(uint160(uint(addr)));
  }

  function deploy(bytes memory code, bytes32 salt) public returns (address) {
    address contractAddress;

    assembly {
      contractAddress := create2(0, add(code, 0x20), mload(code), salt)
    }

    require(contractAddress != address(0), "ContractDeployer: create2 returned zero address");

    emit Deployed(contractAddress);
  }
}
