const { accounts, web3, contract } = require('@openzeppelin/test-environment')
const web3Utils = require('web3-utils')
const { expect } = require('chai')
const { constants, expectEvent } = require('@openzeppelin/test-helpers')
const { ZERO_ADDRESS } = constants
const encodeFunctionCall = require('./helpers/encodeFunctionCall')
const testMetaTxEndpoint = require('./helpers/testMetaTxEndpoint')
const { shouldBehaveLikeMetaTransaction } = require('./MetaTransaction.behavior.js')
const getBN = require('./helpers/getBN')
const { setupTokens, setupMetaAccount } = require('./helpers/setup')
const [ ethStoreAccount, b, transferRecipient, d, badAccount, f, metaAccountOwner ] = accounts

const TestDelegated = contract.fromArtifact('TestDelegated')
const TestMetaDelegated = contract.fromArtifact('TestMetaDelegated')

describe('MetaCallLogic', function () {
  beforeEach(async function () {
    const { tokenA, tokenB } = await setupTokens()
    const { metaAccount } = await setupMetaAccount()

    // use TestMetaDelegated here so all events/functions for MetaCallLogic and TestDelegated
    // are accessible on `this.metaAccount`
    this.metaAccount = await TestMetaDelegated.at(metaAccount.address)

    this.testDelegated = await TestDelegated.new()
    this.tokenA = tokenA
    this.tokenB = tokenB
  })

  describe('executeCall', function () {
    beforeEach(async function () {
      this.tokenAllocation = getBN(6)
      this.transferAmount = getBN(2)

      this.successCallData = encodeFunctionCall(
        'transfer',
        ['address', 'uint'],
        [transferRecipient, this.transferAmount.toString()]
      )

      this.failCallData = encodeFunctionCall(
        'transfer',
        ['address', 'uint'],
        [ZERO_ADDRESS, this.transferAmount.toString()]
      )

      this.metaBehavior_paramTypes = [ 'uint', 'address', 'bytes' ]
      this.metaBehavior_params = [ 0, this.tokenB.address, this.successCallData ]

      await this.tokenB.mint(this.metaAccount.address, this.tokenAllocation)
    })

    shouldBehaveLikeMetaTransaction({
      contract: 'metaAccount',
      method: 'executeCall',
      signer: metaAccountOwner
    })

    describe('when ether value for call is specified', function () {
      beforeEach(async function () {
        await web3.eth.sendTransaction({
          from: ethStoreAccount,
          to: this.metaAccount.address,
          value: this.transferAmount
        })
        this.transferReceipientStartingBalance = web3Utils.toBN(await web3.eth.getBalance(transferRecipient))
      })

      testMetaTxEndpoint.call(this, {
        contract: 'metaAccount',
        method: 'executeCall',
        paramTypes: [ 'uint', 'address', 'bytes' ],
        conditions: [{
          describe: 'when executing a call with ether value to an address with no contract code',
          signer: metaAccountOwner,
          paramsFn: function () { return [ this.transferAmount, transferRecipient, '0x' ] },
          testFn: function () {
            it('should transfer ether value', async function () {
              expect(web3Utils.toBN(await web3.eth.getBalance(transferRecipient))).to.be.bignumber.equal(this.transferReceipientStartingBalance.add(this.transferAmount))
            })

            it('should emit a CallExecuted event with the correct value', function () {
              expectEvent(this.receipt, 'CallExecuted', {
                value: this.transferAmount, to: transferRecipient, data: null
              })
            })
          }
        }]
      })
    })

    testMetaTxEndpoint.call(this, {
      contract: 'metaAccount',
      method: 'executeCall',
      paramTypes: [ 'uint', 'address', 'bytes' ],
      conditions: [
        {
          describe: 'when executing transfer() external call on an ERC20 contract using executeCall()',
          signer: metaAccountOwner,
          paramsFn: function () { return this.metaBehavior_params },
          testFn: function () {
            it('should execute successfully', async function () {
              expect(await this.tokenB.balanceOf(transferRecipient)).to.be.bignumber.equal(this.transferAmount)
            })

            it('should emit a CallExecuted event', function () {
              expectEvent(this.receipt, 'CallExecuted', {
                value: web3Utils.toBN(0), to: this.tokenB.address, data: this.successCallData
              })
            })
          }
        },
        {
          describe: 'when signer is not proxyOwner',
          signer: badAccount,
          paramsFn: function () { return this.metaBehavior_params },
          expectRevert: 'MetaCallLogic: executeCall signer is not proxyOwner'
        },
        {
          describe: 'when encoded call fails',
          signer: metaAccountOwner,
          paramsFn: function () { return [ 0, this.tokenB.address, this.failCallData ] },
          expectRevert: 'ERC20: transfer to the zero address'
        }
      ]
    })
  })

  describe('executeDelegateCall', function () {

    // TODO: add test for delegated function with a return value

    beforeEach(async function () {
      this.noReturnCallData = encodeFunctionCall('testNoReturn', [], [])
      this.returnCallData = encodeFunctionCall('testReturn', [], [])
      this.revertCallData = encodeFunctionCall('testRevert', ['bool'], [true])

      this.metaBehavior_paramTypes = [ 'address', 'bytes' ]
      this.metaBehavior_params = [ this.testDelegated.address, this.noReturnCallData ]
    })

    shouldBehaveLikeMetaTransaction({
      contract: 'metaAccount',
      method: 'executeDelegateCall',
      signer: metaAccountOwner
    })

    testMetaTxEndpoint.call(this, {
      contract: 'metaAccount',
      method: 'executeDelegateCall',
      paramTypes: [ 'address', 'bytes' ],
      conditions: [
        {
          describe: 'when executing a valid delegate call',
          signer: metaAccountOwner,
          paramsFn: function () { return this.metaBehavior_params },
          testFn: function () {
            it('should execute successfully', function () {
              expectEvent(this.receipt, 'ExecutedTestCall')
            })

            it('should emit a DelegateCallExecuted event', function () {
              expectEvent(this.receipt, 'DelegateCallExecuted', {
                to: this.testDelegated.address, data: this.noReturnCallData
              })
            })
          }
        },
        {
          describe: 'when signer is not proxyOwner',
          signer: badAccount,
          paramsFn: function () { return this.metaBehavior_params },
          expectRevert: 'MetaCallLogic: executeDelegateCall signer is not proxyOwner'
        },
        {
          describe: 'when encoded call fails',
          signer: metaAccountOwner,
          paramsFn: function () { return [ this.testDelegated.address, this.revertCallData ] },
          expectRevert: 'TestDelegated: reverted'
        }
      ]
    })
  })
})
