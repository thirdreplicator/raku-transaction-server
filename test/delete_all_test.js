import Raku from 'raku'
import { print_keys } from './lib/helpers'

const raku = new Raku()

describe('raku.delete_all()', () => {
  it('should delete only test database', () => {
    return raku.cget('xid')
      .then(xid => console.log('test/counters, xid', xid))
      .then(ks => print_keys())
      .then(() => raku.keys())
  })
})
