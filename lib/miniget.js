/**
 * make requests
 * and write
 */

var http = require('http')
  , async = require('async')
  , path = require('path')
  , fs = require('fs')
  , mkdirp = require('mkdirp')
  , utils = require('./utils')
  , debug = require('debug')('miniget')
//  , matcher = /^views\/(.*index)\.jade/;

// module.exports = buildHtml;

var defaults = {
  host: 'localhost'
, port: 3000
, out: null
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
  this.options = utils.merge({}, defaults, options);
}

/**
 * add setter to each options
 */

Object.keys(defaults).forEach(function (key) {
  Miniget.prototype[key] = function (val) {
    this.options[key] = val;
    return this;
  };
});

/**
 * resolve paths and make palarell requests
 *
 * @param {String}
 * @param {Function}
 */

Miniget.prototype.exec = function (filenames, done) {
  if (!this.options.out) return done(new Error('option out is required'));
  var reqPaths = filenames.map(function (filename) {
    // TODO
    return filename;
  });

  if (!reqPaths.length) {
    return done(new Error('no request url given'));
  }

    // TODO add option `--to-ext`
    // var match = matcher.exec(filename);
    // if (!match || !match[1]) throw new Error('no match : ' + filename);
    //debug('file : ' + match[1] + '.html');
    //return match[1] + '.html';

  async.map(reqPaths, execGet.bind(this), done);
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
  debug('this.options.out : ' + this.options.out);

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
};