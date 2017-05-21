// txn_response.js
//

import { is_waiting } from './utils'

class TxnResponse {
  constructor(res, keys, store) {
    this.res = res
    this.keys = keys
    this.completed = {}
    this.values    = {}
    this.status = 'in-progress'
    for (let k of keys) {
      this.completed[k] = false
      this.values[k] = undefined
    }
    // Mark the completed keys as completed.
    this.update_values(store)
  }

  mark_complete(k, v) {
    this.completed[k] = true
    this.values[k] = v
  }

  completed_kvs(store) {
    const keys_with_values = this.keys.filter(k => !is_waiting(store[k]))
    let kv_pairs = {}
    keys_with_values.forEach(k => {
      kv_pairs[k] = store[k].value
    })
    return kv_pairs
  }

  update_values(store) {
    const latest_values = this.completed_kvs(store)
    Object.keys(latest_values).forEach(k => {
      this.completed[k] = true
    })
    Object.assign(this.values, latest_values)
  }

  num_completed() {
    let count = 0
    for (let k of this.keys) {
      if (this.completed[k] == true) {
        count++
      }
    }
    return count
  }

  send() {
    this.res.send(this.values)
  }

  is_done() {
    return this.num_completed() == this.keys.length
  }

  clean_up(txn_queue) {
    this.keys.forEach(k => {
      txn_queue[k] = txn_queue[k].filter(x => x != this)
      if (txn_queue[k].length == 0) {
        txn_queue[k] = null
        delete txn_queue[k]
      }
    })
  }
}

export default TxnResponse
