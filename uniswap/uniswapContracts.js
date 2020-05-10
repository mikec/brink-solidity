const fs = require('fs')
const path = require('path')
const contractFromABI = require('./contractFromABI')

const exchangeAbiPath = path.join(__dirname, 'abi/exchange.json')
const exchangeBytecodePath = path.join(__dirname, 'bytecode/exchange')
const factoryAbiPath = path.join(__dirname, 'abi/factory.json')
const factoryBytecodePath = path.join(__dirname, 'bytecode/factory')

const exchangeAbi = JSON.parse(fs.readFileSync(exchangeAbiPath, 'utf8'))
const exchangeBytecode = fs.readFileSync(exchangeBytecodePath, 'utf8')
const factoryAbi = JSON.parse(fs.readFileSync(factoryAbiPath, 'utf8'))
const factoryBytecode = fs.readFileSync(factoryBytecodePath, 'utf8')

module.exports = (config) => {
  return {
    UniswapExchange: contractFromABI(exchangeAbi, exchangeBytecode, config),
    UniswapFactory: contractFromABI(factoryAbi, factoryBytecode, config)
  }
}
