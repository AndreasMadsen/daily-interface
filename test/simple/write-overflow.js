
var net = require('net');
var test = require('tap').test;
var async = require('async');

var now = require('../now.js')();
var setup = require('../remote.js')();
var DailyClient = require('../../daily-interface.js').Client;

setup.open();

var CRITICAL_LIMIT = Math.pow(2, 16);

function createQueue(client, message, amount) {
  var queue = [];
  for (var i = 0; i < amount; i++) {
    queue.push(job);
  }

  function job(done) {
    client.log(message, function (err) {
      done(null, err);
    });
  }

  return queue;
}

test('overflow error', { timeout: Infinity }, function (t) {
  var client = new DailyClient(net.connect(setup.port, '127.0.0.1'));

  var writeRequest = {
    'seconds': now.second,
    'milliseconds': now.millisecond,
    'level': 1,
    'message': new Buffer('simpel write')
  };

  async.parallel(createQueue(client, writeRequest, CRITICAL_LIMIT + 1), function (err, result) {
    t.ifError(err);

    var failures = result.filter(function (error) { return error !== null; });
    t.equal(failures.length, 1);
    t.equal(failures[0].name, 'Error');
    t.equal(failures[0].message, 'too many parallel writes');

    client.once('close', t.end.bind(t));
    client.close();
  });
});

setup.close();
