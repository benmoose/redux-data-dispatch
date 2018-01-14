import { dotCaseToObjectProperty } from '../utils'

export const DATA_TREE_ID = Symbol.for('dataTree.action')

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
 * Throws error if the dependency values are not strings or functions.
 * @param {object} deps
 */
const _checkDependencyObject = deps => {
  Object.keys(deps).map(key => {
    if (typeof deps[key] !== 'function' && typeof deps[key] !== 'string') {
      throw new TypeError('Dependent reducer values must be either a function or a string, but got ' + typeof deps[key] + ' for ' + key)
    }
  })
}

export const dataDispatch = store => next => (action, deps = {}) => {
  _checkDependencyObject(deps)
  // Call dependent actions
  Object.keys(deps).map((key) => {
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
  // dispatch original action
  return next(action)
}
