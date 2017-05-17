// txn_response.js
//

class TxnResponse {
  constructor(res, keys) {
    this.res = res
    this.keys = keys
    this.completed = {}
    this.values    = {}
    this.status = 'in-progress'
    for (let k of keys) {
      this.completed[k] = false
      this.values[k] = undefined
    }
  }

  complete(k, v, txn_queue) {
    this.completed[k] = true
    this.values[k] = v
    if (this.num_completed() == this.keys.length) {
      this.status = 'done'
      this.res.json(this.values)
      this.clean_up(txn_queue)
    }
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
    return this.status == 'done'
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
