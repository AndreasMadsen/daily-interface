
var fs = require('fs');
var net = require('net');
var test = require('tap').test;
var path = require('path');
var rimraf = require('rimraf');
var DailyStorage = require('daily-storage');
var DailyServer = require('../daily-interface.js').Server;
var fork = require('child_process').fork;

var DB_PATH = path.resolve(__dirname, 'temp.db');

if (process.argv[2] === 'server') {
  var handler = new DailyServer(new DailyStorage(DB_PATH));

  var server = net.createServer(function (socket) {
    handler.dispatch(socket);
  });

  server.listen(0, '127.0.0.1', function () {
    process.send(server.address().port);
  });

  process.once('message', function () {
    handler.close();
    server.close();
  });

  return;
}

module.exports = (function () {

  function ServerSetup() {
    if (!(this instanceof ServerSetup)) return new ServerSetup();

    if (fs.existsSync(DB_PATH)) rimraf.sync(DB_PATH);
    this.child = 0;
    this.port = 0;
  }

  ServerSetup.prototype.open = function () {
    var self = this;

    test('open daily server', function (t) {
      self.child = fork(__filename, ['server']);
      self.child.once('message', function (port) {
        self.port = port;
        t.end();
      });
    });
  };

  ServerSetup.prototype.kill = function () {
    this.child.kill();
  };

  ServerSetup.prototype.close = function () {
    var self = this;

    test('close daily server', function (t) {
      self.child.once('close', t.end.bind(t));
      self.child.send('close');
    });
  };

  return ServerSetup;
})();
