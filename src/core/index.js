import { dotCaseToObjectProperty } from '../utils'

export const DATA_TREE_ID = Symbol.for('dataTree.action')
const DEPS_META_KEY = 'deps'

/**
 * Enhances a reducer to respond to dependencies made to `key`.
 * @param {string} key
 * @param {function} reducer
 */
export const listenFor = (key) => {
  if (typeof key !== 'string') throw new TypeError('The dependency key must be a string')
  return (reducer) => {
    return (state, action) => {
      // Check if action is a dependency
      if (
        action.hasOwnProperty(DATA_TREE_ID) &&
        Symbol.for(Symbol.keyFor(action.type)) === Symbol.for(`dataTree.${key}`)
      ) {
        return {
          ...state,
          entities: {
            ...state.entities,
            ...action.payload
          }
        }
      }
      return reducer(state, action)
    }
  }
}

/**
 * Throws error if the dependency is not an object, or if dependency values
 * are not strings or functions.
 * @param {object} deps
 */
const _assertDependencyObjectValid = action => {
  const deps = action.meta[DEPS_META_KEY]
  if (typeof deps !== 'object') {
    throw new TypeError(`meta.${DEPS_META_KEY} must be an object, but got ${typeof deps}`)
  }
  Object.keys(deps).map(key => {
    if (typeof deps[key] !== 'function' && typeof deps[key] !== 'string') {
      throw new TypeError(`Dependent reducer values must be either a function or a string, but got ${typeof deps[key]} for ${key}`)
    }
  })
}

/**
 * Returns a boolean denoting whether the action has a meta.deps
 * key.
 * @param {object} action
 */
const _hasDependencyMapping = action => action.meta && action.meta[DEPS_META_KEY]

/**
 * Middleware function.
 * @param {object} store
 */
export const dataDispatch = store => next => action => {
  if (_hasDependencyMapping(action)) {
    const deps = action.meta[DEPS_META_KEY]
    _assertDependencyObjectValid(action)
    // Call dependent actions
    Object.keys(action.meta.deps).map((key) => {
      const subAction = {
        [DATA_TREE_ID]: true,
        type: Symbol.for(`dataTree.${key}`),
        payload: typeof deps[key] === 'function'
          // dep value is function -> run function on action to get the value
          ? deps[key](action)
          // dep value is string -> access action property
          : dotCaseToObjectProperty(action, deps[key])
      }
      store.dispatch(subAction)
    })
  }
  // call next middleware
  return next(action)
}
