
var net = require('net');
var test = require('tap').test;
var async = require('async');

var now = require('../now.js')();
var setup = require('../setup.js')();
var DailyClient = require('../../daily-interface.js').Client;

setup.open();

var writes = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

test('write 10 messages', function (t) {
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

test('expect reader to yield two items', function (t) {
  var client = new DailyClient(net.connect(setup.port, '127.0.0.1'));

  var reader = client.reader({
    'startSeconds': null,
    'startMilliseconds': null,
    'endSeconds': null,
    'endMilliseconds': null,
    'levels': [1, 9]
  });

  var closeing = false;
  var logs = [];
  reader.on('data', function (log) {
    if (!closeing) {
      closeing = true;
      reader.close();
    }

    logs.push(log.message.toString());
  });

  reader.once('close', function () {
    // its hard to say how many logs should be returned before the server ends
    // the reader, but less than five seams reasonable, and there should
    // be at least one.
    t.ok(logs.length < 5, 'the reader was stoped');
    t.equal(logs[0], 'message - A');

    client.once('close', t.end.bind(t));
    client.close();
  });
});

setup.close();
