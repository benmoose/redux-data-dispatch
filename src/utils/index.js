/**
 * Gets an object property from a dotted string.
 * @param {object} obj Object to get values from
 * @param {string} selector Selector
 * @param {string} separator Property separator (defualt is '.')
 */
function dotCaseToObjectProperty (obj, selector, separator = '.') {
  var parts = selector.split(separator)
  return parts.reduce(function (acc, val) {
    var _obj = acc[val]
    if (typeof _obj === 'undefined') throw new TypeError('No property at \'' + selector + '\'. Could not find property \'' + val + '\'.')
    return _obj
  }, obj)
}

module.exports = {
  dotCaseToObjectProperty
}
