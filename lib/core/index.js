const DATA_TREE_ID = Symbol.for('dataTree.action')

/**
 * Enhances a reducer to respond to dependencies made to `key`.
 * @param {string} key
 * @param {function} reducer
 */
function listenFor (key) {
  if (typeof key !== 'string') throw new TypeError('The dependency key must be a string')
  return function (reducer) {
    return function (state, action) {
      // Check if action is a dependency
      if (
        action.hasOwnProperty(DATA_TREE_ID) &&
        Symbol.for(Symbol.keyFor(action.type)) === Symbol.for(`dataTree.${key}`)
      ) {
        return Object.assign(
          {},
          state,
          {
            payload: Object.assign({}, state.entities, action.payload)
          }
        )
      }
      return reducer(state, action)
    }
  }
}

/**
 * Takes an action and a dependency mapping of form:
 * { [name]: action.payload.entities.[entityName] }
 * where [name] must match the key given to connect
 */
function setupTree (store) {
  return function (action, deps = {}) {
    // Dispatch the action
    store.dispatch(action)
    // Dispatch any dependent actions
    Object.keys(deps).map(key => {
      var subAction = {
        [DATA_TREE_ID]: true,
        type: Symbol.for(`dataTree.${key}`),
        payload: action.payload.entities[deps[key]]
      }
      store.dispatch(subAction)
    })
    // Return the original action
    return action
  }
}

module.exports = {
  setupTree,
  listenFor,
  DATA_TREE_ID
}
