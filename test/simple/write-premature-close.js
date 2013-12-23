
var net = require('net');
var test = require('tap').test;

var now = require('../now.js')();
var setup = require('../remote.js')();
var DailyClient = require('../../daily-interface.js').Client;

setup.open();

test('write will complete on client close', function (t) {
  var client = new DailyClient(net.connect(setup.port, '127.0.0.1'));
  var done = false;

  client.log({
    'seconds': now.second,
    'milliseconds': now.millisecond,
    'level': 1,
    'message': new Buffer('single message')
  }, function (err) {
    t.equal(err, null);
    done = true;
  });

  client.close();
  client.once('close', function () {
    t.ok(done, 'log callback called');
    t.end();
  });
});

test('write will return error on socket destroy', function (t) {
  var socket = net.connect(setup.port, '127.0.0.1');
  var client = new DailyClient(socket);
  var done = false;

  client.log({
    'seconds': now.second,
    'milliseconds': now.millisecond,
    'level': 1,
    'message': new Buffer('single message')
  }, function (err) {
    t.equal(err.name, 'Error');
    t.equal(err.message, 'socket closed prematurely the result is unkown');
    done = true;
  });

  socket.destroy();
  client.once('close', function () {
    t.ok(done, 'log callback called');
    t.end();
  });
});

test('write will return error on server kill', function (t) {
  var client = new DailyClient(net.connect(setup.port, '127.0.0.1'));
  var done = false;
  var error = null;

  client.log({
    'seconds': now.second,
    'milliseconds': now.millisecond,
    'level': 1,
    'message': new Buffer('single message')
  }, function (err) {
    t.equal(err.name, 'Error');
    t.equal(err.message, 'socket closed prematurely the result is unkown');
    done = true;
  });

  client.once('error', function (err) {
    error = err;
  });

  client.once('close', function () {
    t.ok(done, 'log callback called');
    t.equal(error.message, 'read ECONNRESET');
    t.end();
  });

  setup.kill();
});
