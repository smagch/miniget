var expect = require('expect.js')
  , miniget = require('../index')
  , express = require('express')
  , http = require('http')
  , path = require('path')
  , fs = require('fs')
  , async = require('async')
  , exec = require('child_process').exec

describe('miniget.batch()', function () {
  var port = 3003
    , dir = '/tmp/miniget-test'

  function examine(files, done) {
    async.map(files, function (filename, next) {
      var destPath = path.resolve('/tmp/miniget-test', filename)
      expect(fs.existsSync(destPath)).to.be.ok()
      var src = fs.readFileSync(path.resolve(__dirname, 'fixtures', filename))
        , copy = fs.readFileSync(destPath)
      expect(src).to.eql(copy)
      next()
    }, done)
  }

  before(function (done) {
    var app = express()
    app.use(express.static(path.resolve(__dirname, 'fixtures')));
    http.createServer(app).listen(3003, done)
  })

  afterEach(function (done) {
    exec('rm -rf ' + dir, done)
  })

  it('should reject stop operation when one of status result is not 200', function (done) {
    var files = ['index1.html', 'index2.html', 'index3.html'];
    miniget()
    .port(port)
    .out(dir)
    .batch(files, function (err) {
      expect(err).to.be.ok()
      async.map(files, function (filename, next) {
        var destpath = path.resolve('/tmp/miniget-test', filename)
        expect(fs.existsSync(destpath)).not.to.be.ok()
        next()
      }, done)
    })
    
  })

  it('should successfully write if it is OK', function (done) {
    var files = ['index.html', 'index2.html', 'index3.html'];
    miniget()
    .port(port)
    .out(dir)
    .batch(files, function (err) {
      if (err) return done(err)
      examine(files, done)
    })
  })
})