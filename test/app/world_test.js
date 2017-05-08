// world_test.js
import { expect } from 'chai'
import Raku from 'raku'
import world from '../../src/world'

const raku = new Raku()

describe('world, an in-memory cache of all key-value pairs', () => {
  beforeEach(() => {
    world.clear(100)
    //return raku.deleteAll()
  })

  describe('world {}', () => {
    it('should be a js plain object', () => {
      expect(world.store === Object(world.store)).to.be.true
    })

    describe('get(k)', () => {
      it ('should retrieve value if it exists', () => {
        world.put('x', 42) // world.x == {value: 42, hits: 0}
        expect(world.get('x').value).to.eql(42)
      })

      it ('should increment hits if it exists', () => {
        world.put('x', 42) // world.x == {value: 42, hits: 0}
        expect(world.get('x').hits).to.eql(1)
        expect(world.get('x').hits).to.eql(2)
        expect(world.get('x').hits).to.eql(3)
      })

      it('should load values if they are not in the in-memory kv store', () => {
        const result = world.get('yy')
        expect(result.constructor.name).to.eql('Promise')
      })

      it('should have a hit count property', () => {
        return world.get('zz').then(zz => {
          expect(zz).to.have.property('hits')
          expect(zz.hits).to.eql(0)
        })
      })
    })

    describe('compact()', () => {
      it('should not exceed world.MAX_KEYS number of keys', () => {
        expect(world.store === Object(world.store)).to.be.true
        world.put('a', 1)
        world.put('b', 1)
        world.put('x', 1)
        world.put('y', 1)
        world.put('z', 1)
        expect(Object.keys(world.store).length).to.eql(5)
        world.compact(2)
        expect(Object.keys(world.store).length).to.eql(3)
      })

      it('should delete the elements with least amount of hits', () => {
        expect(world.store === Object(world.store)).to.be.true
        world.put('a', 1)
        world.put('b', 1)
        world.put('x', 1)
        world.put('y', 1)
        world.put('z', 1)
        world.get('a').hits = 1000
        world.get('b').hits = 1
        world.get('x').hits = 5000
        world.get('y').hits = 3
        world.get('z').hits = 55
        expect(Object.keys(world.store).sort()).to.eql(['a', 'b', 'x', 'y', 'z'])
        world.compact(2)
        expect(Object.keys(world.store).sort()).to.eql(['a', 'x', 'z'])
      })
    }) // compact

  })
})
