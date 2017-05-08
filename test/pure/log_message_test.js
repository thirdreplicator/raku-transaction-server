import Raku from 'raku'
import { expect, assert } from 'chai'
import { gen_message, VERBS } from '../../src/log_message'

const XID = 1000.001

describe('Append-only log message', () => {
  describe('gen_message()', () => {
    it('should be an object', () => {
      const message = gen_message('put', [42], XID)
      expect(message.constructor.name).to.eql('Object')
    })

    it('should be have 3 properties whose values are not undefined', () => {
      const message = gen_message('put', [42], XID)
      expect(Object.keys(message).length).to.eql(3)
      Object.keys(message).forEach(k => expect(message[k]).not.to.be.undefined)
      Object.keys(message).forEach(k => expect(message[k]).not.to.be.null)
    })

    describe('1st argument', () => {
      it('should throw an error if the 1st arg is not a string', () => {
        const call_with_no_args = () => gen_message()
        expect(call_with_no_args).to.throw(/first argument must be a string/i)
      })

      it('should be have an "op" property equal to the first argument', () => {
        let arg1 = 'put'
        let message = gen_message(arg1, [42], XID)
        expect(message.op).to.eql(arg1)

        arg1 = 'del'
        message = gen_message(arg1, [], XID)
        expect(message.op).to.eql(arg1)
      })

      it(`should be one of the allowed verbs: ${VERBS}`, () => {
        const messages = {}
        VERBS.forEach(v => messages[v] = gen_message(v, [], XID))
        VERBS.forEach(v => expect(messages[v].op).to.be.oneOf(VERBS))
        expect(gen_message('farty pants', [], XID).op).not.to.be.oneOf(VERBS)
      })
    }) // describe 1st argument

    describe('2nd argument', () => {
      it('should throw an error if undefined', () => {
        const called_without_2nd_arg = () => gen_message('del')
        expect(called_without_2nd_arg).to.throw(/2nd argument cannot be undefined/i)
      })

      it('should be have an "arg" property equalling the 2nd argument', () => {
        const message = gen_message('put', [42], XID)
        expect(message.arg).to.deep.eql([42])
      })

      it('should throw an error if the 2nd arg is not an array', () => {
        const call_message_without_array = () => gen_message('put', 42)
        expect(call_message_without_array).to.throw(/2nd argument must be an array of arguments/i)
      })
    }) // describe 2nd arg

    describe('3rd argument', () => {
      it('should throw an error if the 3rd argument is not a number', () => {
        const call_with_no_third_argument = () => gen_message('del', [])
        expect(call_with_no_third_argument).to.throw(/the 3rd argument should be a number/i)

        const call_with_string_third_argument = () => gen_message('del', [], 'hello')
        expect(call_with_no_third_argument).to.throw(/the 3rd argument should be a number/i)
      })

      it('should have an "xid" property equal to the given transaction id', () => {
        const message = gen_message('del', [], XID)
        expect(message.xid).to.eql(XID)
      })

      it('should be a number if given', () => {
        const message = gen_message('del', [], XID)
        expect(message.xid).to.be.a.number
      })
    }) // describe 3rd arg
  }) // describe gen_message()
})
