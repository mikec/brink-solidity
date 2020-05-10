const { web3 } = require('@openzeppelin/test-environment')
const { expectRevert } = require('@openzeppelin/test-helpers')
const { metaTxPromise, generateSalt } = require('./metaTx')

function testMetaTxEndpoint ({ only, contract, method, paramTypes, conditions }) {
  const describeFn = only ? describe.only : describe

  for(const i in conditions) {
    const { only: innerOnly, describe: describeMsg, signer, unsignedParamsFn = () => {}, paramsFn = () => {}, value, testFn, expectRevert: expectRevertMsg } = conditions[i]
    const innerDescribeFn = innerOnly ? describe.only : describeFn
    innerDescribeFn(describeMsg, function () {
      // run tests
      if (testFn) {
        beforeEach(async function () {
          this.salt = generateSalt()
          const { promise, signature } = await getFunctionCallPromise.call(this)
          this.receipt = await promise
          this.signature = signature
        })
        testFn.call(this)
      }

      // run an expect revert test
      if (expectRevertMsg) {
        it ('should revert', async function () {
          this.salt = generateSalt()
          const { promise } = await getFunctionCallPromise.call(this)
          await expectRevert(promise, expectRevertMsg)
        })
      }

      async function getFunctionCallPromise () {
        let args = {
          web3,
          contract: this[contract],
          method,
          salt: this.salt,
          signer,
          unsignedParams: unsignedParamsFn.call(this),
          paramTypes,
          params: paramsFn.call(this),
          value
        }
        return metaTxPromise(args)
      }
    })
  }
}

module.exports = testMetaTxEndpoint
