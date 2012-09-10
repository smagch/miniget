var cheerio = require('cheerio')
  , events = require('events')
  , debug = require('debug')('miniget')
  , assert = require('assert')
  , http = require('http')
  , async = require('async')
  , EventEmitter = events.EventEmitter
  , inherits = require('util').inherits
  , utils = require('./utils')
  , logger = require('./logger')

/**
 * maxDepth
 * reporter - archy by default
 */

var defaults = {
  host: 'localhost'
, port: 3000
};

/**
 * when all spidering done and ok, return with no error
 * if set logger, log it
 * when there is a broken link, then log it and throw Error
 *
 * By default, it doesn't perform writing to File System
 */

module.exports = exports = function (options, done) {
  return new Spider(options, done);
}

exports.Spider = Spider;

function Spider(options, done) {
  this._resolved = {};
  this._loading = {};
  this._depMap = {};

  EventEmitter.call(this);

  if (typeof options === 'string') {
    options = { path: options};
  }

  if (!/^\//.test(options.path)) {
    options.path = '/' + options.path;
  }

  var self = this;
  this.options = utils.merge({}, defaults, options);
  this.load(this.options.path, function (err, results) {
    if (err) return done(err);
    done(null, Object.keys(self._depMap));
  });

  return this;
}

inherits(Spider, EventEmitter);

/**
 * check if it started loading
 * @return {Boolean}
 */

Spider.prototype.loaded = function (name) {
  if (!this._loading[name]) {
    this._loading[name] = true;
    return false;
  }
  return true;
};

/**
 * register to dependencies map
 * @param {String}
 * @param {Array}
 */

Spider.prototype.depMap = function (name, deps) {
  // register as index.html when name is like "*/"
  if (/\/$/.test(name)) name += 'index.html';
  this._depMap[name] = deps;
};

/**
 * load a file by url.
 * when a file load all of its dependencies, emit "resolve" event
 *
 * @param {Stirng}
 * @param {Function} *optional
 * @api public
 */

Spider.prototype.load = function load(name, done) {
  if (this.loaded(name)) return done();
  debug('load ' + name);

  var self = this
    , options = utils.merge({}, this.options, { path: name });

  http.get(options, function (res) {
    debug('GET ' + name + ' ' + res.statusCode);
    if (res.statusCode !== 200) {
      done(new Error('GET ' + name + ' ' + res.statusCode));
    }

    var chunk = '';
    res.on('data', function (data) {
      chunk += data;
    }).on('error', done).on('end', function () {
      var deps = utils.getLinks(name, chunk);
      self.depMap(name, deps);
      async.map(deps, load.bind(self), function (err, results) {
        if (err) return done(err);
        logger.info('GET ' + name + ' OK');
        done();
      });
    });
  });

  return this;
};
