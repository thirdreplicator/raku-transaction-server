// log_message.js

const VERBS = ['put', 'del', 'add', 'rem', 'inc', 'dec']

// @flow
const gen_message = (op: string, arg: mixed[], xid: number) => {
  if (typeof op != 'string') { throw `The first argument must be a string: ${ JSON.stringify(op) }` }
  if (!arg) { throw `The 2nd argument cannot be undefined: ${ JSON.stringify(arg) }` }
  if (arg && arg && arg.constructor.name != 'Array') { throw `The 2nd argument must be an array of arguments: ${ JSON.stringify(arg)}` }
  if (typeof xid != 'number') { throw `The 3rd argument should be a number: ${ JSON.stringify(xid) }` }
  return { op, arg, xid }
}

export { VERBS, gen_message }
