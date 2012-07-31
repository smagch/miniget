var expect = require('expect.js')
  , miniget = require('../index')
  , express = require('express')
  , http = require('http')
  , path = require('path')
  , fs = require('fs')
  , async = require('async')

var app = express()
app.use(express.static(path.resolve(__dirname, 'fixtures')));
http.createServer(app).listen(3001, function () {

describe('miniget().exec(files, done)', function () {
  it('should get index.html', function (done) {
    var files = ['index.html', 'index2.html', 'index3.html'];
    miniget()
    .port(3001)
    .out('/tmp/miniget-test')
    .exec(files, function (err) {
      expect(err).not.be.ok()
      async.map(files, function (filename, next) {
        var destPath = path.resolve('/tmp/miniget-test', filename)
        expect(fs.existsSync(destPath)).to.be.ok()
        var src = fs.readFileSync(path.resolve(__dirname, 'fixtures', filename))
          , copy = fs.readFileSync(destPath)
        expect(src).to.eql(copy)
        next()
      }, done)
    })
  })
})

})

