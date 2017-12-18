/* globals describe, test, expect */

import { dotCaseToObjectProperty } from '../../src/utils'

describe('test dotCaseToObjectProperty', () => {
  const obj = {
    a: {
      x: 'foo',
      b: {
        c: {
          d: 42
        }
      }
    }
  }

  test('it returns the correct property', () => {
    expect(dotCaseToObjectProperty(obj, 'a.x')).toBe('foo')
    expect(dotCaseToObjectProperty(obj, 'a.b.c.d')).toBe(42)
  })

  test('it throws a TypeError if property does not exist', () => {
    expect(() => dotCaseToObjectProperty(obj, 'a.b._c._d')).toThrowError(TypeError)
  })

  test('it works with a custom separator', () => {
    expect(dotCaseToObjectProperty(obj, 'a*b*c*d', '*')).toBe(42)
  })
})
