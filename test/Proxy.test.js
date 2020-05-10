const { accounts, contract, web3 } = require('@openzeppelin/test-environment')
const web3Utils = require('web3-utils')
const { expect } = require('chai')
const { constants, expectEvent, expectRevert } = require('@openzeppelin/test-helpers')
const { ZERO_ADDRESS } = constants
const encodeFunctionCall = require('./helpers/encodeFunctionCall')
const testMetaTxEndpoint = require('./helpers/testMetaTxEndpoint')
const { setupTokens, setupMockERC20Receiver } = require('./helpers/setup')
const { execMetaTx, generateSalt } = require('./helpers/metaTx')
const [ a, proxyOwner, tokenOwner, anotherAccount, proxyDeployer ] = accounts

const Proxy = contract.fromArtifact('Proxy')
const ProxyAdminDelegated = contract.fromArtifact('ProxyAdminDelegated')
const TestMetaProxy = contract.fromArtifact('TestMetaProxy')
const MetaCallLogic = contract.fromArtifact('MetaCallLogic')
const TestToken_V0 = contract.fromArtifact('TestToken_V0')
const TestToken_V1 = contract.fromArtifact('TestToken_V1')

describe('Proxy using MetaCallLogic and ProxyAdminDelegated functions', function () {

  // Test a Proxy that uses a MetaCallLogic implementation to `executeDelegateCall` to admin
  // functions on a ProxyAdminDelegated instance

  beforeEach(async function () {
    const { tokenA } = await setupTokens()
    this.mockERC20Receiver = await setupMockERC20Receiver()
    this.tokenA = tokenA
    this.proxyAdminDelegated = await ProxyAdminDelegated.new()
    this.impl_init = await MetaCallLogic.new()
    this.impl_v0 = await TestToken_V0.new()
    this.impl_v1 = await TestToken_V1.new()
    const proxy = await Proxy.new(this.impl_init.address, proxyOwner, { from: proxyDeployer })

    // use TestMetaProxy here so all events/functions for MetaCallLogic and ProxyAdminDelegated
    // are accessible on `this.proxy`
    this.proxy = await TestMetaProxy.at(proxy.address)

    this.token_v0 = await TestToken_V0.at(this.proxy.address)
    this.token_v1 = await TestToken_V1.at(this.proxy.address)
  })

  describe('constructor', function () {
    it('should set proxyOwner', async function () {
      const owner = await this.proxy.proxyOwner()
      expect(owner).to.be.equal(proxyOwner)
    })
    it('should set implementation', async function () {
      const owner = await this.proxy.implementation()
      expect(owner).to.be.equal(this.impl_init.address)
    })
  })

  describe('transfer ownership', function () {
    const newOwner = anotherAccount

    beforeEach(async function () {
      this.successCallData = encodeFunctionCall('transferProxyOwnership', ['address'], [newOwner])
      this.zeroAddressOwnerCallData = encodeFunctionCall('transferProxyOwnership', ['address'], [ZERO_ADDRESS])
    })

    testMetaTxEndpoint.call(this, {
      contract: 'proxy',
      method: 'executeDelegateCall',
      paramTypes: [ 'address', 'bytes' ],
      conditions: [
        {
          describe: 'when tx succeeds',
          signer: proxyOwner,
          paramsFn: function () {
            return [ this.proxyAdminDelegated.address, this.successCallData ]
          },
          testFn: function () {
            it('transfers the ownership', async function () {
              const owner = await this.proxy.proxyOwner()
              expect(owner).to.be.equal(newOwner)
            })
      
            it('emits an OwnershipTransferred event', async function () {
              expectEvent(this.receipt, 'OwnershipTransferred', { newOwner })
            })
          }
        },
        {
          describe: 'when the new proposed owner is the zero address',
          signer: proxyOwner,
          paramsFn: function () {
            return [ this.proxyAdminDelegated.address, this.zeroAddressOwnerCallData ]
          },
          expectRevert: 'ProxyAdminDelegated: transferProxyOwnership with zero address for newOwner'
        }
      ]
    })
  })

  describe('upgrade implementation', function () {
    beforeEach(async function () {
      this.successCallData = encodeFunctionCall('upgradeTo', ['address'], [this.impl_v0.address])
      this.zeroAddressImplCallData = encodeFunctionCall('upgradeTo', ['address'], [ZERO_ADDRESS])
      this.unchangedImplCallData = encodeFunctionCall('upgradeTo', ['address'], [this.impl_init.address])
    })

    testMetaTxEndpoint.call(this, {
      contract: 'proxy',
      method: 'executeDelegateCall',
      paramTypes: [ 'address', 'bytes' ],
      conditions: [
        {
          describe: 'when the given implementation is different than the current one',
          signer: proxyOwner,
          paramsFn: function () {
            return [ this.proxyAdminDelegated.address, this.successCallData ]
          },
          testFn: function () {
            it('upgrades to the given implementation', async function () {
              const implementation = await this.proxy.implementation()
              expect(implementation).to.be.equal(this.impl_v0.address)
            })
          }
        },
        {
          describe: 'when the given implementation is equal to the current one',
          signer: proxyOwner,
          paramsFn: function () {
            return [ this.proxyAdminDelegated.address, this.unchangedImplCallData ]
          },
          expectRevert: 'ProxyAdminDelegated: upgradeTo with no change to implementation address'
        },
        {
          describe: 'when the given implementation is a zero address',
          signer: proxyOwner,
          paramsFn: function () {
            return [ this.proxyAdminDelegated.address, this.zeroAddressImplCallData ]
          },
          expectRevert: 'ProxyAdminDelegated: upgradeTo with zero address implementation'
        }
      ]
    })
  })

  describe('delegatecall', function () {
    const sender = anotherAccount

    beforeEach(async function () {
      const upgradeCallData = encodeFunctionCall(
        'upgradeTo', ['address'], [this.impl_v0.address]
      )
      await execMetaTx({
        web3,
        contract: this.proxy,
        method: 'executeDelegateCall',
        salt: generateSalt(),
        signer: proxyOwner,
        paramTypes: [ 'address', 'bytes' ],
        params: [ this.proxyAdminDelegated.address, upgradeCallData ]
      })

      // setting owner in an unsigned public tx wouldn't be safe, just
      // doing this to setup tests
      const tkn0 = await TestToken_V0.at(this.proxy.address)
      await tkn0.initialize(tokenOwner)
    })

    describe('when there were no further upgrades', function () {
      it('delegates calls to the initial implementation', async function() {
        await this.token_v0.mint(sender, web3Utils.toBN(100), { from: tokenOwner })

        const balance = await this.token_v0.balanceOf(sender)
        expect(balance).to.be.bignumber.equal(web3Utils.toBN(100))

        const totalSupply = await this.token_v0.totalSupply()
        expect(totalSupply).to.be.bignumber.equal(web3Utils.toBN(100))
      })

      it('fails when trying to call an unknown function of the current implementation', async function () {
        await this.token_v0.mint(sender, web3Utils.toBN(100), { from: tokenOwner })

        await expectRevert(
          this.token_v1.burn(web3Utils.toBN(20), { from: tokenOwner }),
          'revert'
        )
      })
    })

    describe('when there was another upgrade', function () {
      beforeEach(async function () {
        const upgradeCallData = encodeFunctionCall(
          'upgradeTo', ['address'], [this.impl_v1.address]
        )
        await this.token_v0.mint(sender, web3Utils.toBN(100), { from: tokenOwner })
        await execMetaTx({
          web3,
          contract: this.proxy,
          method: 'executeDelegateCall',
          salt: generateSalt(),
          signer: proxyOwner,
          paramTypes: [ 'address', 'bytes' ],
          params: [ this.proxyAdminDelegated.address, upgradeCallData ]
        })
      })

      it('delegates calls to the last upgraded implementation', async function() {
        await this.token_v1.mint(sender, web3Utils.toBN(20), { from: tokenOwner })
        await expectRevert(
          this.token_v1.mint(sender, web3Utils.toBN(20), { from: sender }),
          'TestOwnable: msg.sender is not owner'
        )
        await this.token_v1.burn(web3Utils.toBN(40), { from: sender })

        const balance = await this.token_v1.balanceOf(sender)
        expect(balance).to.be.bignumber.equal(web3Utils.toBN(80))

        const totalSupply = await this.token_v1.totalSupply()
        expect(totalSupply).to.be.bignumber.equal(web3Utils.toBN(80))
      })
    })
  })
})
