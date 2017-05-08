// http_test.js

import { expect } from 'chai'
import { make_request } from '../lib/helpers'
import server from '../../src/server'

const request = make_request()

describe('Transaction server', () => {
  describe('server.next_xid', () => {
    it('should generate unique, monotonic increasing transaction ids', async () => {
      expect(server.next_xid()).to.eql(1)
      expect(server.next_xid()).to.eql(2)
    })
  }) // next_xid

  describe('/world/:key', () => {
    it('should return null if the key is not in cache or disk', () => {
      request('/world/x')

    })
  })

}) // Transaction server
