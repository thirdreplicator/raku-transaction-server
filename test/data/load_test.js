// load_test.js

import { expect } from 'chai'
import Raku from 'raku'
import { gen_message, save_operations, load_messages } from '../../src/log_message'
import server from '../../src/server'
import { expectSetEquality } from '../lib/helpers'

const raku = new Raku()

describe('load_messages(k)', () => {
  beforeEach(() => raku.deleteAll())
  after(() => raku.deleteAll())

  it('should load all messages for a given key', async () => {
    let operations = [
      { k: "x", op: "put", arg: [42] },
      { k: "x", op: "del", arg: []   },
      { k: "x", op: "add", arg: [3]  }]

    const xid = server.next_xid()
    const logs = operations.map(operation => {
      const {k, op, arg} = operation
      return {op, arg, xid}
    })
    await save_operations(operations, xid)

    // Load all changes to x.
    const msgs = await load_messages('x')
    expectSetEquality(await load_messages('x'), logs)
  })
}) // load_messages

