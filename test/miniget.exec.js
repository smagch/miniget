var expect = require('expect.js')
  , miniget = require('../index')
  , express = require('express')
  , http = require('http')
  , path = require('path')
  , fs = require('fs')
  , async = require('async')
  , exec = require('child_process').exec

describe('miniget().exec(files, done)', function () {
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
    http.createServer(app).listen(3001, done)
  })

  afterEach(function (done) {
    exec('rm -rf /tmp/miniget-test', done)
  })

  describe('basic', function () {
    var files = ['index.html', 'index2.html', 'index3.html'];
    it('should get index{1,2,3}.html', function (done) {
      miniget()
      .port(3001)
      .out('/tmp/miniget-test')
      .exec(files, function (err) {
        expect(err).not.be.ok()
        examine(files, done)
      })
    })

    it('should get /index{1,2,3}.html', function (done) {
      var filesWithSep = files.map(function (filename) {
        return '/' + filename;
      });

      miniget(filesWithSep)
      .port(3001)
      .out('/tmp/miniget-test')
      .exec(files, function (err) {
        expect(err).not.be.ok()
        examine(files, done)
      })
    })

    it('should perform head request', function (done) {
      miniget()
      .port(3001)
      .head(true)
      .exec(files, function (err, results) {
        expect(err).not.be.ok()
        expect(results).to.be.an('array')
        results.forEach(function (code) {
          expect(code).to.eql(200)
        })
        done()
      })
    })
  })

  describe('with .ext()', function () {
    it('should transform extname', function (done) {
      var files = ['index.jade', 'index2.jade', 'index3.jade'];
      miniget()
      .port(3001)
      .out('/tmp/miniget-test')
      .ext('.jade=.html')
      .exec(files, function (err) {
        expect(err).not.be.ok()
        examine(['index.html', 'index2.html', 'index3.html'], done)
      })
    })
  })

  describe('with .src()', function () {
    it('should resolve path relative to src', function (done) {
      var files =
      [ 'fixtures/index.html'
      , 'fixtures/index2.html'
      , 'fixtures/index3.html'];

      miniget()
      .port(3001)
      .out('/tmp/miniget-test')
      .src('fixtures')
      .exec(files, function (err) {
        expect(err).not.be.ok()
        examine(['index.html', 'index2.html', 'index3.html'], done)
      })
    })

    it('should resolve path relative to src absolute', function (done) {
      var files =
      [ __dirname + '/fixtures/index.html'
      , __dirname + '/fixtures/index2.html'
      , __dirname + '/fixtures/index3.html'
      ];

      miniget()
      .port(3001)
      .out('/tmp/miniget-test')
      .src(__dirname + '/fixtures')
      .exec(files, function (err) {
        expect(err).not.be.ok()
        examine(['index.html', 'index2.html', 'index3.html'], done)
      })
    })
  })
})