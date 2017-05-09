// http_test.js

import { expect } from 'chai'
import fetch from 'node-fetch'
import server from '../../src/server'

let app = server.app.listen(3000)
let BASE = 'http://localhost:3000'

describe('Transaction server', () => {
  describe('server.next_xid', () => {
    it('should generate unique, monotonic increasing transaction ids', async () => {
      expect(server.next_xid()).to.eql(1)
      expect(server.next_xid()).to.eql(2)
    })
  }) // next_xid

  describe('/world/:key', () => {
    it('should return null if the key is not in cache or disk', () => {
      return fetch(BASE + '/world/x')
        .then(res => {
          expect(res.status).to.eql(200)
          expect(res.headers.get('content-type')).to.eql('application/json')
          return res.json()
        })
        .then(json => {
          expect(json).to.eql(null)
        })
    })
  }) // /world/:key

}) // Transaction server
