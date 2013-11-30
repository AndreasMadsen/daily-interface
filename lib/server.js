
var util = require('util');
var events = require('events');
var DailyStorage = require('daily-storeage');

var Dispatch = require('./dispatch.js');

function ServerInterface(path, options) {
  events.EventEmitter.call(this);

  this._storage = new DailyStorage(path, options);
  this._storage.on('error', this.emit.bind(this, 'error'));

  this._closeing = false;
}
util.inherits(ServerInterface, events.EventEmitter);
module.exports = ServerInterface;

ServerInterface.prototype.dispatch = function (socket) {
  if (this._closeing) return;
  new Dispatch(this._storage, socket);
};

ServerInterface.prototype.close = function () {
  if (this._closeing) return;
  this._closeing = true;

  this._storage.once('close', this.emit.bind(this, 'close'));
  this._storage.close();
};
