const { web3 } = require('@openzeppelin/test-environment')
const { toBN: BN } = require('web3-utils')
const { expect } = require('chai')

async function zeroBalanceTest (address) {
  await tokenBalanceTest(this.tokenA, address, BN(0))
  await tokenBalanceTest(this.tokenB, address, BN(0))
  await ethBalanceTest(address, BN(0))
}

async function tokenBalanceTest(token, address, balance) {
  expect(await token.balanceOf(address)).to.be.bignumber.equal(balance)
}

async function ethBalanceTest(address, balance) {
  expect(BN(await web3.eth.getBalance(address))).to.be.bignumber.equal(balance)
}

module.exports = {
  zeroBalanceTest,
  tokenBalanceTest,
  ethBalanceTest
}
