
var util = require('util');
var events = require('events');
var ClientProtocol = require('daily-protocol').Client;

var ClientReader = require('./reader.js');

var TOTAL_IDS = Math.pow(2, 16);
function generateFreeIds() {
  var arr = new Array(TOTAL_IDS);
  for (var i = 0; i < TOTAL_IDS; i++) {
    arr[i] = i;
  }
  return arr;
}

function ClientInterface(socket) {
  events.EventEmitter.call(this);
  var self = this;

  this._socket = new ClientProtocol(socket);
  this._socket.on('data', function (message) { self._message(message); });
  this._socket.on('error', this.emit.bind(this, 'error'));
  this._socket.once('close', this._resourceClosed.bind(this));

  this._closing = false;
  this._reader = null;
  this._callbacks = {};
  this._freeIds = generateFreeIds();

  this.reading = false;
}
util.inherits(ClientInterface, events.EventEmitter);
module.exports = ClientInterface;

ClientInterface.prototype._message = function (message) {
  if (message.type === 'write') {
    this._logCallback(message);
  } else if (message.type === 'read-start') {
    this._reader._resourceData(message);
  } else if (message.type === 'read-stop') {
    this._reader._resourceStop(message);
  } else {
    this.emit('error', new Error('got unknown response code'));
  }
};

////
// Log
////
ClientInterface.prototype._logCallback = function (message) {
  // Prefetch callback
  var cb = this._callbacks[message.id];

  // Remove the callback an push back the id
  delete this._callbacks[message.id];
  this._freeIds.push(message.id);

  // Execute the callback
  cb(message.error);

  // In case we are closeing inform the the close logic
  this._idReturned();
};

ClientInterface.prototype.log = function (details, callback) {
  if (this._closing) throw new Error('the socket is closeing');
  if (this.reading) throw new Error('client is currently reading');

  // Check that there are ids left
  if (this._freeIds.length === 0) {
    return callback(new Error('too many parallel writes'));
  }

  // Fetch a free id
  var id = this._freeIds.pop();

  // Store the callback for later
  this._callbacks[id] = callback;

  var message = {
    'type': 'write',
    'id': id,
    'seconds': details.seconds,
    'milliseconds': details.milliseconds,
    'level': details.level,
    'message': details.message
  };

  this._socket.write(message, callback);
};

////
// Reader
////
ClientInterface.prototype.reader = function (details) {
  if (this._closing) throw new Error('the socket is closeing');
  if (this._freeIds.length !== TOTAL_IDS) throw new Error('all log writes must complete');
  if (this.reading) throw new Error('client is already reading');
  var self = this;

  this.reading = true;
  this._reader = new ClientReader(this._socket, details);
  this._reader.once('close', function () {
    self.reading = false;
    self._reader = null;
  });

  return this._reader;
};

////
// Close
////
ClientInterface.prototype._idReturned = function () {
  if (this.closeing && this._freeIds.length === TOTAL_IDS) {
    this._socket.end();
  }
};

ClientInterface.prototype._resourceClosed = function () {
  // Close the reader if active
  if (this._reading) {
    this._reader.resourceStop({
      'error': new Error('socket closed prematurely')
    });
  }

  // Inform remaining log callbacks that the resource closed prematurely,
  // if the client was closed from this side there shouldn't be any remaining
  // callbacks
  var err = new Error('socket closed prematurely the result is unkown');
  var ids = Object.keys(this._callbacks);
  for (var i = 0, l = ids.length; i < l; i++) {
    ids[i](err, null);
  }
  // Cleanup function refs
  this._callbacks = {};
};

ClientInterface.prototype.close = function (callback) {
  // Prevent edge cases where .close is called more than once
  if (this._closing) return;
  this._closing = true;

  // In case there are pending log writes wait for them to return
  if (this._freeIds.length === TOTAL_IDS) {
    this._socket.end();
  }
};
