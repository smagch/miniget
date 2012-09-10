var slice = Array.prototype.slice
  , path = require('path')
  , cheerio = require('cheerio')
  , debug = require('debug')('miniget');

exports.debug = debug;

function extractLinks(html) {
  var $ = cheerio.load(html);
  return $('a:not([href^="#"],[href^="http"])').map(function () {
    return $(this).attr('href');
  });
}

function normalizeUrl(base, name) {
  if (/\/$/.test(name)) {
    name += 'index.html';
  }
  if (!/^\//.test(name)) {
    name = path.resolve(path.dirname(base), name);
  }
  return name;
}

exports.normalizeUrl = normalizeUrl;

exports.merge = function (obj) {
  slice.call(arguments, 1).forEach(function(source) {
    for (var prop in source) {
      obj[prop] = source[prop];
    }
  });
  return obj;
};

exports.getLinks = function (base, html) {
  return extractLinks(html).map(function (url) {
    return normalizeUrl(base, url);
  });
};