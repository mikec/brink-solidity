const { web3 } = require('@openzeppelin/test-environment')
const { toBN: BN } = require('web3-utils')

async function calcGasFee(web3Tx) {
  const { tx, receipt } = web3Tx
  const gasPrice = BN((await web3.eth.getTransaction(tx)).gasPrice)
  const gasUsed = BN(receipt.gasUsed)
  const gasFee = gasUsed.mul(gasPrice)
  return gasFee
}

module.exports = calcGasFee
