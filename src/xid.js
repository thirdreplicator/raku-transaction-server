// @flow
function gen_xid(logical_time: number, client_id: number): number {
  return logical_time + client_id/1000
}

export { gen_xid }
