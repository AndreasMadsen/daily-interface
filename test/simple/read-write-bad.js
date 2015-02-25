
var net = require('net');
var test = require('tap').test;
var async = require('async');
var endpoint = require('endpoint');

var now = require('../now.js')();
var setup = require('../setup.js')();
var DailyClient = require('../../daily-interface.js').Client;

setup.open();

test('read while writing', function (t) {
  var client = new DailyClient(net.connect(setup.port, '127.0.0.1'));

  async.parallel([
    function (done) {
      client.log({
        'seconds': now.second,
        'milliseconds': now.millisecond,
        'level': 1,
        'message': new Buffer('single message')
      }, done);
    }, function (done) {
      try {
        client.reader({
          'type': 'read-start',
          'startSeconds': null,
          'startMilliseconds': null,
          'endSeconds': null,
          'endMilliseconds': null,
          'levels': [1, 9]
        });
      } catch (e) {
        t.equal(e.name, 'Error');
        t.equal(e.message, 'all log writes must complete');
        done(null);
      }
    }
  ], function (err) {
    t.ifError(err);
    client.once('close', t.end.bind(t));
    client.close();
  });
});

test('read after writing', function (t) {
  var client = new DailyClient(net.connect(setup.port, '127.0.0.1'));

  async.series([
    function (done) {
      client.log({
        'seconds': now.second,
        'milliseconds': now.millisecond,
        'level': 1,
        'message': new Buffer('single message')
      }, done);
    }, function (done) {
      client.reader({
        'type': 'read-start',
        'startSeconds': null,
        'startMilliseconds': null,
        'endSeconds': null,
        'endMilliseconds': null,
        'levels': [1, 9]
      }).pipe(endpoint({ objectMode: true }, done));
    }
  ], function (err) {
    t.ifError(err);
    client.once('close', t.end.bind(t));
    client.close();
  });
});

test('write while reading', function (t) {
  var client = new DailyClient(net.connect(setup.port, '127.0.0.1'));

  async.parallel([
    function (done) {
      client.reader({
        'type': 'read-start',
        'startSeconds': null,
        'startMilliseconds': null,
        'endSeconds': null,
        'endMilliseconds': null,
        'levels': [1, 9]
      }).pipe(endpoint({ objectMode: true }, done));
    }, function (done) {
      try {
        client.log({
          'seconds': now.second,
          'milliseconds': now.millisecond,
          'level': 1,
          'message': new Buffer('single message')
        }, done);
      } catch (e) {
        t.equal(e.name, 'Error');
        t.equal(e.message, 'client is currently reading');
        done(null);
      }
    }
  ], function (err) {
    t.ifError(err);
    client.once('close', t.end.bind(t));
    client.close();
  });
});

test('write after reading', function (t) {
  var client = new DailyClient(net.connect(setup.port, '127.0.0.1'));

  async.series([
    function (done) {
      var reader = client.reader({
        'type': 'read-start',
        'startSeconds': null,
        'startMilliseconds': null,
        'endSeconds': null,
        'endMilliseconds': null,
        'levels': [1, 9]
      });
      reader.once('close', done);
    }, function (done) {
      client.log({
        'seconds': now.second,
        'milliseconds': now.millisecond,
        'level': 1,
        'message': new Buffer('single message')
      }, done);
    }
  ], function (err) {
    t.ifError(err);
    client.once('close', t.end.bind(t));
    client.close();
  });
});

setup.close();
