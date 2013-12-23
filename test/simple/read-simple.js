
var net = require('net');
var test = require('tap').test;
var async = require('async');
var endpoint = require('endpoint');

var now = require('../now.js')();
var match = require('../match.js');
var setup = require('../setup.js')();
var DailyClient = require('../../daily-interface.js').Client;

setup.open();

test('write - A', function (t) {
  var client = new DailyClient(net.connect(setup.port, '127.0.0.1'));

  client.log({
    'seconds': now.second,
    'milliseconds': now.millisecond,
    'level': 1,
    'message': new Buffer('message - A')
  }, function (err) {
    t.equal(err, null);

    client.once('close', t.end.bind(t));
    client.close();
  });
});

test('write - B', function (t) {
  var client = new DailyClient(net.connect(setup.port, '127.0.0.1'));

  client.log({
    'seconds': now.second,
    'milliseconds': now.millisecond,
    'level': 1,
    'message': new Buffer('message - B')
  }, function (err) {
    t.equal(err, null);

    client.once('close', t.end.bind(t));
    client.close();
  });
});

test('expect reader to yield two items', function (t) {
  var client = new DailyClient(net.connect(setup.port, '127.0.0.1'));

  client.reader({
    'startSeconds': null,
    'startMilliseconds': null,
    'endSeconds': null,
    'endMilliseconds': null,
    'levels': [1, 9]
  }).pipe(endpoint({objectMode: true}, function (err, rows) {
    t.equal(err, null);

    match(t, rows[0], {
      level: 1,
      seconds: now.second,
      milliseconds: now.millisecond,
      message: new Buffer('message - A')
    });

    match(t, rows[1], {
      level: 1,
      seconds: now.second,
      milliseconds: now.millisecond,
      message: new Buffer('message - B')
    });

    client.once('close', t.end.bind(t));
    client.close();
  }));
});

setup.close();
