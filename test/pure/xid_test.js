import Raku from 'raku'
import { expect } from 'chai'
import { gen_xid } from '../../src/xid.js'
const raku = new Raku()

describe('Transaction ID (xid) generation', () => {
  beforeEach(() => raku.deleteAll())

  it('should take two integer arguments and generate a decimal number', () => {
    const logical_time = 987
    const client_id = 1
    const result = gen_xid(logical_time, client_id)
    expect(result).to.eql(987.001)
  })
})
