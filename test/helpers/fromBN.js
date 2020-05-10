const getBN = require('./getBN')

module.exports = (bn) => {
  return bn.div(getBN(1)).toNumber()
}
