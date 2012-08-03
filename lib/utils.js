var slice = Array.prototype.slice;

var debug = exports.debug = require('debug')('miniget');

exports.merge = function (obj) {
  slice.call(arguments, 1).forEach(function(source) {
    for (var prop in source) {
      obj[prop] = source[prop];
    }
  });
  return obj;
};
