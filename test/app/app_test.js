// app_test.js

import { expect, assert } from 'chai'
import fetch from 'node-fetch'
import Raku from 'raku'
import is_plain from 'lodash.isplainobject'

import server from '../../src/server'
import { save_message, gen_message } from '../../src/log_message'

const BASE = 'http://localhost:3000'
const raku = new Raku()

const request = (...args) => {
  let [url, ...opts] = args
  if (opts[0] && typeof opts[0].method == 'string' && opts[0].method.match(/POST/i)) {
    opts[0].headers = { 'Content-Type': 'application/json' }
    opts[0].body = JSON.stringify(opts[0].body)
  }
  return fetch(BASE + url, ...opts)
}

describe('Transaction server', () => {
  before(() => server.restart(3000))
  beforeEach(() => {
    server.world.clear()
    return raku.deleteAll()
  })
  after(() => server.close())

  describe('server.next_xid', () => {
    it('should generate unique, monotonic increasing transaction ids', async () => {
      expect(server.next_xid()).to.eql(1)
      expect(server.next_xid()).to.eql(2)
    })
  }) // next_xid

  describe('GET /ping', () => {
    it('should return "pong"', () => {
      return request('/ping')
        .then(res => expect(res.status).to.eql(200))
    })
  })

  describe('Manipulating world via REST', () => {
    describe('When value EXISTS in cache,', () => {
      describe('get: GET /world/:key', () => {
        it('should return the value as json', () => {
          server.world.store['x'] = {value: 'hello', hits: 100}

          return request('/world/x')
            .then(res => res.json())
            .then(json => expect(json).to.eql({x: 'hello'}))
        })
      })

      describe('POST /world', () => {
        it('should set world.store.x=42 if the operation is { k:"x", op:"put", arg: [42] }', () => {
          server.world.store['x'] = {value: 'hello', hits: 100}
          return request('/world', { method: 'POST',
                                     body: [{k: "x", op: "put", arg: [42]}]
            })
            .then(res => {
               expect(server.world.store['x']).to.eql({value:42, hits: 101})
            })
        })

        it('should delete world.store.x if the operation is {k: "x", op: "del", arg: []}', () => {
          server.world.store['x'] = {value: 'hello', hits: 100}
          return request('/world', { method: 'POST',
                                     body: [{k: "x", op: "del", arg: []}]
            })
            .then(res => {
              expect(server.world.store['x']).to.eql({value: null, hits: 101})
            })
        })

        it('should increment world.store.x=5000 to 5001 if the operation is {k: "x", op: "inc", arg: []}', () => {
          server.world.store['x'] = {value: 5000, hits: 100}
          return request('/world', { method: 'POST',
                                     body: [{k: "x", op: "inc", arg: []}]
            })
            .then(res => {
              expect(server.world.store['x']).to.eql({value: 5001, hits: 101})
            })
        })

        it('should increment world.store.x=5000 by 7 to 5007 if the operation is {k: "x", op: "inc", arg: [7]}', () => {
          server.world.store['x'] = {value: 5000, hits: 100}
          return request('/world', { method: 'POST',
                                     body: [{k: "x", op: "inc", arg: [7]}]
            })
            .then(res => {
              expect(server.world.store['x']).to.eql({value: 5007, hits: 101})
            })
        })

        it('should decrement world.store.x=5000 to 4999 if the operation is {k: "x", op: "inc", arg: []}', () => {
          server.world.store['x'] = {value: 5000, hits: 100}
          return request('/world', { method: 'POST',
                                     body: [{k: "x", op: "dec", arg: []}]
            })
            .then(res => {
              expect(server.world.store['x']).to.eql({value: 4999, hits: 101})
            })
        })

        it('should add element 999, to world.store.x=[1,2,3] to [1,2,3,999] if the operation is {k: "x", op: "add", arg: [999]}', () => {
          server.world.store['x'] = {value: [1,2,3], hits: 100}
          return request('/world', { method: 'POST',
                                     body: [{k: "x", op: "add", arg: [999]}]
            })
            .then(res => {
              expect(server.world.store['x']).to.eql({value: [1, 2, 3, 999], hits: 101})
            })
        })

        it('should remove element 299, to world.store.x=[1, 2, 299, 3] to [1,2,3] if the operation is {k: "x", op: "rem", arg: [299]}', () => {
          server.world.store['x'] = {value: [1, 2, 299, 3], hits: 100}
          return request('/world', { method: 'POST',
                                     body: [{k: "x", op: "rem", arg: [299]}]
            })
            .then(res => {
              expect(server.world.store['x']).to.eql({value: [1, 2, 3], hits: 101})
            })
        })
      }) // describe put: POST /world
    }) // When value exists in cache

    describe('when value does not exist in cache', () => {
      describe('get: GET /world/:key', () => {
        it('should load values from disk into world', () => {
          const p1 = raku.sadd('x', JSON.stringify({op: "put", arg: ['hello'], xid: server.next_xid()}))
          const p2 = raku.sadd('x', JSON.stringify({op: "put", arg: [0], xid: server.next_xid()}))
          const p3 = raku.sadd('x', JSON.stringify({op: "put", arg: [[1,2,3]], xid: server.next_xid()}))
          return Promise.all([p1, p2, p3])
            .then(_ => request('/world/x'))
            .then(res => res.json())
            .then(json => expect(json).to.eql({x: [1, 2, 3]}))
            .then(_ => expect(server.world.store['x'].value).to.eql([1,2,3]))
        })
      }) // get GET /world/:key

      describe('mget: GET /world/mget', () => {
        it('should load a values from world as soon as it is available in the cache.', () => {
          // Simulate x value stored on disk, but not yet loaded into the cache.
          return raku.sadd('x', JSON.stringify({op: "put", arg: [[1,2,3]], xid: server.next_xid()}))
            .then(_ => request('/mget?q=x'))
            .then(res => res.json())
            .then(res => expect(res).to.eql({x: [1, 2, 3]}))
        })

        it('should load multiple values from from data store, update the world, then take the values from the world as soon as both are available in the world cache.', () => {
          // Simulate x and y values stored on disk, but not yet loaded into the cache.
          const store_x0= raku.sadd('x', JSON.stringify({op: "put", arg: [{a: 42}], xid: server.next_xid()}))
          const store_x1= raku.sadd('x', JSON.stringify({op: "put", arg: [[1,2,3]], xid: server.next_xid()}))
          const store_y = raku.sadd('y', JSON.stringify({op: "put", arg: ['hello'], xid: server.next_xid()}))
          return Promise.all([store_x0, store_x1, store_y])
            .then(_ => request('/mget?q=x,y'))
            .then(res => res.json())
            .then(res => expect(res).to.eql({x: [1, 2, 3], y: 'hello'}))
        })
      }) // mget: Get /world/mget

      describe('destructive operations', () => {
        describe('put', () => {
          it('should add the put operation to the log', () => {
            const xid = server.next_xid()
            return request('/world', { method: 'POST', body: [{k: "x", op: "put", arg: [43]}] })
              .then(_ => {
                return raku.sismember('x', JSON.stringify({op: "put", arg: [43], xid: (xid + 1)}))
              })
              .then(result => expect(result).to.be.true)
              .then(_ => expect(server.world.store['x'].value).to.eql(43))
          })
        })

        describe('del', () => {
          it('should add the del operation to the log', () => {
            const xid = server.next_xid()
            return request('/world', { method: 'POST', body: [{k: "x", op: "del", arg: []}] })
              .then(_ => {
                return raku.sismember('x', JSON.stringify({op: "del", arg: [], xid: (xid + 1)}))
              })
              .then(result => expect(result).to.be.true)
              .then(_ => expect(server.world.store['x'].value).to.eql(null))
          })
        }) // del

        describe('inc', () => {
          it('should add the inc operation to the log', () => {
            const xid = server.next_xid()
            return request('/world', { method: 'POST', body: [{k: "x", op: "inc", arg: [5]}] })
              .then(_ => {
                return raku.sismember('x', JSON.stringify({op: "inc", arg: [5], xid: (xid + 1)}))
              })
              .then(result => expect(result).to.be.true)
              .then(_ => expect(server.world.store['x'].value).to.eql(5))
          })
        }) // inc

        describe('dec', () => {
          it('should add the dec operation to the log', () => {
            const xid = server.next_xid()
            return request('/world', { method: 'POST', body: [{k: "x", op: "dec", arg: [3]}] })
              .then(_ => {
                return raku.sismember('x', JSON.stringify({op: "dec", arg: [3], xid: (xid + 1)}))
              })
              .then(result => expect(result).to.be.true)
              .then(_ => expect(server.world.store['x'].value).to.eql(-3))
              .catch(e => console.log(e))
          })
        }) // dec

        describe('add', () => {
          it('should add the add operation to the log', () => {
            const xid = server.next_xid()
            return request('/world', { method: 'POST', body: [{k: "x", op: "add", arg: ['hello']}] })
              .then(_ => {
                return raku.sismember('x', JSON.stringify({op: "add", arg: ['hello'], xid: (xid + 1)}))
              })
              .then(result => expect(result).to.be.true)
              .then(_ => expect(server.world.store['x'].value).to.eql(['hello']))
          })
        }) // add

        describe('rem', () => {
          it('should add the rem operation to the log', () => {
            const xid = server.next_xid()
            return request('/world', { method: 'POST', body: [{k: "x", op: "rem", arg: [43]}] })
              .then(_ => {
                return raku.sismember('x', JSON.stringify({op: "rem", arg: [43], xid: (xid + 1)}))
              })
              .then(result => expect(result).to.be.true)
              .then(_ => expect(server.world.store['x'].value).to.eql([]))
          })
        }) // rem
      }) // destructive operations
    }) // when value does nto exist in cache

  }) // Manipulation world via REST
}) // Transaction server
