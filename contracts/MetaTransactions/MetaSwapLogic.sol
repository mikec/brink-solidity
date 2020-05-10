pragma solidity ^0.5.2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../Proxy/ProxyGettable.sol";
import "../MetaTransactions/MetaTxBase.sol";

contract MetaSwapLogic is ProxyGettable, MetaTxBase {
  event TokenToTokenSwapExecuted(address indexed to, bytes data, IERC20 tokenIn, IERC20 tokenOut, uint tokenInAmount, uint tokenOutAmount);
  event EthToTokenSwapExecuted(address indexed to, bytes data, IERC20 token, uint ethAmount, uint tokenAmount);
  event TokenToEthSwapExecuted(address indexed to, bytes data, IERC20 token, uint tokenAmount, uint ethAmount);

  /**
   * tokenToTokenSwap function
   */

  function tokenToTokenSwap(
    bytes32 salt, uint8 v, bytes32 r, bytes32 s,
    IERC20 tokenIn, IERC20 tokenOut, uint tokenInAmount, uint tokenOutAmount, uint expiryBlock,
    address to, bytes memory data
  )
    public
  {
    require(expiryBlock > block.number, "MetaSwapLogic: tokenToTokenSwap expiryBlock exceeded");

    // verify that message signer is the owner
    address signer = _metaTx(
      salt,
      keccak256(abi.encodePacked(address(this), "tokenToTokenSwap", salt, tokenIn, tokenOut, tokenInAmount, tokenOutAmount, expiryBlock)),
      v, r, s
    );
    require(signer == proxyOwner(), "MetaSwapLogic: tokenToTokenSwap signer is not proxyOwner");

    // store initial tokenOutBalance
    uint tokenOutBalance = tokenOut.balanceOf(address(this));

    // send token to execution contract
    tokenIn.transfer(to, tokenInAmount);

    // execute `data` on execution contract address `to`
    assembly {
      let result := call(gas, to, 0, add(data, 0x20), mload(data), 0, 0)
      if eq(result, 0) {
        let ptr := mload(0x40)
        let size := returndatasize
        returndatacopy(ptr, 0, size)
        revert(ptr, size)
      }
    }

    // calculate amount of tokenOut transferred to this contract
    uint tokenOutReceived = tokenOut.balanceOf(address(this)).sub(tokenOutBalance);

    // verify that enough tokenOut was received
    require(tokenOutReceived >= tokenOutAmount, "MetaSwapLogic: tokenToTokenSwap tokenOut received is less than allowed");

    emit TokenToTokenSwapExecuted(to, data, tokenIn, tokenOut, tokenInAmount, tokenOutAmount);
  }

  /**
   * ethToTokenSwap function
   */

  function ethToTokenSwap(
    bytes32 salt, uint8 v, bytes32 r, bytes32 s,
    IERC20 token, uint ethAmount, uint tokenAmount, uint expiryBlock,
    address to, bytes memory data
  )
    public
  {
    require(expiryBlock > block.number, "MetaSwapLogic: ethToTokenSwap expiryBlock exceeded");
    require(address(this).balance >= ethAmount, "MetaSwapLogic: ethToTokenSwap not enough ether");

    // verify that message signer is the owner
    address signer = _metaTx(
      salt,
      keccak256(abi.encodePacked(address(this), "ethToTokenSwap", salt, token, ethAmount, tokenAmount, expiryBlock)), v, r, s
    );
    require(signer == proxyOwner(), "MetaSwapLogic: ethToTokenSwap signer is not proxyOwner");

    // store initial tokenBalance
    uint tokenBalance = token.balanceOf(address(this));

    // execute `data` on execution contract address `to`
    assembly {
      let result := call(gas, to, ethAmount, add(data, 0x20), mload(data), 0, 0)
      if eq(result, 0) {
        let ptr := mload(0x40)
        let size := returndatasize
        returndatacopy(ptr, 0, size)
        revert(ptr, size)
      }
    }

    // calculate amount of token transferred to this contract
    uint tokenReceived = token.balanceOf(address(this)).sub(tokenBalance);

    // verify that enough token was received
    require(tokenReceived >= tokenAmount, "MetaSwapLogic: ethToTokenSwap token received is less than allowed");

    emit EthToTokenSwapExecuted(to, data, token, ethAmount, tokenAmount);
  }

  /**
   * tokenToEthSwap function
   */

  function tokenToEthSwap(
    bytes32 salt, uint8 v, bytes32 r, bytes32 s,
    IERC20 token, uint tokenAmount, uint ethAmount, uint expiryBlock,
    address to, bytes memory data
  )
    public
  {
    require(expiryBlock > block.number, "MetaSwapLogic: tokenToEthSwap expiryBlock exceeded");

    // verify that message signer is the owner
    address signer = _metaTx(
      salt,
      keccak256(abi.encodePacked(address(this), "tokenToEthSwap", salt, token, tokenAmount, ethAmount, expiryBlock)),
      v, r, s
    );
    require(signer == proxyOwner(), "MetaSwapLogic: tokenToEthSwap signer is not proxyOwner");

    // store initial ethBalance
    uint ethBalance = address(this).balance;

    // send token to execution contract
    token.transfer(to, tokenAmount);

    // execute `data` on execution contract address `to`
    assembly {
      let result := call(gas, to, 0, add(data, 0x20), mload(data), 0, 0)
      if eq(result, 0) {
        let ptr := mload(0x40)
        let size := returndatasize
        returndatacopy(ptr, 0, size)
        revert(ptr, size)
      }
    }

    // calculate amount of ether sent to this contract
    uint ethReceived = address(this).balance.sub(ethBalance);

    // verify that enough ether was received
    require(ethReceived >= ethAmount, "MetaSwapLogic: tokenToEthSwap ether received is less than allowed");

    emit TokenToEthSwapExecuted(to, data, token, tokenAmount, ethAmount);
  }
}
