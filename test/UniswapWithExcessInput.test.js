const { accounts, web3, contract } = require('@openzeppelin/test-environment')
const { expect } = require('chai')
const { toBN: BN } = require('web3-utils')
const { expectEvent, expectRevert } = require('@openzeppelin/test-helpers')
const { setupUniswap } = require('./helpers/setup')
const { zeroBalanceTest, ethBalanceTest, tokenBalanceTest } = require('./helpers/balanceTests')
const calcGasFee = require('./helpers/calcGasFee')
const [ ethStoreAccount, swapSender, excessRecipient ] = accounts

const UniswapWithExcessInput = contract.fromArtifact('UniswapWithExcessInput')

describe('UniswapWithExcessInput adapter', function () {
  beforeEach(async function () {
    const { factory, tokenA, exchangeA, tokenB, exchangeB } = await setupUniswap()
    this.tokenA = tokenA
    this.tokenB = tokenB
    this.exchangeA = exchangeA
    this.exchangeB = exchangeB
    this.adapter = await UniswapWithExcessInput.new(factory.address, excessRecipient)
  })

  describe('tokenToTokenSwap', function () {
    describe('when executed at a price with no excess', function () {
      beforeEach(async function () {
        await setupTokenToTokenSwap.call(this, {
          tokenB_amount: BN(2.5 * 10 ** 18)
        })
        await executeTokenToTokenSwap.call(this)
      })

      it('should execute the swap with no excess paid to excessRecipient', async function () {
        expectEvent(this.web3Tx, 'TokenToTokenSwapExecuted', {
          tokenIn: this.tokenA.address,
          tokenOut: this.tokenB.address,
          tokenInAmount: this.tokenA_amount,
          tokenOutAmount: this.tokenB_amount,
          excessTokenIn: BN(0)
        })
        await tokenBalanceTest(this.tokenA, excessRecipient, BN(0))
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
          tokenB_amount: BN(2.5 * 10 ** 18),
          tokenA_excess: BN(0.001 * 10**18)
        })
        await executeTokenToTokenSwap.call(this)
      })

      it('should execute the swap with excess paid to excessRecipient', async function () {
        expectEvent(this.web3Tx, 'TokenToTokenSwapExecuted', {
          tokenIn: this.tokenA.address,
          tokenOut: this.tokenB.address,
          tokenInAmount: this.tokenA_amount,
          tokenOutAmount: this.tokenB_amount,
          excessTokenIn: this.tokenA_excess
        })
        await tokenBalanceTest(this.tokenA, excessRecipient, this.tokenA_excess)
      })

      it('should transfer tokenB to sender', async function () {
        await tokenBalanceTest(this.tokenB, swapSender, this.tokenB_amount)
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
        await setupEthToTokenSwap.call(this, { tokenA_amount: BN(3.5 * 10 ** 18) })
        await executeEthToTokenSwap.call(this)
      })

      it('should execute the swap with no excess paid to excessRecipient', async function () {
        expectEvent(this.web3Tx, 'EthToTokenSwapExecuted', {
          token: this.tokenA.address,
          ethAmount: this.ethAmount,
          tokenAmount: this.tokenA_amount,
          excessEth: BN(0)
        })

        await ethBalanceTest(excessRecipient, this.excessRecipientBalance)
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
        this.excessRecipientBalance = BN(await web3.eth.getBalance(excessRecipient))
        await setupEthToTokenSwap.call(this, {
          tokenA_amount: BN(3.5 * 10 ** 18),
          excessEth: BN(0.0023 * 10**18)
        })
        await executeEthToTokenSwap.call(this)
      })

      it('should execute the swap with no excess paid to excessRecipient', async function () {
        expectEvent(this.web3Tx, 'EthToTokenSwapExecuted', {
          token: this.tokenA.address,
          ethAmount: this.ethAmount,
          tokenAmount: this.tokenA_amount,
          excessEth: this.excessEth
        })

        await ethBalanceTest(excessRecipient, this.excessRecipientBalance.add(this.excessEth))
      })

      it('should transfer tokenA to sender', async function () {
        await tokenBalanceTest(this.tokenA, swapSender, this.tokenA_amount)
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
        await setupTokenToEthSwap.call(this, { ethAmount: BN(3.5 * 10 ** 18) })
        await executeTokenToEthSwap.call(this)
        this.gasFee = await calcGasFee(this.web3Tx)
      })

      it('should execute the swap with no excess paid to excessRecipient', async function () {
        expectEvent(this.web3Tx, 'TokenToEthSwapExecuted', {
          token: this.tokenA.address,
          tokenAmount: this.tokenA_amount,
          ethAmount: this.ethAmount,
          excessToken: BN(0)
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
        await setupTokenToEthSwap.call(this, {
          ethAmount: BN(3.5 * 10 ** 18),
          tokenA_excess: BN(0.0736 * 10**18)
        })
        await executeTokenToEthSwap.call(this)
        this.gasFee = await calcGasFee(this.web3Tx)
      })

      it('should execute the swap with excess paid to excessRecipient', async function () {
        expectEvent(this.web3Tx, 'TokenToEthSwapExecuted', {
          token: this.tokenA.address,
          tokenAmount: this.tokenA_amount,
          ethAmount: this.ethAmount,
          excessToken: this.tokenA_excess
        })

        await tokenBalanceTest(this.tokenA, excessRecipient, this.tokenA_excess)
      })

      it('should transfer eth to sender', async function () {
        await ethBalanceTest(swapSender, this.swapSenderEthBalance.add(this.ethAmount).sub(this.gasFee))
      })

      it('adapter should have a zero balances of tokens and ether', async function () {
        await zeroBalanceTest.call(this, this.adapter.address)
      })
    })
  })

  describe('tokenToTokenSwapExcess', function () {
    describe('when market is more favorable than swap', function () {
      it('should return correct tokenInExcess and 0 tokenOutExcess', async function () {
        await setupTokenToTokenSwap.call(this, {
          tokenB_amount: BN(2.5 * 10 ** 18),
          tokenA_excess: BN(0.0123 * 10**18)
        })
        const { excessTokenIn, excessTokenOut } = await this.adapter.tokenToTokenSwapExcess(
          this.tokenA.address, this.tokenB.address, this.tokenA_amount, this.tokenB_amount
        )
        await executeTokenToTokenSwap.call(this)
        const actualExcess = this.web3Tx.logs[0].args.excessTokenIn
        expect(excessTokenIn).to.be.bignumber.equal(actualExcess)
        expect(excessTokenOut).to.be.bignumber.equal(BN(0))
      })
    })
    describe('when market is less favorable than swap', function () {
      it('should return negative tokenInExcess and 0 tokenOutExcess', async function () {
        await setupTokenToTokenSwap.call(this, {
          tokenB_amount: BN(2.5 * 10 ** 18),
          tokenA_excess: BN(-0.0123 * 10**18)
        })
        const { excessTokenIn, excessTokenOut } = await this.adapter.tokenToTokenSwapExcess(
          this.tokenA.address, this.tokenB.address, this.tokenA_amount, this.tokenB_amount
        )
        expect(excessTokenIn).to.be.bignumber.equal(this.tokenA_excess)
        expect(excessTokenOut).to.be.bignumber.equal(BN(0))
      })
    })
    describe('when output amount is not less than exchange reserve amount', function () {
      it('should revert', async function () {
        const reserveTokenB = await this.tokenB.balanceOf(this.exchangeB.address)
        await expectRevert(
          this.adapter.tokenToTokenSwapExcess(
            this.tokenA.address, this.tokenB.address, BN(1 * 10**18), reserveTokenB
          ),
          'tokenOutAmount must be less than exchange reserve',
        )
      })
    })
  })

  describe('ethToTokenSwapExcess', function () {
    describe('when market is more favorable than swap', function () {
      it('should return correct tokenInExcess and 0 tokenOutExcess', async function () {
        await setupEthToTokenSwap.call(this, {
          tokenA_amount: BN(3.5 * 10 ** 18),
          excessEth: BN(0.0023 * 10**18)
        })
        const { excessEth, excessToken } = await this.adapter.ethToTokenSwapExcess(
          this.tokenA.address, this.ethAmount, this.tokenA_amount
        )
        await executeEthToTokenSwap.call(this)
        const actualExcess = this.web3Tx.logs[0].args.excessEth
        expect(excessEth).to.be.bignumber.equal(actualExcess)
        expect(excessToken).to.be.bignumber.equal(BN(0))
      })
    })
    describe('when market is less favorable than swap', function () {
      it('should return negative tokenInExcess and 0 tokenOutExcess', async function () {
        await setupEthToTokenSwap.call(this, {
          tokenA_amount: BN(3.5 * 10 ** 18),
          excessEth: BN(-0.0023 * 10**18)
        })
        const { excessEth, excessToken } = await this.adapter.ethToTokenSwapExcess(
          this.tokenA.address, this.ethAmount, this.tokenA_amount
        )
        expect(excessEth).to.be.bignumber.equal(this.excessEth)
        expect(excessToken).to.be.bignumber.equal(BN(0))
      })
    })
    describe('when output amount is not less than exchange reserve amount', function () {
      it('should revert', async function () {
        const reserveTokenA = await this.tokenA.balanceOf(this.exchangeA.address)
        await expectRevert(
          this.adapter.ethToTokenSwapExcess(
            this.tokenA.address, BN(1 * 10**18), reserveTokenA
          ),
          'tokenOutAmount must be less than exchange reserve',
        )
      })
    })
  })

  describe('tokenToEthSwapExcess', function () {
    describe('when market is more favorable than swap', function () {
      it('should return correct tokenInExcess and 0 tokenOutExcess', async function () {
        await setupTokenToEthSwap.call(this, {
          ethAmount: BN(3.5 * 10 ** 18),
          tokenA_excess: BN(0.0736 * 10**18)
        })
        const { excessToken, excessEth } = await this.adapter.tokenToEthSwapExcess(
          this.tokenA.address, this.tokenA_amount, this.ethAmount
        )
        await executeTokenToEthSwap.call(this)
        const actualExcess = this.web3Tx.logs[0].args.excessToken
        expect(excessToken).to.be.bignumber.equal(actualExcess)
        expect(excessEth).to.be.bignumber.equal(BN(0))
      })
    })
    describe('when market is less favorable than swap', function () {
      it('should return negative tokenInExcess and 0 tokenOutExcess', async function () {
        await setupTokenToEthSwap.call(this, {
          ethAmount: BN(3.5 * 10 ** 18),
          tokenA_excess: BN(-0.0736 * 10**18)
        })
        const { excessToken, excessEth } = await this.adapter.tokenToEthSwapExcess(
          this.tokenA.address, this.tokenA_amount, this.ethAmount
        )
        expect(excessToken).to.be.bignumber.equal(this.tokenA_excess)
        expect(excessEth).to.be.bignumber.equal(BN(0))
      })
    })
    describe('when output amount is not less than exchange reserve amount', function () {
      it('should revert', async function () {
        const reserveEth = BN(await web3.eth.getBalance(this.exchangeA.address))
        await expectRevert(
          this.adapter.tokenToEthSwapExcess(
            this.tokenA.address, BN(1 * 10**18), reserveEth
          ),
          'ethOutAmount must be less than exchange reserve',
        )
      })
    })
  })
})

async function setupTokenToTokenSwap ({ tokenB_amount, tokenA_excess = BN(0) }) {
  this.tokenB_amount = tokenB_amount
  this.tokenA_excess = tokenA_excess
  const tokenA_noExcess = await this.adapter.tokenToTokenOutputPrice(
    this.tokenA.address, this.tokenB.address, this.tokenB_amount
  )
  this.tokenA_amount = tokenA_noExcess.add(this.tokenA_excess)
}

async function setupEthToTokenSwap ({ tokenA_amount, excessEth = BN(0) }) {
  this.tokenA_amount = tokenA_amount
  this.excessEth = excessEth
  const ethAmount_noExcess = await this.adapter.ethToTokenOutputPrice(this.tokenA.address, this.tokenA_amount)
  this.ethAmount = ethAmount_noExcess.add(this.excessEth)
}

async function setupTokenToEthSwap ({ ethAmount, tokenA_excess = BN(0) }) {
  this.ethAmount = ethAmount
  this.tokenA_excess = tokenA_excess
  const tokenA_amount_noExcess = await this.adapter.tokenToEthOutputPrice(this.tokenA.address, this.ethAmount)
  this.tokenA_amount = tokenA_amount_noExcess.add(this.tokenA_excess)
}

async function executeTokenToTokenSwap () {
  await this.tokenA.mint(this.adapter.address, this.tokenA_amount)
  this.web3Tx = await this.adapter.tokenToTokenSwap(
    this.tokenA.address,
    this.tokenB.address,
    this.tokenA_amount,
    this.tokenB_amount,
    { from: swapSender }
  )
}

async function executeEthToTokenSwap () {
  this.web3Tx = await this.adapter.ethToTokenSwap(
    this.tokenA.address,
    this.tokenA_amount,
    { from: swapSender, value: this.ethAmount }
  )
}

async function executeTokenToEthSwap () {
  await this.tokenA.mint(this.adapter.address, this.tokenA_amount)
  this.web3Tx = await this.adapter.tokenToEthSwap(
    this.tokenA.address,
    this.tokenA_amount,
    this.ethAmount,
    { from: swapSender }
  )
}
