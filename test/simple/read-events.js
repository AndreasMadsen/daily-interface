
var net = require('net');
var test = require('tap').test;
var endpoint = require('endpoint');

var now = require('../now.js')();
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

test('read all', function (t) {
  var client = new DailyClient(net.connect(setup.port, '127.0.0.1'));

  var reader = client.reader({
    'startSeconds': null,
    'startMilliseconds': null,
    'endSeconds': null,
    'endMilliseconds': null,
    'levels': [1, 9]
  });

  var data = [];
  var error = new Error('no endpoint');
  var ended = false;

  reader.pipe(endpoint({ objectMode: true }, function (err, logs) {
    data = logs;
    error = err;
  }));

  reader.once('end', function () {
    console.log('ended');
    ended = true;
  });

  reader.once('close', function () {
    t.equal(ended, true);
    t.equal(error, null);
    t.equal(data[0].level, 1);
    t.equal(data[0].message.toString(), 'message - A');
    t.equal(data[0].seconds, now.second);
    t.equal(data[0].milliseconds, now.millisecond);

    client.once('close', t.end.bind(t));
    client.close();
  });
});

setup.close();
