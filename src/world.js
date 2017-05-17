// world.js
import is_plain from 'lodash.isplainobject'
import TxnResponse from './txn_response'
import { reconstruct } from './reconstruct_value'
import Raku from 'raku'

const raku = new Raku()

const store = {}
const txn_queue = {}

let MAX_KEYS = 1000000
let MIN_KEYS = 800000

const load = (k) => {
  return raku.smembers(k)
    .then(mem => {
      return mem.map(JSON.parse)
    })
    .then(logs => {
      return sort_logs(logs)})
    .then(logs => {
      const value = reconstruct(logs)
      return value
    })
    .then(v => {
      store[k] = { value: v, hits: 0 }
      return update_request(k, v)
    })
}

const sort_logs = (logs) => {
  return logs.sort((a, b) => a.xid > b.xid)
}

const queue_key = (key, txn_resp) => {
  if (txn_queue[key] == undefined) { txn_queue[key] = [] }
  txn_queue[key].push(txn_resp)
}

const queue_up_request = (res, keys) => {
  const txn_resp = new TxnResponse(res, keys)
  for(let k of keys) {
    queue_key(k, txn_resp)
  }
}

const update_request = (k, v) => {
  if (Array.isArray(txn_queue[k])) {
    txn_queue[k].forEach(request => {
      if (!request.is_done()) {
        request.complete(k, v, txn_queue)
      }
    })
  } else {
    return txn_queue[k]
  }
}

const is_waiting = (v) => {
  return typeof v == 'object' && v.constructor.name == 'Promise'
}

const is_empty = (v) => {
  return v == undefined || v == null
}

const mget = (keys) => {
  let result = {}
  let has_waiting = false
  for (let k of keys) {
    result[k] = world.get(k)
    if (is_waiting(result[k])) {
      has_waiting = true
    }
  }
  if (has_waiting) {
    return false
  } else {
    Object.keys(result).forEach(k => {
      let v = result[k]
      v.hits++
      const value = is_plain(v) ? v.value : v
      result[k] = value
    })
    return result
  }
}

const get = (k) => {
  if (is_empty(store[k])) {
    store[k] = load(k)
  }
  return store[k]
}

const init_store = (k, v0) => {
  if (is_empty(store[k])) {
    store[k] = { value: v0, hits: 0 }
  }
}

const put = (k, v) => {
  init_store(k)
  store[k].hits++
  store[k].value = v
  return store[k]
}

// @need_test
const del = (k) => {
  init_store(k)
  store[k].hits++
  store[k].value = null
  return store[k]
}

// @need_test
const inc = (k, i) => {
  init_store(k, 0)
  store[k].hits++
  store[k].value += i
  return store[k]
}

// @need_test
const dec = (k, i) => {
  init_store(k, 0)
  store[k].hits++
  store[k].value -= i
  return store[k]
}

// @need_test
const add = (k, z) => {
  init_store(k, [])
  store[k].hits++
  store[k].value.push(z)
  return store[k]
}

// @need_test
const rem = (k, item) => {
  init_store(k, [])
  store[k].hits++
  store[k].value = store[k].value.filter(x => x != item)
  return store[k]
}

const clear = (n = Object.keys(store).length) => {
  const keys = Object.keys(store)
    .reduce((sum, k) => sum.concat({k, hits: store[k].hits}), [])
    .sort((a, b) => a.hits > b.hits)
    .map(obj => obj.k)

  for (let i=0; i < n; i++) {
    let k = keys[i]
    store[k] = null
    delete store[k]
  }
}

const compact = (n) => {
  const num_delete = n || MAX_KEYS - MIN_KEYS
  clear(n)
}

const world = { store, get, mget, clear, compact, put, del, inc, dec, add, rem, queue_up_request }

export default world
