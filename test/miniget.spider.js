var expect = require('expect.js')
  , miniget = require('../index')
  , express = require('express')
  , http = require('http')
  , path = require('path')
  , fs = require('fs')
  , async = require('async')
  , exec = require('child_process').exec

describe('miniget().spider(filename, done)', function () {
  function examine(files, done) {
    async.map(files, function (filename, next) {
      var destPath = path.resolve('/tmp/miniget-test', filename)
      expect(fs.existsSync(destPath)).to.be.ok()
      var src = fs.readFileSync(path.resolve(__dirname, 'fixtures2', filename))
        , copy = fs.readFileSync(destPath)
      expect(src).to.eql(copy)
      next()
    }, done)
  }

  var server;

  before(function (done) {
    var app = express()
    app.use(express.static(path.resolve(__dirname, 'fixtures2')));
    server = http.createServer(app).listen(3013, done)
  })

  after(function (done) {
    exec('rm -rf /tmp/miniget-test', function () {
      server.close(done)
    })
  })

  describe('basic', function () {
    var files = ['index.html', 'index2.html', 'index3.html'];
    it('should get /index{1,2,3}.html', function (done) {
      miniget()
      .port(3013)
      .out('/tmp/miniget-test')
      .spider('/index.html', function (err) {
        if (err) return done(err)
        examine(files, done)
      })
    })

    it('should get prepending / to the path', function (done) {
      miniget()
      .port(3013)
      .out('/tmp/miniget-test')
      .spider('index.html', function (err) {
        if (err) return done(err)
        examine(files, done)
      })
    })
  })
})