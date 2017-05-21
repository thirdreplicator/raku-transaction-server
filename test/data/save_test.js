// save_test.js

import { expect } from 'chai'
import Raku from 'raku'
import { gen_message, save_message } from '../../src/log_message'
import server from '../../src/server'

const raku = new Raku()

describe('save_message(k, message)', () => {
  beforeEach(() => raku.delete_all())
  after(() => raku.delete_all())

  describe('put', () => {
    it('should take an operation and save it the the set with key, k', async () => {
      let operation = { k: "x", op: "put", arg: [42] }
      let {k, op, arg} = operation
      const xid = server.next_xid()
      const message = gen_message(op, arg, xid)
      // mesage == { op: 'put', arg: [ 42 ], xid: 3 }
      await save_message(k, message)
      expect(await raku.sismember(k, JSON.stringify(message))).to.be.true
    })
  })

  describe('del', () => {
    it('should take an operation and save it the the set with key, k', async () => {
      let operation = { k: "x", op: "del", arg: [42] }
      let {k, op, arg} = operation
      const xid = server.next_xid()
      const message = gen_message(op, arg, xid)
      // mesage == { op: 'del', arg: [ 42 ], xid: 3 }
      await save_message(k, message)
      expect(await raku.sismember(k, JSON.stringify(message))).to.be.true
    })
  })

  describe('inc', () => {
    it('should take an operation and save it the the set with key, k', async () => {
      let operation = { k: "x", op: "inc", arg: [] }
      let {k, op, arg} = operation
      const xid = server.next_xid()
      const message = gen_message(op, arg, xid)
      // mesage == { op: 'inc', arg: [], xid: 3 }
      await save_message(k, message)
      expect(await raku.sismember(k, JSON.stringify(message))).to.be.true
    })
  })

  describe('dec', () => {
    it('should take an operation and save it the the set with key, k', async () => {
      let operation = { k: "x", op: "dec", arg: [42] }
      let {k, op, arg} = operation
      const xid = server.next_xid()
      const message = gen_message(op, arg, xid)
      // mesage == { op: 'dec', arg: [ 42 ], xid: 3 }
      await save_message(k, message)
      expect(await raku.sismember(k, JSON.stringify(message))).to.be.true
    })
  })

  describe('add', () => {
    it('should take an operation and save it the the set with key, k', async () => {
      let operation = { k: "x", op: "add", arg: [42] }
      let {k, op, arg} = operation
      const xid = server.next_xid()
      const message = gen_message(op, arg, xid)
      // mesage == { op: 'put', arg: [ 42 ], xid: 3 }
      await save_message(k, message)
      expect(await raku.sismember(k, JSON.stringify(message))).to.be.true
    })
  })

  describe('rem', () => {
    it('should take an operation and save it the the set with key, k', async () => {
      let operation = { k: "x", op: "rem", arg: [42] }
      let {k, op, arg} = operation
      const xid = server.next_xid()
      const message = gen_message(op, arg, xid)
      // mesage == { op: 'put', arg: [ 42 ], xid: 3 }
      await save_message(k, message)
      expect(await raku.sismember(k, JSON.stringify(message))).to.be.true
    })
  })

})

