
var ServerProtocol = require('daily-protocol').Server;

function ServerDispatch(storage, socket) {
  var self = this;

  this._socketCloseing = false;
  this._storageCloseing = false;
  this._reader = null;

  function storageCloseing() {
    self._storageCloseing = true;
    self-socket.end();
  }

  function socketData(req) {
    self._data(req);
  }

  function socketError() {
    // Socket will be closeing now, this will also ignore future errors
    socketCloseing();

    // Destroy socket
    self.socket.destroy();
  }

  function socketCloseing() {
    // Ignore errors
    self.socket.on('error', function () {});

    // Stop sending write callbacks
    self._socketCloseing = true;

    // Stop pipeing as we are about to destroy the socket
    if (self._reader) self._reader.unpipe(self.socket);

    // Cleanup event handlers
    self.storage.removeListener('close', storageCloseing);
    self.socket.removeListener('data', socketData);
    self.socket.removeListener('error', socketError);
    self.socket.removeListener('close', socketCloseing);
    self.socket.removeListener('finish', socketCloseing);
  }

  this.storage = storage;
  this.storage.once('close', storageCloseing);

  this.socket = new ServerProtocol(socket);
  this.socket.on('data', socketData);
  this.socket.once('error', socketError);
  this.socket.once('close', socketCloseing);
  this.socket.once('finish', socketCloseing);
}
module.exports = ServerDispatch;

ServerDispatch.prototype._data = function (req) {
  if (this._socketCloseing || this._storageCloseing) return;

  if (req.type === 'write') {
    this._write(req);
  } else if (req.type === 'read-start') {
    this._readStart(req);
  } else if (req.type === 'read-stop') {
    this._readStop(req);
  } else {
    this.socket.destroy();
  }
};

ServerDispatch.prototype._write = function (req) {
  var self = this;

  if (this._reader === true) {
    this.socket.write({
      type: 'write',
      error: new Error('This socket is in reading mode')
    });
  } else {
    this.storage.write(req, function (err) {
      if (!self._socketCloseing) {
        self.socket.write({
          type: 'write',
          error: err,
          id: req.id
        });
      }
    });
  }
};

ServerDispatch.prototype._readStart = function (req) {
  if (!this._reader) {
    this._reader = this.storage.reader(req);
    this._reader.pipe(this.socket, { end: false });
  }
};

ServerDispatch.prototype._readStop = function (req) {
  if (this._reader) {
    this._reader.destroy();
  }
};
