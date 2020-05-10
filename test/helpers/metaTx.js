const ethJsUtil = require('ethereumjs-util')
const { randomHex } = require('web3-utils')
const computeHash = require('./computeHash')

const signMetaTx = async ({
  web3,
  contract,
  method,
  salt,
  signer,
  paramTypes = [],
  params = []
}) => {
  const hash = computeHash(contract.address, method, salt, paramTypes, params)
  const sig = await getSig(web3, hash, signer)

  return { salt, hash, to: contract.address, ...sig, signer, params }
}

const metaTxPromise = async ({
  web3,
  contract,
  method,
  salt,
  signer,
  unsignedParams = [],
  paramTypes = [],
  params = [],
  value = 0
}) => {
  const signature = await signMetaTx({
    web3,
    contract,
    method,
    salt,
    signer,
    paramTypes,
    params
  })
  let opts = { value }
  const promise = contract[method].apply(this, [
    signature.salt,
    signature.v,
    signature.r,
    signature.s,
    ...signature.params,
    ...unsignedParams,
    opts
  ])
  return { promise, signature }
}

const metaTxPromiseWithSignature = ({
  contract,
  method,
  salt,
  unsignedParams = [],
  value = 0,
  signature,
}) => {
  let opts = { value }
  const promise = contract[method].apply(this, [
    salt,
    signature.v,
    signature.r,
    signature.s,
    ...signature.params,
    ...unsignedParams,
    opts
  ])
  return { promise, signature }
}

const execMetaTx = async ({
  web3,
  contract,
  method,
  salt,
  signer,
  unsignedParams = [],
  paramTypes = [],
  params = [],
  value
}) => {
  const { promise, signature } = await metaTxPromise({
    web3,
    contract,
    method,
    salt,
    signer,
    unsignedParams,
    paramTypes,
    params,
    value
  })
  const receipt = await promise
  return { receipt, signature }
}

async function getSig (web3, hash, signer) {
  const rpcSig = await web3.eth.sign(hash, signer)
  return ethJsUtil.fromRpcSig(rpcSig)
}

function generateSalt () {
  return randomHex(32)
}

module.exports = {
  getSig,
  signMetaTx,
  metaTxPromise,
  metaTxPromiseWithSignature,
  execMetaTx,
  generateSalt
}
