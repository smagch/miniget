var expect = require('expect.js')
  , express = require('express')
  , http = require('http')
  , async = require('async')
  , exec = require('child_process').exec
  , path = require('path')
  , fs = require('fs')
  , miniget = path.resolve(__dirname, '../bin/miniget')

describe('command line', function () {
  describe('non-recursive', function () {
    var server;
    before(function (done) {
      var app = express()
      app.get('/hoge/*.html', function (req, res) {
        res.send(req.url)
      })

      server = http.createServer(app).listen(3020, done)
    })

    afterEach(function (done) {
      exec('rm -rf /tmp/miniget-test-command', done)
    })

    after(function (done) {
      server.close(done)
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

  describe('recursive', function () {
    var server;
    before(function (done) {
      var app = express()
      app.use(express.static(path.resolve(__dirname, 'fixtures2')));
      server = http.createServer(app).listen(3020, done)
    })

    afterEach(function (done) {
      exec('rm -rf /tmp/miniget-test-command', done)
    })

    after(function (done) {
      server.close(done)
    })

    function examine(files, done) {
      async.map(files, function (filename, next) {
        if (filename[0] === '/') filename = filename.substr(1);
        var destPath = path.resolve('/tmp/miniget-test-command', filename)
        expect(fs.existsSync(destPath)).to.be.ok()
        var src = fs.readFileSync(path.resolve(__dirname, 'fixtures2', filename))
          , copy = fs.readFileSync(destPath)
        expect(src).to.eql(copy)
        next()
      }, done)
    }

    it('should success with recursive option', function (done) {
      var command = miniget + ' --out /tmp/miniget-test-command --port 3020 --recursive';
      command += ' relative.html';
      exec(command, function (err) {
        if (err) return done(err)
        examine(['relative.html'
         , 'relative/index.html'
         , 'relative/index2.html'
         , 'relative/relative/index.html'
         ], done);
      })
    })
  })
})