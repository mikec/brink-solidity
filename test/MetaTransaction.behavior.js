const { expect } = require('chai')
const { web3 } = require('@openzeppelin/test-environment')
const { expectEvent, expectRevert } = require('@openzeppelin/test-helpers')
const {
  execMetaTx,
  metaTxPromiseWithSignature,
  signMetaTx,
  generateSalt
} = require('./helpers/metaTx')

const shouldFn = ({
  contract,
  method,
  signer,
  only
}) => {
  const describeFn = only ? describe.only : describe

  describeFn('meta transaction behavior', function () {
    describe('when meta tx succeeds', async function () {
      beforeEach(async function () {
        this.salt = generateSalt()
        const { receipt, signature } = await execMetaTx({
          web3,
          contract: this[contract],
          method,
          salt: this.salt,
          signer,
          unsignedParams: this.metaBehavior_unsignedParams,
          paramTypes: this.metaBehavior_paramTypes,
          params: this.metaBehavior_params,
          value: this.metaBehavior_value
        })
        this.receipt = receipt
        this.signature = signature
      })

      it('should emit MetaTransactionExecuted event', async function () {
        expectEvent(this.receipt, 'MetaTransactionExecuted')
      })
    
      it('should store used salt', async function () {
        const saltUsed = await this[contract].saltUsed(this.salt)
        expect(saltUsed).to.equal(true)
      })
    })

    it('should revert when signed with a used salt', async function () {
      const salt = generateSalt()

      // execute successfully with salt
      await execMetaTx({
        web3,
        contract: this[contract],
        method,
        salt,
        signer,
        paramTypes: this.metaBehavior_paramTypes,
        params: this.metaBehavior_params,
        unsignedParams: this.metaBehavior_unsignedParams
      })

      // attempt to execute with used salt should fail
      const signature = await signMetaTx({
        web3,
        contract: this[contract],
        method,
        salt,
        signer,
        paramTypes: this.metaBehavior_paramTypes,
        params: this.metaBehavior_params
      })
      const { promise } = metaTxPromiseWithSignature({
        contract: this[contract],
        method,
        salt,
        unsignedParams: this.metaBehavior_unsignedParams,
        signature
      })
      await expectRevert(promise, 'MetaTxBase: _metaTx with used salt')
    })
  })
}

const shouldBehaveLikeMetaTransaction = (contractMethod) => {
  shouldFn(contractMethod)
}
shouldBehaveLikeMetaTransaction.only = (contractMethod) => {
  shouldFn(contractMethod, true)
}

module.exports = {
  shouldBehaveLikeMetaTransaction
}
