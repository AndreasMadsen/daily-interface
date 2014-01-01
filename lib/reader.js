
var util = require('util');
var stream = require('stream');

function ClientReader(socket, details) {
  stream.Readable.call(this, { objectMode: true, highWaterMark: 16 });

  this._socket = socket;
  this._socket.write({
    'type': 'read-start',
    'startSeconds': details.startSeconds,
    'startMilliseconds': details.startMilliseconds,
    'endSeconds': details.endSeconds,
    'endMilliseconds': details.endMilliseconds,
    'levels': details.levels
  });

  this._closed = false;
  this._closeing = false;
}
util.inherits(ClientReader, stream.Readable);
module.exports = ClientReader;

ClientReader.prototype._read = function () {
  this._socket.resume();
};

ClientReader.prototype._resourceData = function (details) {
  var more = this.push({
    'level': details.level,
    'message': details.message,
    'seconds': details.seconds,
    'milliseconds': details.milliseconds
  });

  if (!more) this._socket.pause();
};

ClientReader.prototype._resourceStop = function (message) {
  if (this._closed) return;
  this._closed = true;

  if (message.error) {
    this.emit('error', message.error);
  } else if (!this._closeing) {
    // .close was not called and no errors, so all data must have
    // been consumed
    this.push(null);
  }

  // Always emit close, but make sure end or error is emitted first
  setImmediate(this.emit.bind(this, 'close'));
};

ClientReader.prototype.close = function () {
  if (this._closeing || this._closed) return;
  this._closeing = true;

  this._socket.write({
    'type': 'read-stop'
  });
};
