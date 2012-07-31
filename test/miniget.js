var miniget = require('../index')
  , expect = require('expect.js')

describe('miniget', function () {
  describe('()', function () {
    it('should return Miniget instance', function (done) {
      expect(miniget() instanceof miniget.Miniget).to.be.ok()
      done()
    })
  })

  describe('(options)', function () {
    it('should override defaults options', function (done) {
      var options = {
        port: 10010,
        host: 'foobar'
      };
      var M = miniget(options);

      expect(M.options.port).to.eql(10010)
      expect(M.options.host).to.eql('foobar')
      done()
    })
  })

  describe('option setter', function () {
    it('should set port', function (done) {
      var M = miniget().port(34567);
      expect(M.options.port).to.eql(34567)
      done()
    })

    it('should set host', function (done) {
      var M = miniget().host('foobar')
      expect(M.options.host).to.eql('foobar')
      done()
    })
  })
})