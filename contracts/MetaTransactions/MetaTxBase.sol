pragma solidity ^0.5.2;

import "@openzeppelin/contracts/math/SafeMath.sol";

contract MetaTxBase {
  using SafeMath for uint;

  event MetaTransactionExecuted(address signer, bytes32 salt, bytes32 metaHash, uint8 v, bytes32 r, bytes32 s);

  function saltUsed(bytes32 salt) public view returns (bool) {
    return _saltUsed(salt);
  }

  function _saltUsed(bytes32 salt) internal view returns (bool used) {
    assembly {
      used := sload(salt)
    }
  }

  function _getSigner(bytes32 metaHash, uint8 v, bytes32 r, bytes32 s) internal pure returns (address signer) {
    signer = ecrecover(
      keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", metaHash)), v, r, s
    );
  }

  function _metaTx(bytes32 salt, bytes32 metaHash, uint8 v, bytes32 r, bytes32 s) internal returns (address signer) {
    require(!_saltUsed(salt), "MetaTxBase: _metaTx with used salt");
    _storeSalt(salt);

    signer = _getSigner(metaHash, v, r, s);

    emit MetaTransactionExecuted(signer, salt, metaHash, v, r, s);
  }

  function _storeSalt(bytes32 salt) internal {
    bool used = true;
    assembly {
      sstore(salt, used)
    }
  }
}
