// server.js
import express from 'express'
import body_parser from 'body-parser'
import is_plain from 'lodash.isplainobject'
import world from './world'
import { gen_message, save_message } from './log_message'
import Raku from 'raku'
const raku = new Raku()

let server = {}

server.XID = 0

server.app = express()
server.app.use(body_parser.json())
server.live = null
server.world = world

// Routes
server.app.get('/ping', (req, res) => {
  res.json('pong')
})

server.app.get('/world/:key', function(req, res) {
  try {
    const keys = [req.params.key]
    handle_mget(keys, res)
  } catch(e) {
    console.log(`ERROR in server.app.get("/world/${req.params.key}"`)
    console.log(e)
  }
})

server.app.get('/mget', function(req, res) {
  try {
    const keys = req.query.q.split(',')
    handle_mget(keys, res)
  } catch(e) {
    console.log('ERROR in server.app.get("/mget"')
    console.log(e)
    console.log("")
  }
})

// Note: request header content-type must be set to 'application/json'.
// Input JSON is: [{k, op, arg: Array}]
// Output is 'ok' in JSON format.
server.app.post('/world', (req, res) => {
  let promises = []
  let transaction = req.body
  let xid = server.next_xid()
  transaction.forEach(operation => {
    let {k, op, arg} = operation
    if (op == 'put') {
      server.world.put(k, ...arg)
    } else if (op == 'del') {
      server.world.del(k)
    } else if (op == 'inc') {
      let m = arg[0] || 1
      server.world.inc(k, m)
    } else if (op == 'dec') {
      let m = arg[0] || 1
      server.world.dec(k, m)
    } else if (op == 'add') {
      server.world.add(k, ...arg)
    } else if (op == 'rem') {
      server.world.rem(k, ...arg)
    }
    let message = gen_message(op, arg, xid)
    promises.push(save_message(k, message))
  })

  return Promise.all(promises)
    .then(_ => res.send(JSON.stringify('ok')))
})

  /*
// * Helper functions
   */

server.next_xid = () => ++(server.XID)

server.init = async () => {
  server.XID = await raku.cget('xid')
}

const handle_mget = (keys, res) => {
  let values = world.mget(keys)
  if (is_plain(values)) {
    res.json(values)
  } else {
    world.queue_up_request(res, keys)
  }
}

server.restart = (port) => {
  if (server.live != null) {
    server.close()
  }
  server.live = server.app.listen(port)
}

server.close = async () => {
  await raku.cset('xid', server.XID)
  if (server.live != null) {
    console.log(server.live)
    server.live.close()
  }
}

server.interval = setInterval(() => {
  raku.cset('xid', server.XID)
}, 1000)

export default server
