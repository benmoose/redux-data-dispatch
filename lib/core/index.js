'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.dataDispatch = exports.listenFor = exports.DATA_TREE_ID = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _utils = require('../utils');

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var DATA_TREE_ID = exports.DATA_TREE_ID = Symbol.for('dataTree.action');
var DEPS_META_KEY = 'deps';

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
 * Throws error if the dependency is not an object, or if dependency values
 * are not strings or functions.
 * @param {object} deps
 */
var _assertDependencyObjectValid = function _assertDependencyObjectValid(action) {
  var deps = action.meta[DEPS_META_KEY];
  if ((typeof deps === 'undefined' ? 'undefined' : _typeof(deps)) !== 'object') {
    throw new TypeError('meta.' + DEPS_META_KEY + ' must be an object, but got ' + (typeof deps === 'undefined' ? 'undefined' : _typeof(deps)));
  }
  Object.keys(deps).map(function (key) {
    if (typeof deps[key] !== 'function' && typeof deps[key] !== 'string') {
      throw new TypeError('Dependent reducer values must be either a function or a string, but got ' + _typeof(deps[key]) + ' for ' + key);
    }
  });
};

/**
 * Returns a boolean denoting whether the action has a meta.deps
 * key.
 * @param {object} action
 */
var _hasDependencyMapping = function _hasDependencyMapping(action) {
  return action.meta && action.meta[DEPS_META_KEY];
};

/**
 * Middleware function.
 * @param {object} store
 */
var dataDispatch = exports.dataDispatch = function dataDispatch(store) {
  return function (next) {
    return function (action) {
      if (_hasDependencyMapping(action)) {
        _assertDependencyObjectValid(action);
        var deps = action.meta[DEPS_META_KEY];
        // Call dependent actions
        Object.keys(action.meta.deps).map(function (key) {
          var _subAction;

          var subAction = (_subAction = {}, _defineProperty(_subAction, DATA_TREE_ID, true), _defineProperty(_subAction, 'type', Symbol.for('dataTree.' + key)), _defineProperty(_subAction, 'payload', typeof deps[key] === 'function'
          // dep value is function -> run function on action to get the value
          ? deps[key](action)
          // dep value is string -> access action property
          : (0, _utils.dotCaseToObjectProperty)(action, deps[key])), _subAction);
          store.dispatch(subAction);
        });
      }
      // call next middleware
      return next(action);
    };
  };
};