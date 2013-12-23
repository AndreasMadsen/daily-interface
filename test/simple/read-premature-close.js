
var net = require('net');
var test = require('tap').test;
var async = require('async');
var endpoint = require('endpoint');

var now = require('../now.js')();
var setup = require('../remote.js')();
var DailyClient = require('../../daily-interface.js').Client;

setup.open();

var writes = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

test('write 20 messages', function (t) {
  var client = new DailyClient(net.connect(setup.port, '127.0.0.1'));

  function log(letter, done) {
    client.log({
      'seconds': now.second,
      'milliseconds': now.millisecond,
      'level': 1,
      'message': new Buffer('message - ' + letter)
    }, done);
  }

  async.forEach(writes, log, function () {
    client.once('close', t.end.bind(t));
    client.close();
  });
});

test('reader will stop on client close', function (t) {
  var client = new DailyClient(net.connect(setup.port, '127.0.0.1'));
  var logs = [], error = null, ended = false, closed = false;
  var closeing = false;

  var reader = client.reader({
    'startSeconds': null,
    'startMilliseconds': null,
    'endSeconds': null,
    'endMilliseconds': null,
    'levels': [1, 9]
  });

  reader
    .on('data', function (log) {
      if (!closeing) {
        closeing = true;
        client.close();
      }
      logs.push(log.message.toString());
    })
    .once('error', function (err) {
      error = err;
    })
    .once('end', function () {
      ended = true;
    })
    .once('close', function () {
      closed = true;
    });

  client.once('close', function () {
    t.ok(logs.length < 10);
    t.equal(logs[0], 'message - A');
    t.equal(error, null);
    t.equal(ended, false);
    t.equal(closed, true);
    t.end();
  });
});

test('reader will stop on socket destroy', function (t) {
  var socket = net.connect(setup.port, '127.0.0.1');
  var client = new DailyClient(socket);
  var logs = [], error = null, ended = false, closed = false;
  var closeing = false;

  var reader = client.reader({
    'startSeconds': null,
    'startMilliseconds': null,
    'endSeconds': null,
    'endMilliseconds': null,
    'levels': [1, 9]
  });

  reader
    .on('data', function (log) {
      if (!closeing) {
        closeing = true;
        socket.destroy();
      }
      logs.push(log.message.toString());
    })
    .once('error', function (err) {
      error = err;
    })
    .once('end', function () {
      ended = true;
    })
    .once('close', function () {
      closed = true;
    });

  client.once('close', function () {
    t.ok(logs.length < 10);
    t.equal(logs[0], 'message - A');
    t.equal(error.message, 'socket closed prematurely');
    t.equal(ended, false);
    t.equal(closed, true);
    t.end();
  });
});

test('reader will stop on server kill', function (t) {
  var socket = net.connect(setup.port, '127.0.0.1');
  var client = new DailyClient(socket);
  var logs = [], error = null, ended = false, closed = false;
  var closeing = false;

  var reader = client.reader({
    'startSeconds': null,
    'startMilliseconds': null,
    'endSeconds': null,
    'endMilliseconds': null,
    'levels': [1, 9]
  });

  reader
    .on('data', function (log) {
      if (!closeing) {
        closeing = true;
        setup.kill();
      }
      logs.push(log.message.toString());
    })
    .once('error', function (err) {
      error = err;
    })
    .once('end', function () {
      ended = true;
    })
    .once('close', function () {
      closed = true;
    });

  // Ignore client errors, they are expected when the server gets killed
  client.once('error', function (err) { });

  client.once('close', function () {
    t.ok(logs.length < 10);
    t.equal(logs[0], 'message - A');
    t.equal(error.message, 'socket closed prematurely');
    t.equal(ended, false);
    t.equal(closed, true);
    t.end();
  });
});
