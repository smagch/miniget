var spider = require('../lib/spider')
  , path = require('path')
  , express = require('express')
  , expect = require('expect.js')

describe('spider', function () {
  var app;

  before(function (done) {
    app = express();
    app.use(express.static(path.resolve(__dirname, 'fixtures2')));
    app.listen(3000, done)
  })

  after(function () {
    
  })

  describe('(path)', function () {
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
})