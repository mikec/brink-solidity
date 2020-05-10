pragma solidity ^0.5.2;

import "../Proxy/Proxy.sol";

contract Account is Proxy {
  constructor (address implementation, address owner)
    Proxy(implementation, owner)
    public
  { }
}
