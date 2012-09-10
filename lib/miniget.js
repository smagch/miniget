/**
 * Miniget main file
 */

var http = require('http')
  , async = require('async')
  , path = require('path')
  , fs = require('fs')
  , mkdirp = require('mkdirp')
  , assert = require('assert')
  , debug = require('debug')('miniget')
  , logger = require('./logger')
  , utils = require('./utils')
  , spider = require('./spider')

/**
 * default options
 */

var defaults = {
  host: 'localhost'
, port: 3000
, out: null
, ext: null
, src: path.resolve('.')
, recursive: false
, head: false
};

/**
 * Example
 *   miniget()
 *    .host('localhost')
 *    .port(3000)
 *    .exec(["hoge.html", "foo.html"], function (err) {
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
 * export defaults opitons
 */

exports.defaults = defaults;

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
 * add setter method to each options
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
 *   when `ext` option is `.jade=.html`,
 *   then replace filename's extension to `.html`
 *   if it's extension is `.jade`
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

/**
 * resolve path by src option
 *
 * @param {String}
 * @api private
 */

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
  var reqPaths = filenames.map(this.resolveExt, this).map(this.resolveSrc, this);
  if (!reqPaths.length) {
    return done(new Error('no request url given'));
  }

  var fn = this.options.head
    ? this.ping.bind(this)
    : this.options.recursive
    ? this.spider.bind(this)
    : this.options.out
    ? this.write.bind(this)
    : this.ping.bind(this);

  async.map(reqPaths, fn, done);
  return this;
};

/**
 * spider
 * if options.out `write`
 * else return filenames
 */

Miniget.prototype.spider = function (filename, done) {
  var self = this;
  debug('about to spider ' + filename);
  var options = {};
  options.port = this.options.port;
  options.host = this.options.host;
  options.path = filename;
  spider(options, function (err, results) {
    if (err) return done(err);
    if (self.options.out) {
      async.map(results, self.write.bind(self), done);
    } else {
      done(null, results);
    }
  });
  return this;
};

/**
 * @return {Object}
 * @api private
 */

Miniget.prototype.reqOptions = function (filename) {
  var options = {
    host: this.options.host
  , port: this.options.port
  , path: '/' + filename
  };

  if (this.options.head) options.method = 'HEAD';
  return options;
};

/**
 * make a request and see statusCode
 *
 * @param {String}
 * @param {Function}
 * @api public
 */

Miniget.prototype.ping = function (filename, done) {
  assert(typeof filename === 'string');
  var options = this.reqOptions(filename);

  http.request(options, function (res) {
    if (res.statusCode !== 200) {
      logger.error((options.method || 'GET')
        + ' ' + filename + ' ' + res.statusCode);
    } else {
      logger.http((options.method || 'GET') + ' ' + filename + ' OK');
    }
    done(null, filename);
  }).on('error', done).end();

  return this;
};

/**
 * make request by filename
 *
 * @param {String}
 * @param {Function}
 */

Miniget.prototype.write = function (filename, done) {
  function errorHandler(err) {
    if (abort) return
    abort = true
    debug('error quit')
    done(err)
  }

  assert(typeof filename === 'string');
  assert(!!this.options.out);

  if (filename[0] === '/') {
    filename = filename.substr(1);
  }

  var self = this
    , writePath = path.resolve(this.options.out, filename)
    , abort;

  debug('writePath : ' + writePath);

  mkdirp(path.dirname(writePath), function (err) {
    if (err) return done(err);
    var options = self.reqOptions(filename);
    http.get(options, function (res) {
      debug('statusCode : ' + res.statusCode);
      if (res.statusCode !== 200) {
        return errorHandler(new Error('server status got ' + res.statusCode));
      }

      res.pipe(fs.createWriteStream(writePath))
      .on('error', errorHandler)
      .on('close', function () {
        if (abort) return;
        debug('successfully close');
        done(null, filename);
      });
    }).on('error', errorHandler);
  });

  return this;
};