const { accounts, contract, web3 } = require('@openzeppelin/test-environment')
const abi = require('ethereumjs-abi')
const ethJsUtil = require('ethereumjs-util')
const { expect } = require('chai')
const { expectEvent } = require('@openzeppelin/test-helpers')
const { setupTokens } = require('./helpers/setup')
const [ a, proxyOwner, c ] = accounts

const ContractDeployer = contract.fromArtifact('ContractDeployer')
const Account = contract.fromArtifact('Account')
const AccountLogic = contract.fromArtifact('AccountLogic')

describe('Deploy Account', function () {
  beforeEach(async function () {
    this.contractDeployer = await ContractDeployer.new()
    this.metaAccountImpl = await AccountLogic.new()
    const salt = web3.utils.utf8ToHex('some.salt')
    const encodedParameters = ethJsUtil.bufferToHex(
      abi.rawEncode(
        ['address', 'address'],
        [this.metaAccountImpl.address, proxyOwner]
      )
    ).replace('0x', '')
    const data = Account.bytecode + encodedParameters
    this.predeployAddr = await this.contractDeployer.getAddress(data, salt)
    this.receipt = await this.contractDeployer.deploy(data, salt)
    this.account = await AccountLogic.at(this.receipt.logs[0].args.contractAddress)
  })

  it('should deploy proxy contract at the predeployed computed address', function () {
    expect(this.receipt.logs[0].args.contractAddress).to.be.equal(this.predeployAddr)
  })

  it('should emit Deployed event', function() {
    expectEvent(this.receipt, 'Deployed', { contractAddress: this.predeployAddr })
  })

  it('should set implementation', async function () {
    const implementation = await this.account.implementation()
    expect(implementation).to.be.equal(this.metaAccountImpl.address)
  })

  it('should set proxyOwner', async function () {
    const proxyOwner = await this.account.proxyOwner()
    expect(proxyOwner).to.be.equal(proxyOwner)
  })
})