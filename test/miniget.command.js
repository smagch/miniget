var expect = require('expect.js')
  , express = require('express')
  , http = require('http')
  , async = require('async')
  , exec = require('child_process').exec
  , path = require('path')
  , fs = require('fs')
  , miniget = path.resolve(__dirname, '../bin/miniget')

describe('command line', function () {

  before(function (done) {
    var app = express()
    app.get('/hoge/*.html', function (req, res) {
      res.send(req.url)
    })

    http.createServer(app).listen(3020, done)
  })

  afterEach(function (done) {
    exec('rm -rf /tmp/miniget-test-command', done)
  })

  function examine(urls, done) {
    async.map(urls, function (url, fn) {
      var _url = path.normalize('/tmp/miniget-test-command/' + url)
      fs.readFile(_url, function (err, data) {
        if (err) return fn(err)
        expect(path.normalize('/' + url)).to.eql(data.toString())
        fn()
      })
    }, done)
  }

  it('should success with one request', function (done) {
    var command = miniget + ' --out /tmp/miniget-test-command --port 3020 '
      , url = 'hoge/foo.html';

    command += url;
    exec(command, function (err) {
      if (err) return done(err)
      examine([url], done)
    })
  })

  it('should success with multiple targets', function (done) {
    var command = miniget + ' --out /tmp/miniget-test-command --port 3020 '
      , urls = [];

    for (var i = 0; i < 30; i++) {
      urls.push('hoge/' + Math.random() + '.html');
    }

    command += urls.join(' ');
    exec(command, function (err) {
      if (err) return done(err)
      examine(urls, done)
    })
  })

  it('should success when arg start from /', function (done) {
    var command = miniget + ' --out /tmp/miniget-test-command --port 3020 '
      , urls = [];

    for (var i = 0; i < 30; i++) {
      urls.push('/hoge/' + Math.random() + '.html');
    }

    command += urls.join(' ');
    exec(command, function (err) {
      if (err) return done(err)
      examine(urls, done)
    })
  })

  it('should success with head option', function (done) {
    var command = miniget + ' --out /tmp/miniget-test-command --port 3020 --head '
      , urls = [];

    for (var i = 0; i < 30; i++) {
      urls.push('hoge/' + Math.random() + '.html');
    }

    command += urls.join(' ')
    exec(command, done)
  })
})