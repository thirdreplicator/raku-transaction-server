// server.js
import express from 'express'
import { world } from './world'
import Raku from 'raku'

let XID = 0

const raku = new Raku()

const next_xid = () => ++XID

const init = async () => {
  XID = await raku.cget('xid')
}

const close = async live => {
  await raku.cset('xid')
  live.close()
}

let app = express()
let live = null

const listen = (port) => {
  live = app.listen(port)
  return live
}

export default { app, next_xid, init, close, listen, live }
