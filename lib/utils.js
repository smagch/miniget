var slice = Array.prototype.slice;

exports.merge = function (obj) {
  slice.call(arguments, 1).forEach(function(source) {
    for (var prop in source) {
      obj[prop] = source[prop];
    }
  });
  return obj;
}