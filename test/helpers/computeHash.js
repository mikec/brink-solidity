const web3Utils = require('web3-utils')

function computeHash (accountAddress, method, salt, paramTypes, paramValues) {
  let soliditySha3Params = [
    { t: 'address', v: accountAddress },
    { t: 'string', v: method },
    { t: 'bytes32', v: salt }
  ]

  for (var i in paramTypes) {
    soliditySha3Params.push({ t: paramTypes[i], v: paramValues[i] })
  }

  return web3Utils.soliditySha3.apply(null, soliditySha3Params)
}

module.exports = computeHash
