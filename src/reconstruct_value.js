// reconstruct_value.js

function nil(x) {
  return x == undefined || x == null
}

const reconstruct = (logs, current_value) => {
  // Pre: `logs` is sorted by xid in increasing order
  let next_value = current_value == undefined ? null : current_value
  if (logs.length == 0) return next_value
  const [head, ...rest] = logs
  const {op, arg} = head
  if (typeof head == 'string') { throw 'You need to parse the logs into JSON using JSON.parse before reconstructing the value.' }
  if (op == 'del') {
    next_value = null
  } else if (op == 'put') {
    next_value = nil(arg[0]) ? null : arg[0]
  } else if (op == 'inc' || op == 'dec') {
    let amount = nil(arg[0]) ? 1 : arg[0]
    if (typeof amount != 'number') throw 'The argument is not a number:' + JSON.stringify(amount)
    if (op == 'dec') amount *= -1
    if (nil(next_value)) next_value = 0
    if (typeof next_value != 'number') throw 'The current value is not a number:' + JSON.stringify(amount)
    next_value += amount
  } else if (op == 'add' || op == 'rem') {
    next_value = next_value || []
    if (!Array.isArray(next_value)) throw 'The current value is not an array: ' + JSON.stringify(next_value)
    if (op == 'add') {
      let arg0 = nil(arg[0]) ? [] : [ arg[0] ]
      next_value = next_value.concat( arg0 )
    } else if (op == 'rem') {
      if (!nil(arg[0])) {
        next_value = next_value.filter((x) => x != arg[0])
      }
    }
  }

  if (rest.length > 0) {
    return reconstruct(rest, next_value)
  } else {
    return next_value
  }
}

export { reconstruct }
