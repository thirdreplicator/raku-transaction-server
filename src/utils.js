// utils.js

const is_waiting = (v) => {
  return typeof v == 'object' && v.constructor.name == 'Promise'
}

const is_empty = (v) => {
  return v == undefined || v == null
}

const utils = { is_waiting, is_empty }

export { is_waiting, is_empty }
