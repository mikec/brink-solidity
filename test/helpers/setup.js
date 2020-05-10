const _ = require('lodash')
const { accounts, contract, web3 } = require('@openzeppelin/test-environment')
const config = require('@openzeppelin/test-environment/lib/config')
const { time } = require('@openzeppelin/test-helpers')
const uniswapContracts = require('../../uniswap/uniswapContracts')
const getBN = require('./getBN')
const [ defaultAccount, b, c, d, e, proxyDeployer, metaAccountOwner, liqProviderA, liqProviderB ] = accounts

const { UniswapFactory, UniswapExchange } = uniswapContracts({
  provider: web3,
  defaultSender: defaultAccount,
  defaultGas: config.default.contracts.defaultGas,
  defaultGasPrice: config.default.contracts.defaultGasPrice
})

const Account = contract.fromArtifact('Account')
const ProxyAdminDelegated = contract.fromArtifact('ProxyAdminDelegated')
const AccountLogic = contract.fromArtifact('AccountLogic')
const MockERC20Receiver = contract.fromArtifact('MockERC20Receiver')
const ERC20Mintable = contract.fromArtifact('ERC20Mintable')
const WETH = contract.fromArtifact('WETH')

const setupMetaAccount = async (owner = metaAccountOwner) => {
  const proxyAdminDelegated = await ProxyAdminDelegated.new()
  // deploy a proxy contract with AccountLogic contract implementation
  const impl_0 = await AccountLogic.new()
  const proxy = await Account.new(impl_0.address, owner, { from: proxyDeployer })
  const metaAccount = await AccountLogic.at(proxy.address)
  return { metaAccount, proxyAdminDelegated }
}

const setupMockERC20Receiver = async () => {
  const mockERC20Receiver = await MockERC20Receiver.new()
  return mockERC20Receiver
}

const setupUniswap = async () => {
  const factory = await UniswapFactory.new()
  const exchangeTemplate = await UniswapExchange.new()
  await factory.initializeFactory(exchangeTemplate.address)
  const { token: tokenA, exchange: exchangeA } = await setupMarket(factory, liqProviderA, 50, 250)
  const { token: tokenB, exchange: exchangeB } = await setupMarket(factory, liqProviderB, 85, 750)
  return { factory, tokenA, exchangeA, tokenB, exchangeB }
}

const setupMarket = async (factory, liqProvider, ethAmount, tokenAmount) => {
  const token = await ERC20Mintable.new()
  await token.mint(liqProvider, getBN(10**9))
  
  await factory.createExchange(token.address)
  const exchangeAddress = await factory.getExchange(token.address)
  const exchange = await UniswapExchange.at(exchangeAddress)

  const minLiquidity = 0
  const deadline = (await time.latest()).add(time.duration.days(1))
  const ethAmountBN = getBN(ethAmount)
  const tokenAmountBN = getBN(tokenAmount)

  await token.approve(exchangeAddress, tokenAmountBN, { from: liqProvider })
  await exchange.addLiquidity(
    minLiquidity, tokenAmountBN, deadline, { value: ethAmountBN, from: liqProvider }
  )
  
  return { token, exchange }
}

const setupTokens = async () => {
  const tokenA = await ERC20Mintable.new()
  const tokenB = await ERC20Mintable.new()
  const weth = await WETH.new()
  return { tokenA, tokenB, weth }
}

module.exports = {
  setupMetaAccount,
  setupMockERC20Receiver,
  setupUniswap,
  setupTokens
}
