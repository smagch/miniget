/**
 * Module dependencies
 */

var http = require('http')
  , async = require('async')
  , path = require('path')
  , fs = require('fs')
  , mkdirp = require('mkdirp')
  , utils = require('./utils')
  , assert = require('assert')
  , debug = require('debug')('miniget')

/**
 * default options
 */

var defaults = {
  host: 'localhost'
, port: 3000
, out: null
, ext: null
, src: path.resolve('.')
};

/**
 * Example
 *   miniget()
 *    .host('localhost')
 *    .port(3000)
 *    .exec(filenames, function (err) {
 *      // callback
 *    });
 *
 * @param {Object}
 */

module.exports = exports = function (options) {
  return new Miniget(options);
};

/**
 * export Miniget constructor
 */

exports.Miniget = Miniget;

/**
 * constructor
 *
 * @param {Object}
 */

function Miniget(options) {
  this._extmap = {};
  if (options && options.ext) {
    this.ext(options.ext);
    delete options.ext;
  }

  this.options = utils.merge({}, defaults, options);
}

/**
 * add setter to each options
 */

Object.keys(defaults).forEach(function (key) {
  if (key === 'ext') return;
  Miniget.prototype[key] = function (val) {
    this.options[key] = val;
    return this;
  };
});

/**
 * set Extension transform map
 *
 * @param {String}
 */

Miniget.prototype.ext = function (str) {
  assert(typeof str === 'string');
  var result = str.split('=');
  if (result.length !== 2) {
    throw new Error('should be like ".hoge=.foo"');
  }
  this._extmap[result[0]] = result[1];
  return this;
};

/**
 * resolve filename transforming extname
 *
 * @param {String}
 * @api private
 */

Miniget.prototype.resolveExt = function (filename) {
  var extname = path.extname(filename);
  if (this._extmap[extname]) {
    var basename = path.basename(filename, extname) + this._extmap[extname];
    filename = path.join(path.dirname(filename), basename);
  }
  return filename;
};

Miniget.prototype.resolveSrc = function (filename) {
  var src = this.options.src;
  if (src === defaults.src) return filename;
  var relativePath = path.relative(src, filename);
  debug('relativePath: ' + relativePath);
  return relativePath;
};

/**
 * resolve paths and make palarell requests
 *
 * @param {String}
 * @param {Function}
 */

Miniget.prototype.exec = function (filenames, done) {
  if (!this.options.out) return done(new Error('option out is required'));
  var reqPaths = filenames.map(this.resolveExt, this).map(this.resolveSrc, this);

  if (!reqPaths.length) {
    return done(new Error('no request url given'));
  }

  // TODO process.nextTick?
  debug('this.options.out : ' + this.options.out);
  async.map(reqPaths, execGet.bind(this), done);
  return this;
};

/**
 * make request by filename
 *
 * @param {String}
 * @param {Function}
 * @api public
 */

var execGet = Miniget.prototype.get = function (filename, done) {
  function errorHandler(err) {
    if (abort) return
    abort = true
    debug('error quit')
    done(err)
  }

  //var writePath = path.resolve('.', 'public', filename)
  var self = this
    , writePath = path.resolve(this.options.out, filename)
    , abort;

  debug('writePath : ' + writePath);

  mkdirp(path.dirname(writePath), function (err) {
    if (err) return done(err);
    var options = {
      host: self.options.host
    , port: self.options.port
    , path: '/' + filename
    };

    http.get(options, function (res) {
      debug('statusCode : ' + res.statusCode);
      if (res.statusCode !== 200) {
        return errorHandler(new Error('server status got ' + res.statusCode));
      }

      res.pipe(fs.createWriteStream(writePath))
      .on('error', errorHandler)
      .on('close', function () {
        if (abort) return
        done(null, filename)
      });

    }).on('error', errorHandler);
  });
  return this;
};