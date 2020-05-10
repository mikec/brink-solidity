const { accounts } = require('@openzeppelin/test-environment')
const { expectEvent } = require('@openzeppelin/test-helpers')
const testMetaTxEndpoint = require('./helpers/testMetaTxEndpoint')
const { shouldBehaveLikeMetaTransaction } = require('./MetaTransaction.behavior.js')
const { setupMetaAccount } = require('./helpers/setup')
const [ a, b, c, d, e, f, metaAccountOwner ] = accounts

describe('MetaCancelLogic', function () {
  beforeEach(async function () {
    const { metaAccount } = await setupMetaAccount()
    this.metaAccount = metaAccount
  })

  describe('cancel', function () {
    beforeEach(async function () {
      this.metaBehavior_paramTypes = []
      this.metaBehavior_params = []
    })

    shouldBehaveLikeMetaTransaction({
      contract: 'metaAccount',
      method: 'cancel',
      signer: metaAccountOwner
    })

    testMetaTxEndpoint.call(this, {
      contract: 'metaAccount',
      method: 'cancel',
      paramTypes: [],
      conditions: [
        {
          describe: 'when given a valid cancel signature and call',
          signer: metaAccountOwner,
          unsignedParamsFn: function () { return [] },
          paramsFn: function () { return [] },
          testFn: function () {
            it('should emit a CancelExecuted event', function () {
              expectEvent(this.receipt, 'CancelExecuted', {
                salt: this.salt
              })
            })
          }
        }
      ]
    })
  })
})
