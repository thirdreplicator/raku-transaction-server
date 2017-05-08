// test/helpers.js
import { expect } from 'chai'
import server from '../../src/server'
import supertest from 'supertest'

import Raku from 'raku'
const raku = new Raku()

function expectSetEquality(s1, s2) {
  expect(s1).to.deep.include.members(s2)
  expect(s2).to.deep.include.members(s1)
}

function load(k) {
  if (k.type == 'default') {
    return raku.bget(k.bucket, k.key)
  } else if (k.type == 'counters') {
    return raku.cget(k.key)
  } else if (k.type == 'sets') {
    return raku.smembers(k.key)
  }
}

async function print_keys() {
  const keys = await raku.keys()  
  const values = await Promise.all(keys.map(k => load(k)))
  keys.forEach( async k => {
    const v = await load(k)
    console.log(k.key, '->', v)

  })
  
}

function start_server(port, init_cb) {
  return server.app.listen(port, init_cb)
}

function make_request() {
  return supertest.agent(server.live)
}

export { expectSetEquality, print_keys, start_server, make_request }
