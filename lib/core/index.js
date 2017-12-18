'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.setupTree = exports.listenFor = exports.DATA_TREE_ID = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _utils = require('../utils');

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var DATA_TREE_ID = exports.DATA_TREE_ID = Symbol.for('dataTree.action');

/**
 * Enhances a reducer to respond to dependencies made to `key`.
 * @param {string} key
 * @param {function} reducer
 */
var listenFor = exports.listenFor = function listenFor(key) {
  if (typeof key !== 'string') throw new TypeError('The dependency key must be a string');
  return function (reducer) {
    return function (state, action) {
      // Check if action is a dependency
      if (action.hasOwnProperty(DATA_TREE_ID) && Symbol.for(Symbol.keyFor(action.type)) === Symbol.for('dataTree.' + key)) {
        return _extends({}, state, {
          entities: _extends({}, state.entities, action.payload)
        });
      }
      return reducer(state, action);
    };
  };
};

/**
 * Takes an action and a dependency mapping of form:
 * { [name]: action.payload.entities.[entityName] }
 * where [name] must match the key given to connect
 */
var setupTree = exports.setupTree = function setupTree(store) {
  return function (action) {
    var deps = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    Object.keys(deps).map(function (key) {
      if (typeof deps[key] !== 'function' && typeof deps[key] !== 'string') {
        throw new TypeError('Dependent reducer values must be either a function or a string, but got ' + _typeof(deps[key]) + ' for ' + key);
      }
    });
    // Dispatch any dependent actions
    Object.keys(deps).map(function (key) {
      var _subAction;

      var subAction = (_subAction = {}, _defineProperty(_subAction, DATA_TREE_ID, true), _defineProperty(_subAction, 'type', Symbol.for('dataTree.' + key)), _defineProperty(_subAction, 'payload', typeof deps[key] === 'function' ? deps[key](action) : (0, _utils.dotCaseToObjectProperty)(action, deps[key])), _subAction);
      store.dispatch(subAction);
    });
    // Dispatch the original action
    store.dispatch(action);
    // Return the original action
    return action;
  };
};