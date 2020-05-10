const { web3, accounts, contract } = require('@openzeppelin/test-environment')
const { toBN: BN } = require('web3-utils')
const { expect } = require('chai')
const { expectEvent, time } = require('@openzeppelin/test-helpers')
const encodeFunctionCall = require('./helpers/encodeFunctionCall')
const testMetaTxEndpoint = require('./helpers/testMetaTxEndpoint')
const { shouldBehaveLikeMetaTransaction } = require('./MetaTransaction.behavior.js')
const getBN = require('./helpers/getBN')
const { setupTokens, setupMetaAccount } = require('./helpers/setup')
const [ ethStoreAccount, b, c, d, badAccount, f, metaAccountOwner ] = accounts

const TestFulfillSwap = contract.fromArtifact('TestFulfillSwap')

describe('MetaSwapLogic', function () {
  beforeEach(async function () {
    const { tokenA, tokenB } = await setupTokens()
    const { metaAccount } = await setupMetaAccount()
    this.testFulfillSwap = await TestFulfillSwap.new()
    this.metaAccount = metaAccount
    this.tokenA = tokenA
    this.tokenB = tokenB

    this.latestBlock = await time.latestBlock()
    this.expiryBlock = this.latestBlock.add(BN(1000)) // 1,000 blocks from now
    this.expiredBlock = this.latestBlock.sub(BN(1)) // 1 block ago
  })

  describe('tokenToTokenSwap', function () {
    beforeEach(async function () {
      this.tokenASwapAmount = getBN(2)
      this.tokenBSwapAmount = getBN(4)
      await this.tokenA.mint(this.metaAccount.address, this.tokenASwapAmount)
      await this.tokenB.mint(this.testFulfillSwap.address, this.tokenBSwapAmount)

      this.successCallData = encodeFunctionCall(
        'fulfillTokenOutSwap',
        ['address', 'uint'],
        [
          this.tokenB.address,
          this.tokenBSwapAmount.toString()
        ]
      )

      this.failCallData = encodeFunctionCall(
        'fulfillTokenOutSwap',
        ['address', 'uint'],
        [
          this.tokenB.address,
          // fail when trying to transfer more Token B than the TestFulfillSwap contract has
          this.tokenBSwapAmount.mul(BN(2)).toString()
        ]
      )

      this.notEnoughTokenCallData = encodeFunctionCall(
        'fulfillTokenOutSwap',
        ['address', 'uint'],
        [
          this.tokenB.address,
          // fail when trying to transfer less than the signed call requires
          this.tokenBSwapAmount.sub(BN(1)).toString()
        ]
      )

      this.metaBehavior_unsignedParams = [
        this.testFulfillSwap.address,
        this.successCallData
      ]
      this.metaBehavior_paramTypes = [ 'address', 'address', 'uint', 'uint', 'uint' ]
      this.metaBehavior_params = [
        this.tokenA.address,
        this.tokenB.address,
        this.tokenASwapAmount,
        this.tokenBSwapAmount,
        this.expiryBlock
      ]
    })

    shouldBehaveLikeMetaTransaction({
      contract: 'metaAccount',
      method: 'tokenToTokenSwap',
      signer: metaAccountOwner
    })

    testMetaTxEndpoint.call(this, {
      contract: 'metaAccount',
      method: 'tokenToTokenSwap',
      paramTypes: [ 'address', 'address', 'uint', 'uint', 'uint' ],
      conditions: [
        {
          describe: 'when given a valid tokenToTokenSwap signature and call',
          signer: metaAccountOwner,
          unsignedParamsFn: function () {
            return [ 
              this.testFulfillSwap.address,
              this.successCallData
            ]
          },
          paramsFn: function () { return this.metaBehavior_params },
          testFn: function () {
            it('should execute successfully', async function () {
              expect(await this.tokenA.balanceOf(this.metaAccount.address)).to.be.bignumber.equal(BN(0))
              expect(await this.tokenB.balanceOf(this.metaAccount.address)).to.be.bignumber.equal(this.tokenBSwapAmount)
              expect(await this.tokenA.balanceOf(this.testFulfillSwap.address)).to.be.bignumber.equal(this.tokenASwapAmount)
              expect(await this.tokenB.balanceOf(this.testFulfillSwap.address)).to.be.bignumber.equal(BN(0))
            })

            it('should emit a TokenToTokenSwapExecuted event', function () {
              expectEvent(this.receipt, 'TokenToTokenSwapExecuted', {
                to: this.testFulfillSwap.address,
                data: this.successCallData,
                tokenIn: this.tokenA.address,
                tokenOut: this.tokenB.address,
                tokenInAmount: this.tokenASwapAmount,
                tokenOutAmount: this.tokenBSwapAmount
              })
            })
          }
        },
        {
          describe: 'when signer is not proxy owner',
          signer: badAccount,
          unsignedParamsFn: function () {
            return [ 
              this.testFulfillSwap.address,
              this.successCallData
            ]
          },
          paramsFn: function () { return this.metaBehavior_params },
          expectRevert: 'MetaSwapLogic: tokenToTokenSwap signer is not proxyOwner'
        },
        {
          describe: 'when the unsigned call fails',
          signer: metaAccountOwner,
          unsignedParamsFn: function () {
            return [ 
              this.testFulfillSwap.address,
              this.failCallData
            ]
          },
          paramsFn: function () { return this.metaBehavior_params },
          expectRevert: 'ERC20: transfer amount exceeds balance'
        },
        {
          describe: 'when the unsigned call transfer is insufficient',
          signer: metaAccountOwner,
          unsignedParamsFn: function () {
            return [ 
              this.testFulfillSwap.address,
              this.notEnoughTokenCallData
            ]
          },
          paramsFn: function () { return this.metaBehavior_params },
          expectRevert: 'MetaSwapLogic: tokenToTokenSwap tokenOut received is less than allowed'
        },
        {
          describe: 'when expiryBlock has been mined',
          signer: metaAccountOwner,
          unsignedParamsFn: function () {
            return [ 
              this.testFulfillSwap.address,
              this.successCallData
            ]
          },
          paramsFn: function () {
            const expiredBlockParams = [...this.metaBehavior_params]
            expiredBlockParams[4] = this.expiredBlock
            return expiredBlockParams
          },
          expectRevert: 'MetaSwapLogic: tokenToTokenSwap expiryBlock exceeded'
        }
      ]
    })
  })

  describe('ethToTokenSwap', function () {
    beforeEach(async function () {
      this.ethSwapAmount = getBN(2)
      this.tokenASwapAmount = getBN(4)

      // 2 calls needed for the used salt revert test, so send enough eth for both
      this.metaAccountInitialEthBalance = this.ethSwapAmount.mul(BN(2))

      await web3.eth.sendTransaction({
        from: ethStoreAccount,
        to: this.metaAccount.address,
        value: this.metaAccountInitialEthBalance
      })
      await this.tokenA.mint(this.testFulfillSwap.address, this.tokenASwapAmount)

      this.successCallData = encodeFunctionCall(
        'fulfillTokenOutSwap',
        ['address', 'uint'],
        [
          this.tokenA.address,
          this.tokenASwapAmount.toString()
        ]
      )

      this.failCallData = encodeFunctionCall(
        'fulfillTokenOutSwap',
        ['address', 'uint'],
        [
          this.tokenA.address,
          // fail when trying to transfer more Token A than the TestFulfillSwap contract has
          this.tokenASwapAmount.mul(BN(2)).toString()
        ]
      )

      this.notEnoughTokenCallData = encodeFunctionCall(
        'fulfillTokenOutSwap',
        ['address', 'uint'],
        [
          this.tokenA.address,
          // fail when trying to transfer less than the signed call requires
          this.tokenASwapAmount.sub(BN(1)).toString()
        ]
      )

      this.metaBehavior_unsignedParams = [
        this.testFulfillSwap.address,
        this.successCallData
      ]
      this.metaBehavior_paramTypes = [ 'address', 'uint', 'uint', 'uint' ]
      this.metaBehavior_params = [
        this.tokenA.address,
        this.ethSwapAmount,
        this.tokenASwapAmount,
        this.expiryBlock
      ]
    })

    shouldBehaveLikeMetaTransaction({
      contract: 'metaAccount',
      method: 'ethToTokenSwap',
      signer: metaAccountOwner
    })

    testMetaTxEndpoint.call(this, {
      contract: 'metaAccount',
      method: 'ethToTokenSwap',
      paramTypes: [ 'address', 'uint', 'uint', 'uint' ],
      conditions: [
        {
          describe: 'when given a valid ethToTokenSwap signature and call',
          signer: metaAccountOwner,
          unsignedParamsFn: function () {
            return [ 
              this.testFulfillSwap.address,
              this.successCallData
            ]
          },
          paramsFn: function () { return this.metaBehavior_params },
          testFn: function () {
            it('should execute successfully', async function () {
              expect(BN(await web3.eth.getBalance(this.metaAccount.address))).to.be.bignumber.equal(this.metaAccountInitialEthBalance.sub(this.ethSwapAmount))
              expect(await this.tokenA.balanceOf(this.metaAccount.address)).to.be.bignumber.equal(this.tokenASwapAmount)
              expect(BN(await web3.eth.getBalance(this.testFulfillSwap.address))).to.be.bignumber.equal(this.ethSwapAmount)
              expect(await this.tokenA.balanceOf(this.testFulfillSwap.address)).to.be.bignumber.equal(BN(0))
            })

            it('should emit a EthToTokenSwapExecuted event', function () {
              expectEvent(this.receipt, 'EthToTokenSwapExecuted', {
                to: this.testFulfillSwap.address,
                data: this.successCallData,
                token: this.tokenA.address,
                ethAmount: this.ethSwapAmount,
                tokenAmount: this.tokenASwapAmount
              })
            })
          }
        },
        {
          describe: 'when signer is not proxy owner',
          signer: badAccount,
          unsignedParamsFn: function () {
            return [ 
              this.testFulfillSwap.address,
              this.successCallData
            ]
          },
          paramsFn: function () { return this.metaBehavior_params },
          expectRevert: 'MetaSwapLogic: ethToTokenSwap signer is not proxyOwner'
        },
        {
          describe: 'when eth send call fails',
          signer: metaAccountOwner,
          unsignedParamsFn: function () {
            return [ 
              this.testFulfillSwap.address,
              this.successCallData
            ]
          },
          paramsFn: function () {
            return [
              this.tokenA.address,
              // try to send more ether than the account has
              this.metaAccountInitialEthBalance.add(BN(1)),
              this.tokenASwapAmount,
              this.expiryBlock
            ]
          },
          expectRevert: 'MetaSwapLogic: ethToTokenSwap not enough ether'
        },
        {
          describe: 'when the unsigned call fails',
          signer: metaAccountOwner,
          unsignedParamsFn: function () {
            return [ 
              this.testFulfillSwap.address,
              this.failCallData
            ]
          },
          paramsFn: function () { return this.metaBehavior_params },
          expectRevert: 'ERC20: transfer amount exceeds balance'
        },
        {
          describe: 'when the unsigned call transfer is insufficient',
          signer: metaAccountOwner,
          unsignedParamsFn: function () {
            return [ 
              this.testFulfillSwap.address,
              this.notEnoughTokenCallData
            ]
          },
          paramsFn: function () { return this.metaBehavior_params },
          expectRevert: 'MetaSwapLogic: ethToTokenSwap token received is less than allowed'
        },
        {
          describe: 'when the expiryBlock has been mined',
          signer: metaAccountOwner,
          unsignedParamsFn: function () {
            return [ 
              this.testFulfillSwap.address,
              this.successCallData
            ]
          },
          paramsFn: function () {
            const expiredBlockParams = [...this.metaBehavior_params]
            expiredBlockParams[3] = this.expiredBlock
            return expiredBlockParams
          },
          expectRevert: 'MetaSwapLogic: ethToTokenSwap expiryBlock exceeded'
        }
      ]
    })
  })

  describe('tokenToEthSwap', function () {
    beforeEach(async function () {
      this.tokenASwapAmount = getBN(2)
      this.ethSwapAmount = getBN(4)
      await this.tokenA.mint(this.metaAccount.address, this.tokenASwapAmount)
      await web3.eth.sendTransaction({
        from: ethStoreAccount,
        to: this.testFulfillSwap.address,
        value: this.ethSwapAmount
      })

      this.successCallData = encodeFunctionCall(
        'fulfillEthOutSwap',
        ['uint'],
        [ this.ethSwapAmount.toString() ]
      )

      this.failCallData = encodeFunctionCall(
        'fulfillEthOutSwap',
        ['uint'],
        [
          // fail when trying to send more ether than the TestFulfillSwap contract has
          this.ethSwapAmount.add(BN(1)).toString()
        ]
      )

      this.notEnoughEthCallData = encodeFunctionCall(
        'fulfillEthOutSwap',
        ['uint'],
        [
          // fail when trying to send less ether than the signed call requires
          this.ethSwapAmount.sub(BN(1)).toString()
        ]
      )

      this.metaBehavior_unsignedParams = [
        this.testFulfillSwap.address,
        this.successCallData
      ]
      this.metaBehavior_paramTypes = [ 'address', 'uint', 'uint', 'uint' ]
      this.metaBehavior_params = [
        this.tokenA.address,
        this.tokenASwapAmount,
        this.ethSwapAmount,
        this.expiryBlock
      ]
    })

    shouldBehaveLikeMetaTransaction({
      contract: 'metaAccount',
      method: 'tokenToEthSwap',
      signer: metaAccountOwner
    })

    testMetaTxEndpoint.call(this, {
      contract: 'metaAccount',
      method: 'tokenToEthSwap',
      paramTypes: [ 'address', 'uint', 'uint', 'uint' ],
      conditions: [
        {
          describe: 'when given a valid tokenToEthSwap signature and call',
          signer: metaAccountOwner,
          unsignedParamsFn: function () {
            return [ 
              this.testFulfillSwap.address,
              this.successCallData
            ]
          },
          paramsFn: function () { return this.metaBehavior_params },
          testFn: function () {
            it('should execute successfully', async function () {
              expect(await this.tokenA.balanceOf(this.metaAccount.address)).to.be.bignumber.equal(BN(0))
              expect(BN(await web3.eth.getBalance(this.metaAccount.address))).to.be.bignumber.equal(this.ethSwapAmount)
              expect(await this.tokenA.balanceOf(this.testFulfillSwap.address)).to.be.bignumber.equal(this.tokenASwapAmount)
              expect(BN(await web3.eth.getBalance(this.testFulfillSwap.address))).to.be.bignumber.equal(BN(0))
            })

            it('should emit a TokenToEthSwapExecuted event', function () {
              expectEvent(this.receipt, 'TokenToEthSwapExecuted', {
                to: this.testFulfillSwap.address,
                data: this.successCallData,
                token: this.tokenA.address,
                tokenAmount: this.tokenASwapAmount,
                ethAmount: this.ethSwapAmount
              })
            })
          }
        },
        {
          describe: 'when signer is not proxy owner',
          signer: badAccount,
          unsignedParamsFn: function () {
            return [ 
              this.testFulfillSwap.address,
              this.successCallData
            ]
          },
          paramsFn: function () { return this.metaBehavior_params },
          expectRevert: 'MetaSwapLogic: tokenToEthSwap signer is not proxyOwner'
        },
        {
          describe: 'when the unsigned call fails',
          signer: metaAccountOwner,
          unsignedParamsFn: function () {
            return [ 
              this.testFulfillSwap.address,
              this.failCallData
            ]
          },
          paramsFn: function () { return this.metaBehavior_params },
          expectRevert: 'TestFulfillSwap: fulfillEthOutSwap send ether to msg.sender failed'
        },
        {
          describe: 'when the unsigned call transfer is insufficient',
          signer: metaAccountOwner,
          unsignedParamsFn: function () {
            return [ 
              this.testFulfillSwap.address,
              this.notEnoughEthCallData
            ]
          },
          paramsFn: function () { return this.metaBehavior_params },
          expectRevert: 'MetaSwapLogic: tokenToEthSwap ether received is less than allowed'
        },
        {
          describe: 'when the expiryBlock has been mined',
          signer: metaAccountOwner,
          unsignedParamsFn: function () {
            return [ 
              this.testFulfillSwap.address,
              this.successCallData
            ]
          },
          paramsFn: function () {
            const expiredBlockParams = [...this.metaBehavior_params]
            expiredBlockParams[3] = this.expiredBlock
            return expiredBlockParams
          },
          expectRevert: 'MetaSwapLogic: tokenToEthSwap expiryBlock exceeded'
        }
      ]
    })
  })
})
