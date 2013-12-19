
var ServerProtocol = require('daily-protocol').Server;

function ServerDispatch(storage, socket) {
  var self = this;

  this._socketCloseing = false;
  this._storageCloseing = false;
  this._reader = null;

  function storageCloseing() {
    self._storageCloseing = true;
  }

  this.storage = storage;
  this.storage.once('close', storageCloseing);

  this.socket = new ServerProtocol(socket);
  this.socket.on('data', function (req) {
    self._data(req);
  });
  this.socket.once('error', function () {
    self._socketCloseing = true;
    self.socket.destroy();
  });
  this.socket.once('close', function () {
    self._socketCloseing = true;
    self.storage.removeListener('close', storageCloseing);
  });
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
    this._reader.pipe(this.socket);
  }
};

ServerDispatch.prototype._readStop = function (req) {
  if (this._reader) {
    this._reader.destroy();
  }
};
