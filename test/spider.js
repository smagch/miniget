var spider = require('../lib/spider')
  , path = require('path')
  , express = require('express')
  , http = require('http')
  , expect = require('expect.js')

describe('spider', function () {
  var server;

  describe('(path)', function () {
    before(function (done) {
      var app = express();
      app.use(express.static(path.resolve(__dirname, 'fixtures2')));
      //app.listen(3000, done)
      server = http.createServer(app).listen(3000, done)
    })

    after(function (done) {
      server.close(done)
    })

    it('should spider when argument is a path string', function (done) {
      spider('/', function (err, results) {
        if (err) return done(err)
        expect(results).to.have.length(3)
        done()
      })
    })

    it('should fail when there is a bloken link', function (done) {
      spider('/fail.html', function (err, results) {
        expect(err).to.be.ok()
        done()
      })
    })

    it('should load relative path', function (done) {
      spider('/relative.html', function (err, results) {
        if (err) return done(err)
        expect(results).to.be.an('array')
        expect(results).to.have.length(4)
        done()
      })
    })
  })

  describe('(options)', function () {
    before(function (done) {
      var app = express();
      app.use(express.static(path.resolve(__dirname, 'fixtures2')));
      server = http.createServer(app).listen(3009, done)
    })

    after(function (done) {
      server.close(done)
    })

    it('should success with port 3009', function (done) {
      var options = {
        port: 3009
      , path: '/'
      };
      spider(options, function (err, results) {
        if (err) return done(err)
        expect(results).to.have.length(3)
        done()
      })
    })

    it('should load relative path with port 3009', function (done) {
      var options = {
        port: 3009
      , path: 'relative.html'
      };
      spider(options, function (err, results) {
        if (err) return done(err)
        expect(results).to.be.an('array')
        expect(results).to.have.length(4)
        done()
      })
    })
  })
})