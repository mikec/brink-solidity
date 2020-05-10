const web3Abi = require('web3-eth-abi')

function encodeFunctionCall (functionName, paramTypes = [], params = []) {
  const types = paramTypes.map((t) => t == 'uint' ? 'uint256' : t)
  const fnSig = `${functionName}(${types.join(',')})`
  const encodedFnSig = web3Abi.encodeFunctionSignature(fnSig).slice(2)
  const callData = web3Abi.encodeParameters(types, params).slice(2)
  return `0x${encodedFnSig}${callData}`
}

module.exports = encodeFunctionCall
