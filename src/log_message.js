// log_message.js
import Raku from 'raku'

const raku = new Raku()

const VERBS = ['put', 'del', 'add', 'rem', 'inc', 'dec']

// @flow
const gen_message = (op: string, arg: mixed[], xid: number) => {
  if (typeof op != 'string') { throw `The first argument must be a string: ${ JSON.stringify(op) }` }
  if (!arg) { throw `The 2nd argument cannot be undefined: ${ JSON.stringify(arg) }` }
  if (arg && arg && arg.constructor.name != 'Array') { throw `The 2nd argument must be an array of arguments: ${ JSON.stringify(arg)}` }
  if (typeof xid != 'number') { throw `The 3rd argument should be a number: ${ JSON.stringify(xid) }` }
  return { op, arg, xid }
}

const save_message = (k, message) => {
  return raku.sadd(k, JSON.stringify(message))
}

const load_messages = (k) => {
  return raku.smembers(k).map(x => JSON.parse(x))
}

const save_operations = (operations, xid) => {
  const promises = []
  operations.forEach( operation => {
    const {k, op, arg} = operation
    const message = JSON.stringify(gen_message(op, arg, xid))
    promises.push(raku.sadd(k, message))
  })
  return Promise.all(promises)
}
export { VERBS, gen_message, save_message, load_messages, save_operations}
