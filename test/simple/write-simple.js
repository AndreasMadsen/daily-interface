
var net = require('net');
var test = require('tap').test;
var async = require('async');

var now = require('../now.js')();
var match = require('../match.js');
var setup = require('../setup.js')();
var DailyClient = require('../../daily-interface.js').Client;

setup.open();

test('a single write', function (t) {
  var client = new DailyClient(net.connect(setup.port, '127.0.0.1'));

  client.log({
    'seconds': now.second,
    'milliseconds': now.millisecond,
    'level': 1,
    'message': new Buffer('single message')
  }, function (err) {
    t.equal(err, null);

    client.once('close', t.end.bind(t));
    client.close();
  });
});

test('expect one log item', function (t) {
  setup.dump(function (err, rows) {
    t.equal(err, null);

    match(t, rows[0], {
      type: 'read-start',
      level: 1,
      seconds: now.second,
      milliseconds: now.millisecond,
      message: new Buffer('single message')
    });

    match(t, rows[1], {
      type: 'read-stop',
      error: null
    });

    t.end();
  });
});

test('multiply writes', function (t) {
  var client = new DailyClient(net.connect(setup.port, '127.0.0.1'));

  async.parallel([
    function (done) {
      client.log({
        'seconds': now.second,
        'milliseconds': now.millisecond,
        'level': 1,
        'message': new Buffer('first message')
      }, done);
    },
    function (done) {
      client.log({
        'seconds': now.second,
        'milliseconds': now.millisecond,
        'level': 1,
        'message': new Buffer('second message')
      }, done);
    }
  ], function (err) {
    t.ifError(err);

    client.once('close', t.end.bind(t));
    client.close();
  });
});

test('expect one log item', function (t) {
  setup.dump(function (err, rows) {
    t.equal(err, null);

    match(t, rows[0], {
      type: 'read-start',
      level: 1,
      seconds: now.second,
      milliseconds: now.millisecond,
      message: new Buffer('single message')
    });

    match(t, rows[1], {
      type: 'read-start',
      level: 1,
      seconds: now.second,
      milliseconds: now.millisecond,
      message: new Buffer('first message')
    });

    match(t, rows[2], {
      type: 'read-start',
      level: 1,
      seconds: now.second,
      milliseconds: now.millisecond,
      message: new Buffer('second message')
    });

    match(t, rows[3], {
      type: 'read-stop',
      error: null
    });

    t.end();
  });
});

setup.close();
