// server.js
import express from 'express'
import body_parser from 'body-parser'
import is_plain from 'lodash.isplainobject'
import world from './world'
import { gen_message, save_message } from './log_message'
import Raku from 'raku'
const raku = new Raku()

// Logging
import fs from 'fs'
import Log from 'log'
const log = new Log('debug', fs.createWriteStream('production.log'))

let server = {}

server.XID = 0

server.app = express()
server.app.use(body_parser.json())
server.live = null
server.world = world

/*
 * Routes
 */

server.app.get('/ping', (req, res) => {
  res.json('pong')
})

server.app.get('/world/:key', function(req, res, next) {
  const keys = [req.params.key]
  handle_mget(keys, res, next)
})

server.app.get('/mget', function(req, res, next) {
  const keys = req.query.q.split(',')
  handle_mget(keys, res, next)
})

// Note: request header content-type must be set to 'application/json'.
// Input JSON is: [{k, op, arg: Array}]
// Output is 'ok' in JSON format.

server.app.post('/world', (req, res, next) => {
  try {
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

    if (process.env.NODE_ENV == 'production') {
      res.json({status: 'ok'})
    } else {
      // In test/dev environments, we need to wait until the
      //   writes finish so that we can test the state of the database.
      //   In a production environment, we won't need to wait since the
      //   the database values won't be retrieved for a long time.
      //   Clients will be getting values from the cache.
      return Promise.all(promises)
        .then(_ => res.send(JSON.stringify('ok')))
        .catch(e => next(e))
    }
  } catch (e) {
    next(e)
  }
})

server.app.post('/clear', (req, res, next) => {
  try {
    world.clear()
    res.json({status: 'ok'})
  } catch(e) {
    next(e)
  }
})

/*
 *  Error handlers
 */

if (server.app.get('env') === 'development') {
  server.app.use(function dev_error_handler(err, req, res, next) {
    console.error(err)
    res.status(err.status || 500)
    res.json({ message: err.message, error: err })
  })
}

if (server.app.get('env') === 'production') {
  server.app.use(function dev_error_handler(err, req, res, next) {
    // log error to production.log
    log.error(err)
    res.status(err.status || 500)
    res.json({ message: 'error'})
  })
}

/*
 * Helper functions
 */

server.next_xid = () => ++(server.XID)

server.init = async () => {
  server.XID = await raku.cget('xid')
}

const handle_mget = (keys, res, next) => {
  try {
    let values = world.mget(keys)
    if (is_plain(values)) {
      res.json(values)
    } else {
      world.queue_up_request(res, keys)
    }
  } catch(e) {
    return next(e)
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
    server.live.close()
  }
}

server.interval = setInterval(() => {
  raku.cset('xid', server.XID)
}, 1000)

export default server
