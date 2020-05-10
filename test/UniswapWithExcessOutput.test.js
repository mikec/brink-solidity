const { accounts, web3, contract } = require('@openzeppelin/test-environment')
const { expect } = require('chai')
const { toBN: BN } = require('web3-utils')
const { expectEvent, expectRevert } = require('@openzeppelin/test-helpers')
const { setupUniswap } = require('./helpers/setup')
const { zeroBalanceTest, ethBalanceTest, tokenBalanceTest } = require('./helpers/balanceTests')
const calcGasFee = require('./helpers/calcGasFee')
const [ ethStoreAccount, swapSender, excessRecipient ] = accounts

const UniswapWithExcessOutput = contract.fromArtifact('UniswapWithExcessOutput')

describe('UniswapWithExcessOutput adapter', function () {
  beforeEach(async function () {
    const { factory, tokenA, exchangeA, tokenB, exchangeB } = await setupUniswap()
    this.tokenA = tokenA
    this.tokenB = tokenB
    this.exchangeA = exchangeA
    this.exchangeB = exchangeB
    this.adapter = await UniswapWithExcessOutput.new(factory.address, excessRecipient)
  })

  describe('tokenToTokenSwap', function () {
    describe('when executed at a price with no excess', function () {
      beforeEach(async function () {
        await setupTokenToTokenSwap.call(this, { tokenA_amount: BN(2.5 * 10 ** 18) })
        await executeTokenToTokenSwap.call(this)
      })

      it('should execute the swap with no excess paid to excessRecipient', async function () {
        expectEvent(this.web3Tx, 'TokenToTokenSwapExecuted', {
          tokenIn: this.tokenA.address,
          tokenOut: this.tokenB.address,
          tokenInAmount: this.tokenA_amount,
          tokenOutAmount: this.tokenB_amount,
          excessTokenOut: BN(0)
        })
        await tokenBalanceTest(this.tokenB, excessRecipient, BN(0))
      })

      it('should transfer tokenB to sender', async function () {
        await tokenBalanceTest(this.tokenB, swapSender, this.tokenB_amount)
      })

      it('adapter should have a zero balances of tokens and ether', async function () {
        await zeroBalanceTest.call(this, this.adapter.address)
      })
    })

    describe('when executed at a price with excess', function () {
      beforeEach(async function () {
        await setupTokenToTokenSwap.call(this, {
          tokenA_amount: BN(2.5 * 10 ** 18),
          tokenB_excess: BN(0.0234 * 10 ** 18)
        })
        await executeTokenToTokenSwap.call(this)
      })

      it('should execute the swap with no excess paid to excessRecipient', async function () {
        expectEvent(this.web3Tx, 'TokenToTokenSwapExecuted', {
          tokenIn: this.tokenA.address,
          tokenOut: this.tokenB.address,
          tokenInAmount: this.tokenA_amount,
          tokenOutAmount: this.tokenB_amount_noExcess,
          excessTokenOut: this.tokenB_excess
        })
        await tokenBalanceTest(this.tokenB, excessRecipient, this.tokenB_excess)
      })

      it('should transfer tokenB to sender', async function () {
        await tokenBalanceTest(this.tokenB, swapSender, this.tokenB_amount_noExcess)
      })

      it('adapter should have a zero balances of tokens and ether', async function () {
        await zeroBalanceTest.call(this, this.adapter.address)
      })
    })
  })

  describe('ethToTokenSwap', function () {
    describe('when executed at a price with no excess', function () {
      beforeEach(async function () {
        this.excessRecipientBalance = BN(await web3.eth.getBalance(excessRecipient))
        await setupEthToTokenSwap.call(this, { ethAmount: BN(4.34 * 10 ** 18) })
        await executeEthToTokenSwap.call(this)
      })

      it('should execute the swap with no excess paid to excessRecipient', async function () {
        expectEvent(this.web3Tx, 'EthToTokenSwapExecuted', {
          token: this.tokenA.address,
          ethAmount: this.ethAmount,
          tokenAmount: this.tokenA_amount,
          excessToken: BN(0)
        })

        await tokenBalanceTest(this.tokenA, excessRecipient, BN(0))
      })

      it('should transfer tokenA to sender', async function () {
        await tokenBalanceTest(this.tokenA, swapSender, this.tokenA_amount)
      })

      it('adapter should have a zero balances of tokens and ether', async function () {
        await zeroBalanceTest.call(this, this.adapter.address)
      })
    })

    describe('when executed at a price with excess', function () {
      beforeEach(async function () {
        await setupEthToTokenSwap.call(this, {
          ethAmount: BN(1.2 * 10 ** 18),
          tokenA_excess: BN(0.0483 * 10**18)
        })
        await executeEthToTokenSwap.call(this)
      })

      it('should execute the swap with no excess paid to excessRecipient', async function () {
        expectEvent(this.web3Tx, 'EthToTokenSwapExecuted', {
          token: this.tokenA.address,
          ethAmount: this.ethAmount,
          tokenAmount: this.tokenA_amount_noExcess,
          excessToken: this.tokenA_excess
        })

        await tokenBalanceTest(this.tokenA, excessRecipient, this.tokenA_excess)
      })

      it('should transfer tokenA to sender', async function () {
        await tokenBalanceTest(this.tokenA, swapSender, this.tokenA_amount_noExcess)
      })

      it('adapter should have a zero balances of tokens and ether', async function () {
        await zeroBalanceTest.call(this, this.adapter.address)
      })
    })
  })

  describe('tokenToEthSwap', function () {
    describe('when executed at a price with no excess', function () {
      beforeEach(async function () {
        this.swapSenderEthBalance = BN(await web3.eth.getBalance(swapSender))
        this.excessRecipientBalance = BN(await web3.eth.getBalance(excessRecipient))
        await setupTokenToEthSwap.call(this, { tokenA_amount: BN(6.52 * 10 ** 18) })
        await executeTokenToEthSwap.call(this)
        this.gasFee = await calcGasFee(this.web3Tx)
      })

      it('should execute the swap with no excess paid to excessRecipient', async function () {
        expectEvent(this.web3Tx, 'TokenToEthSwapExecuted', {
          token: this.tokenA.address,
          tokenAmount: this.tokenA_amount,
          ethAmount: this.ethAmount,
          excessEth: BN(0)
        })

        await ethBalanceTest(excessRecipient, this.excessRecipientBalance)
      })

      it('should transfer eth to sender', async function () {
        await ethBalanceTest(swapSender, this.swapSenderEthBalance.add(this.ethAmount).sub(this.gasFee))
      })

      it('adapter should have a zero balances of tokens and ether', async function () {
        await zeroBalanceTest.call(this, this.adapter.address)
      })
    })

    describe('when executed at a price with excess', function () {
      beforeEach(async function () {
        this.swapSenderEthBalance = BN(await web3.eth.getBalance(swapSender))
        this.excessRecipientBalance = BN(await web3.eth.getBalance(excessRecipient))
        await setupTokenToEthSwap.call(this, {
          tokenA_amount: BN(0.93 * 10 ** 18),
          excessEth: BN(0.0016 * 10**18)
        })
        await executeTokenToEthSwap.call(this)
        this.gasFee = await calcGasFee(this.web3Tx)
      })

      it('should execute the swap with excess paid to excessRecipient', async function () {
        expectEvent(this.web3Tx, 'TokenToEthSwapExecuted', {
          token: this.tokenA.address,
          tokenAmount: this.tokenA_amount,
          ethAmount: this.ethAmount_noExcess,
          excessEth: this.excessEth
        })

        await ethBalanceTest(excessRecipient, this.excessRecipientBalance.add(this.excessEth))
      })

      it('should transfer eth to sender', async function () {
        await ethBalanceTest(swapSender, this.swapSenderEthBalance.add(this.ethAmount_noExcess).sub(this.gasFee))
      })

      it('adapter should have a zero balances of tokens and ether', async function () {
        await zeroBalanceTest.call(this, this.adapter.address)
      })
    })
  })

  describe('tokenToTokenSwapExcess', function () {
    describe('when market is more favorable than swap', function () {
      it('should return correct tokenOutExcess and 0 tokenInExcess', async function () {
        await setupTokenToTokenSwap.call(this, {
          tokenA_amount: BN(2.5 * 10 ** 18),
          tokenB_excess: BN(0.0234 * 10 ** 18)
        })
        const { excessTokenIn, excessTokenOut } = await this.adapter.tokenToTokenSwapExcess(
          this.tokenA.address, this.tokenB.address, this.tokenA_amount, this.tokenB_amount_noExcess
        )
        await executeTokenToTokenSwap.call(this)
        const actualExcess = this.web3Tx.logs[0].args.excessTokenOut
        expect(excessTokenIn).to.be.bignumber.equal(BN(0))
        expect(excessTokenOut).to.be.bignumber.equal(actualExcess)
      })
    })
    describe('when market is less favorable than swap', function () {
      it('should return negative tokenOutExcess and 0 tokenInExcess', async function () {
        await setupTokenToTokenSwap.call(this, {
          tokenA_amount: BN(2.5 * 10 ** 18),
          tokenB_excess: BN(-0.0123 * 10**18)
        })
        const { excessTokenIn, excessTokenOut } = await this.adapter.tokenToTokenSwapExcess(
          this.tokenA.address, this.tokenB.address, this.tokenA_amount, this.tokenB_amount_noExcess
        )
        expect(excessTokenIn).to.be.bignumber.equal(BN(0))
        expect(excessTokenOut).to.be.bignumber.equal(this.tokenB_excess)
      })
    })
  })

  describe('ethToTokenSwapExcess', function () {
    describe('when market is more favorable than swap', function () {
      it('should return correct tokenOutExcess and 0 tokenInExcess', async function () {
        await setupEthToTokenSwap.call(this, {
          ethAmount: BN(3.5 * 10 ** 18),
          tokenA_excess: BN(0.0023 * 10**18)
        })
        const { excessEth, excessToken } = await this.adapter.ethToTokenSwapExcess(
          this.tokenA.address, this.ethAmount, this.tokenA_amount_noExcess
        )
        await executeEthToTokenSwap.call(this)
        const actualExcess = this.web3Tx.logs[0].args.excessToken
        expect(excessEth).to.be.bignumber.equal(BN(0))
        expect(excessToken).to.be.bignumber.equal(actualExcess)
      })
    })
    describe('when market is less favorable than swap', function () {
      it('should return negative tokenOutExcess and 0 tokenInExcess', async function () {
        await setupEthToTokenSwap.call(this, {
          ethAmount: BN(3.5 * 10 ** 18),
          tokenA_excess: BN(-0.0023 * 10**18)
        })
        const { excessEth, excessToken } = await this.adapter.ethToTokenSwapExcess(
          this.tokenA.address, this.ethAmount, this.tokenA_amount_noExcess
        )
        expect(excessEth).to.be.bignumber.equal(BN(0))
        expect(excessToken).to.be.bignumber.equal(this.tokenA_excess)
      })
    })
  })

  describe('tokenToEthSwapExcess', function () {
    describe('when market is more favorable than swap', function () {
      it('should return correct tokenOutExcess and 0 tokenInExcess', async function () {
        await setupTokenToEthSwap.call(this, {
          tokenA_amount: BN(3.5 * 10 ** 18),
          excessEth: BN(0.0736 * 10**18)
        })
        const { excessToken, excessEth } = await this.adapter.tokenToEthSwapExcess(
          this.tokenA.address, this.tokenA_amount, this.ethAmount_noExcess
        )
        await executeTokenToEthSwap.call(this)
        const actualExcess = this.web3Tx.logs[0].args.excessEth
        expect(excessToken).to.be.bignumber.equal(BN(0))
        expect(excessEth).to.be.bignumber.equal(actualExcess)
      })
    })
    describe('when market is less favorable than swap', function () {
      it('should return negative tokenOutExcess and 0 tokenInExcess', async function () {
        await setupTokenToEthSwap.call(this, {
          tokenA_amount: BN(3.5 * 10 ** 18),
          excessEth: BN(-0.0736 * 10**18)
        })
        const { excessToken, excessEth } = await this.adapter.tokenToEthSwapExcess(
          this.tokenA.address, this.tokenA_amount, this.ethAmount_noExcess
        )
        expect(excessToken).to.be.bignumber.equal(BN(0))
        expect(excessEth).to.be.bignumber.equal(this.excessEth)
      })
    })
  })
})

async function setupTokenToTokenSwap ({ tokenA_amount, tokenB_excess = BN(0) }) {
  this.tokenA_amount = tokenA_amount
  this.tokenB_excess = tokenB_excess
  this.tokenB_amount = await this.adapter.tokenToTokenInputPrice(
    this.tokenA.address, this.tokenB.address, this.tokenA_amount
  )
  this.tokenB_amount_noExcess = this.tokenB_amount.sub(this.tokenB_excess)
}

async function setupEthToTokenSwap ({ ethAmount, tokenA_excess = BN(0) }) {
  this.ethAmount = ethAmount
  this.tokenA_excess = tokenA_excess
  this.tokenA_amount = await this.adapter.ethToTokenInputPrice(this.tokenA.address, this.ethAmount)
  this.tokenA_amount_noExcess = this.tokenA_amount.sub(this.tokenA_excess)
}

async function setupTokenToEthSwap ({ tokenA_amount, excessEth = BN(0) }) {
  this.tokenA_amount = tokenA_amount
  this.excessEth = excessEth
  this.ethAmount = await this.adapter.tokenToEthInputPrice(this.tokenA.address, this.tokenA_amount)
  this.ethAmount_noExcess = this.ethAmount.sub(this.excessEth)
}

async function executeTokenToTokenSwap () {
  await this.tokenA.mint(this.adapter.address, this.tokenA_amount)
  this.web3Tx = await this.adapter.tokenToTokenSwap(
    this.tokenA.address,
    this.tokenB.address,
    this.tokenA_amount,
    this.tokenB_amount_noExcess,
    { from: swapSender }
  )
}

async function executeEthToTokenSwap () {
  this.web3Tx = await this.adapter.ethToTokenSwap(
    this.tokenA.address,
    this.tokenA_amount_noExcess,
    { from: swapSender, value: this.ethAmount }
  )
}

async function executeTokenToEthSwap () {
  await this.tokenA.mint(this.adapter.address, this.tokenA_amount)
  this.web3Tx = await this.adapter.tokenToEthSwap(
    this.tokenA.address,
    this.tokenA_amount,
    this.ethAmount_noExcess,
    { from: swapSender }
  )
}
