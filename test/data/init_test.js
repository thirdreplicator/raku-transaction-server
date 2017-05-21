// init_test.js

import { expect } from 'chai'
import server from '../../src/server'
import Raku from 'raku'

const raku = new Raku()

const PORT = 3000

describe('Initialization of transaction server', () => {
  beforeEach(() => {
    server.restart(PORT)
    return raku.delete_all()
  })

  describe('app.xid', () => {
    it('should initialize xid from last known value', async () => {
      let xid = server.next_xid()
      await raku.cset('xid', xid)
      await server.init()
      expect(server.next_xid()).to.eql(xid + 1)
    })
  })
}) // Initialization of transaction server
