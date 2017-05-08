// reconstruct_value_test.js

import { expect, assert } from 'chai'
import { reconstruct } from '../../src/reconstruct_value'

describe('Reconstruction of value from logs.', () => {
  const XID = [1000.001, 1000.002, 1000.003]

  describe('reconstruct(logs, value)', () => {
    describe('logs=[]', () => {
      it('should return the current value argument if the log is empty', () => {
        const logs = []
        expect(reconstruct(logs, 42)).to.eql(42)
      })

      it('should return null if the log is empty and the current value is undefined or null', () => {
        const logs = []
        expect(reconstruct(logs)).to.be.null
      })
    }) // describe base case

    describe('VERBS', () => {
      describe('current_value=undefined', () => {

        const NIL_VALUES = [undefined, null]
        const test_nils = expectation => NIL_VALUES.forEach(v => expectation(v))

        describe('del', () => {
          it('should return null', () => {
            const logs = [{op: 'del', arg: [], xid: XID[0]}]
            test_nils(current_value => {
              expect(reconstruct(logs, current_value)).to.eql(null)
            })
          })
        })

        describe('put', () => {
          it('should return the first argument of the argument array, arg[0]', () => {
            const logs = [{op: 'put', arg: ['asdf'], xid: XID[0]}]
            test_nils(current_value => {
              expect(reconstruct(logs, current_value)).to.eql('asdf')
            })
          })
        })

        describe('inc', () => {
          it('should assume current_value=0 and increment it by 1 when arg is empty', () => {
            const logs = [{op: 'inc', arg: [], xid: XID[0]}]
            test_nils(current_value => {
              expect(reconstruct(logs, current_value)).to.eql(1)
            })
          })

          it('should assume current_value=0 and increment the current value by 7 if arg[0]=7', () => {
            const logs = [{op: 'inc', arg: [7], xid: XID[0]}]
            test_nils(current_value => {
              expect(reconstruct(logs, current_value)).to.eql(7)
            })
          })
        })

        describe('dec', () => {
          it('should decrement the value by 1 if arg is empty', () => {
            const logs = [{op: 'dec', arg: [], xid: XID[0]}]
            test_nils(current_value => {
              expect(reconstruct(logs, current_value)).to.eql(-1)
            })
          })

          it('should decrement the value by 100 if arg[0]=100', () => {
            const logs = [{op: 'dec', arg: [100], xid: XID[0]}]
            test_nils(current_value => {
              expect(reconstruct(logs, current_value)).to.eql(-100)
            })
          })
        })

        describe('add', () => {
          it('should treat current_value as empty array, so append arg[0] to an empty array', () => {
            const logs = [{op: 'add', arg: ['hello'], xid: XID[0]}]
            test_nils(current_value => {
              expect(reconstruct(logs, current_value)).to.deep.eql(['hello'])
            })
          })
        })

        describe('rem', () => {
          it('should not do anything to the undefined current value', () => {
            const logs = [{op: 'rem', arg: ['hello'], xid: XID[0]}]
            test_nils(current_value => {
              expect(reconstruct(logs, current_value)).to.deep.eql([])
            })
          })
        })
      }) // current_value=undefined

      describe('(current_value NOT undefined)', () => {
        describe('del', () => {
          it('should return null', () => {
            const logs = [{op: 'del', arg: ['asdf'], xid: XID[0]}]
            const current_value = 1
            expect(reconstruct(logs, current_value)).to.be.null
          })
        })

        describe('put', () => {
          it('should overwrite current value to return arg[0]', () => {
            [0, 1, 'hello', ['a', 42]].forEach(arg0 => {
              [undefined, null, 0, [], '', 1, 42, ['a'], {a: 1, b:2}].forEach(current_value => {
                expect(reconstruct([{op: 'put', arg: [arg0], xid: XID[0]}], current_value)).to.eql(arg0)
              })
            })
          })
        })

        describe('inc', () => {
          it('should increment the current value by 1 if arg is empty', () => {
            [0, 1, 1000, -1000].forEach(current_value => {
              expect(reconstruct([{op: 'inc', arg: [], xid: XID[0]}], current_value)).to.eql(current_value + 1)
            })
          })

          it('should increment the current value by 7 if arg[0]=7', () => {
            [0, 1, 1000, -1000].forEach(current_value => {
              expect(reconstruct([{op: 'inc', arg: [7], xid: XID[0]}], current_value)).to.eql(current_value + 7)
            })
          })

          it('should throw an error if the argument is not a number', () => {
            expect(() => reconstruct([{op: 'inc', arg: ['hello'], xid: XID[0]}], 42))
              .to.throw(/is not a number/)
          })

          it('should throw an error if the current value is not a number', () => {
            expect(() => reconstruct([{op: 'inc', arg: [5], xid: XID[0]}], 'hello'))
              .to.throw(/is not a number/)
          })
        })

        describe('dec', () => {
          it('should decrement the value by 1 if arg[0] is undefined', () => {
            [0, 1, 1000, -1000].forEach(current_value => {
              expect(reconstruct([{op: 'dec', arg: [], xid: XID[0]}], current_value)).to.eql(current_value - 1)
            })
          })

          it('should decrement the value by 100 if arg[0] is 100', () => {
            expect(() => reconstruct([{op: 'dec', arg: ['hello'], xid: XID[0]}], 42))
              .to.throw(/is not a number/)
          })
        })

        describe('add', () => {
          it('should append arg[0] to the current value array', () => {
            expect(reconstruct([{op: 'add', arg: [0], xid: XID[0]}], ['a', 'b'])).to.eql(['a', 'b', 0])
          })

          it('should throw an error if the current value is not an array', () => {
            expect(() => reconstruct([{op: 'add', arg: ['good-bye'], xid: XID[0]}], 'hello'))
              .to.throw(/is not an array/)
          })
        })

        describe('rem', () => {
          it('should remove arg[0] of the current value array', () => {
            expect(reconstruct([{op: 'rem', arg: ['b'], xid: XID[0]}], ['a', 'b', 'c'])).to.eql(['a', 'c'])
          })

          it('should throw an error if the current value is not an array', () => {
            expect(() => reconstruct([{op: 'rem', arg: ['good-bye'], xid: XID[0]}], 'hello'))
              .to.throw(/is not an array/)
          })
        })
      })
    }) // VERBS

  }) // reconstruct
}) // describe
