var Weir = require('./weir')
  , addLevel = Weir.addLevel;

addLevel('trace', 10, function () {
  this.cursor.grey();
});

addLevel('info', 20, function () {
  this._write('INFO');
});

addLevel('warn', 30, function () {
  this.cursor.red();
  this._write('WARN');
  this.cursor.reset();
  this._write(' ');
});

addLevel('error', 40, function () {
  this.cursor.bg.red().black().bold();
  this._write('ERROR');
  this.cursor.reset();
  this._write(' ');
});

module.exports = new Weir({ level: 1 });