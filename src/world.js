// world.js
import TxnResponse from './txn_response'
import { reconstruct } from './reconstruct_value'
import { is_waiting, is_empty } from './utils'
import is_plain from 'lodash.isplainobject'

import Raku from 'raku'

const raku = new Raku()

const store = {}
const txn_queue = {}

let MAX_KEYS = 1000000
let MIN_KEYS = 800000

const load = (k, keys) => {
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
      return update_requests(k, v)
    })
    .catch(e => {
      console.log(`ERROR while load(${k}, ${keys}) was called:`, e)
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
  const txn_resp = new TxnResponse(res, keys, store)
  for(let k of keys) {
    queue_key(k, txn_resp)
  }
}

const update_requests = (k, v) => {
  if (Array.isArray(txn_queue[k])) {
    txn_queue[k].forEach(request => {
      if (!request.is_done()) {
        request.mark_complete(k, v)
        if (request.is_done()) {
          request.update_values(store)
          request.send()
          request.clean_up(txn_queue)
        }
      }
    })
  } else {
    console.warn(`WARNING: txn_queue[${k}] is not an array: ${txn_queue[k]}`)
    return txn_queue[k]
  }
}


const mget = (keys) => {
  let result = {}
  let has_waiting = false
  for (let k of keys) {
    result[k] = world.get(k, keys)
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

// Pass in a complete list of keys so that fresh
//   values can be refetched when the load promise completes.
const get = (k, keys) => {
  if (is_empty(store[k])) {
    // Load will return a promise.
    store[k] = load(k, keys)
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

  // Delete the n least popular keys.
  for (let i=0; i < n; i++) {
    let k = keys[i]
    store[k] = null
    delete store[k]
  }

  // Reset the popularity counter for the remaining keys.
  // Otherwise, they will never go away if they get too high.
  Object.keys(store).forEach(k => {
    store[k].hits = 0
  })
}

const compact = (n) => {
  const num_delete = n || MAX_KEYS - MIN_KEYS
  clear(n)
}

const world = { store, get, mget, clear, compact, put, del, inc, dec, add, rem, queue_up_request }

export default world
