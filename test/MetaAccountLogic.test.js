const { accounts, web3 } = require('@openzeppelin/test-environment')
const web3Utils = require('web3-utils')
const { expect } = require('chai')
const { setupMetaAccount } = require('./helpers/setup')
const [ ethStoreAccount ] = accounts

describe('AccountLogic', function () {
  beforeEach(async function () {
    const { metaAccount } = await setupMetaAccount()
    this.metaAccount = metaAccount
  })

  describe('pay ETH to contract', function () {
    beforeEach(async function () {
      this.ethSendAmount = web3Utils.toBN(3)
      
      await web3.eth.sendTransaction({
        from: ethStoreAccount,
        to: this.metaAccount.address,
        value: this.ethSendAmount
      })
      
      this.receivedEthEvents = await this.metaAccount.contract.getPastEvents('ReceivedEth')
    })

    it('should emit a ReceivedEth event', async function () {
      expect(this.receivedEthEvents.length).to.be.equal(1)
      expect(this.receivedEthEvents[0].event).to.be.equal('ReceivedEth')
      expect(this.receivedEthEvents[0].returnValues.sender).to.be.equal(ethStoreAccount)
      expect(this.receivedEthEvents[0].returnValues.value).to.be.equal(this.ethSendAmount.toString())
    })

    it('should send ETH to MetaAccount contract', async function () {
      expect(await web3.eth.getBalance(this.metaAccount.address), 'wrong ETH balance for MetaAccount contract').to.be.bignumber.equal(this.ethSendAmount)
    })
  })
})
