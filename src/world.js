// world.js
import Raku from 'raku'
import { reconstruct } from './reconstruct_value'
const raku = new Raku()

const store = {}
let MAX_KEYS = 1000000
let MIN_KEYS = 800000

const load = (k) => {
  return raku.smembers(k)
}

const sort_logs = (logs) => {
  return logs.sort((a, b) => a.xid > b.xid)
}

const get = (k) => {
  if (store[k] == undefined) {
    return load(k)
      .then(sort_logs)
      .then(reconstruct)
      .then(v => store[k] = {value: v, hits: 0})
  } else {
    store[k].hits++
    return store[k]
  }
}

const put = (k, v) => {
  return store[k] = {value: v, hits: 0}
}

const clear = (n) => {
  const keys = Object.keys(store)
    .reduce((sum, k) => sum.concat({k, hits: store[k].hits}), [])
    .sort((a, b) => a.hits > b.hits)
    .map(obj => obj.k)

  for (let i=0; i < n; i++) {
    store[keys[i]] = null
    delete store[keys[i]]
  }
}

const compact = (n) => {
  const num_delete = n || MAX_KEYS - MIN_KEYS
  clear(n)
}

const world = { store, get, clear, compact, put }

export default world
