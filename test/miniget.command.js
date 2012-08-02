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
    exec('rm -rf /tmp/miniget-test-fail', done)
  })

  function examine(urls, done) {
    async.map(urls, function (url, fn) {
      fs.readFile('/tmp/miniget-test-fail/' + url, function (err, data) {
        if (err) return fn(err)
        expect('/' + url).to.eql(data.toString())
        fn()
      })
    }, done)
  }

  var command = miniget + ' --out /tmp/miniget-test-fail --port 3020 ';

  it('should success', function (done) {
    var urls = [];
    for (var i = 0; i < 10; i++) {
      urls.push('hoge/' + Math.random() + '.html');
    }

    async.forEach(urls, function (url, fn) {
      exec(command + url, fn)
    }, function (err) {
      if (err) return done(err)
      examine(urls, done)
    })
  })
})