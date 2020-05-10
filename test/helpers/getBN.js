const web3Utils = require('web3-utils')

module.exports = (ethAmount) => {
  return web3Utils.toBN(ethAmount + '0'.repeat(18))
}
