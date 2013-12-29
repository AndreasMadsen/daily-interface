
var fs = require('fs');
var net = require('net');
var test = require('tap').test;
var path = require('path');
var async = require('async');
var wrench = require('wrench');
var endpoint = require('endpoint');
var DailyStorage = require('daily-storage');
var DailyServer = require('../daily-interface.js').Server;

var DB_PATH = path.resolve(__dirname, 'temp.db');

function ServerSetup() {
  if (!(this instanceof ServerSetup)) return new ServerSetup();

  if (fs.existsSync(DB_PATH)) wrench.rmdirSyncRecursive(DB_PATH);
  this.server = null;
  this.handler = null;
  this.port = 0;
}
module.exports = ServerSetup;

ServerSetup.prototype.open = function () {
  var self = this;

  test('open daily server', function (t) {
    self.handler = new DailyServer(new DailyStorage(DB_PATH));

    self.server = net.createServer(function (socket) {
      self.handler.dispatch(socket);
    });

    self.server.listen(0, '127.0.0.1', function () {
      self.port = self.server.address().port;
      t.end();
    });
  });
};

ServerSetup.prototype.dump = function (callback) {
  var reader = this.handler._storage.reader({
    'type': 'read-start',
    'startSeconds': null,
    'startMilliseconds': null,
    'endSeconds': null,
    'endMilliseconds': null,
    'levels': [0, 9]
  });

  reader.pipe(endpoint({ objectMode: true }, callback));
};

ServerSetup.prototype.close = function () {
  var self = this;

  test('close daily server', function (t) {
    async.parallel([
      function (done) {
        self.handler.once('close', done);
        self.handler.close();
      },
      function (done) {
        self.server.once('close', done);
        self.server.close();
      }
    ], function () {
      t.end();
    });
  });
};
