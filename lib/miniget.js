/**
 * Miniget main file
 */

var http = require('http')
  , async = require('async')
  , path = require('path')
  , fs = require('fs')
  , mkdirp = require('mkdirp')
  , utils = require('./utils')
  , assert = require('assert')
  , debug = utils.debug;

/**
 * default options
 */

var defaults = {
  host: 'localhost'
, port: 3000
, out: null
, ext: null
, src: path.resolve('.')
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
 * first HEAD exec and then GET exec
 * if all requests are OK with HEAD request
 *
 * @param {String}
 * @param {Function}
 */

Miniget.prototype.batch = function (filenames, done) {
  var self = this;
  this.head(true);
  this.exec(filenames, function (err, statusCodes) {
    if (err) return done(err);
    var failed = statusCodes.filter(function (statusCode) {
      return statusCode !== 200
    });
    if (failed.length) return done(new Error('failed'))
    self.head(false);
    self.exec(filenames, done);
  });
};

/**
 * resolve paths and make palarell requests
 *
 * @param {String}
 * @param {Function}
 */

Miniget.prototype.exec = function (filenames, done) {
  if (!this.options.out && !this.options.head) {
    return done(new Error('option out is required'));
  }

  var reqPaths = filenames.map(this.resolveExt, this).map(this.resolveSrc, this);

  if (!reqPaths.length) {
    return done(new Error('no request url given'));
  }

  // TODO process.nextTick?
  debug('this.options.out : ' + this.options.out);

  var fn = this.options.head
    ? this.getHead.bind(this)
    : this.get.bind(this);

  async.map(reqPaths, fn, done);
  return this;
};

/**
 * @return {Object}
 * @api private
 */

Miniget.prototype.reqOptions = function (filename) {
  return {
    host: this.options.host
  , port: this.options.port
  , path: '/' + filename
  };
};

/**
 * make a header request
 *
 * @param {String}
 * @param {Function}
 * @api public
 */

Miniget.prototype.getHead = function (filename, done) {
  assert(typeof filename === 'string');
  if (filename[0] === '/') {
    filename = filename.substr(1);
  }

  var writePath = path.resolve(this.options.out, filename);
  debug('writePath : ' + writePath);

  var options = this.reqOptions(filename);
  options.method = 'HEAD';

  var abort;

  http.request(options, function (res) {
    debug('statusCode : ' + res.statusCode);
    // TODO make verbose option and return response
    if (!abort) done(null, res.statusCode);
  }).on('error', function (err) {
    abort = true;
    done(err);
  }).end();

  return this;
};

/**
 * make request by filename
 *
 * @param {String}
 * @param {Function}
 * @api public
 */

Miniget.prototype.get = function (filename, done) {
  function errorHandler(err) {
    if (abort) return
    abort = true
    debug('error quit')
    done(err)
  }

  assert(typeof filename === 'string');

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
        if (abort) return
        done(null, filename)
      });

    }).on('error', errorHandler);
  });

  return this;
};

/**
 * 
 */

Miniget.prototype.spider = function (filenames, done) {
  
};
