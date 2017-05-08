// init_test.js
//
import { expect } from 'chai'
import server from '../../src/server'
import Raku from 'raku'

const raku = new Raku()

const PORT = 3000

describe('Initialization of transaction server', () => {
  beforeEach(() => raku.deleteAll())

  describe('app.xid', () => {
    it('should initialize xid from last known value', async () => {
      expect(server.next_xid()).to.eql(1)
      await raku.cset('xid', 4999)
      await server.init()
      expect(server.next_xid()).to.eql(5000)
    })
  })
}) // Initialization of transaction server
