#daily-interface

> [daily](https://github.com/AndreasMadsen/daily) - The transport independent interface

## Installation

```sheel
npm install daily-interface
```

## Work In Progress

## Documentation

**Unless you want to write your own low-level daily interfaces you don't need this module.**

### General

`daily-interface` has two constructors `Client` and `Server`.

* The `Client` takes a socket and wraps it as an interface.
* The `Server` creates an object with a `dispatch` method, there takes a socket.

```
var dailyInterface = require('daily-interface');
```

### client = new Client(socket)

Used to wrap a socket, the socket should be a `DuplexStream` and have a `.close`
method and emit a `close` event when its becomes closed.

```javascript
var socket = net.connect(PORT);
var client = new dailyInterface.Client(socket);
```

#### client.log(details, callback)

Details is an `object` there must contain all the following properties:

```javascript
{
  'seconds': Number(UInt32)
  'milliseconds': Number(UInt16),
  'level': Number(UInt8),
  'message': new Buffer()
}
```

Note that it is not possible to write data when data is currently being read.

#### Readable = client.reader(details)

The `.reader` methods takes an `object` there must contain the following properties:

```javascript
{
  'startSeconds': Number(UInt32) || null,
  'startMilliseconds': Number(UInt16) || null,
  'endSeconds': Number(UInt32) || null,
  'endMilliseconds': Number(UInt16) || null,
  'levels': [Number(UInt4), Number(UInt4)]
}
```

It then returns a `ReadableStream` from which you can read the logs there matches
the criterias given in the `details` object. When no more logs exists it will
emit and `end` event followed by a `close` event.

Alternatively you can call the `readable.close()` method this will tell the
server not to send more data and then emit a `close` event.

The `ReadableStream` also has an `error` event.

#### client.close()

This will stop all `readable` streams and let all writes return with a callback.
When everything currently active is completed the `socket.close()` method will
be executed, and when it is closed too the `client` will emit a `close` event.

In the mean time between the `.close()` call and `close` event, all new requests
be denined by throwing an error.

#### client.on('close')

When the client gets closed eiter by the `socket` or a `.close()` call this event
is emitted.

#### client.on('error')

Errors caused by the underlying socket will be emitted here.

### server = new Server(path, [options])

The `path` is the LevelDB filepath and the `options` are related to the internals
of the backend `storage`. For more details on both see the
[`daily-storage`](https://github.com/AndreasMadsen/daily-storage#documentation) documentation.

#### server.dispatch(socket)

Used to handle incomming sockets, this will allow the server to handle and respond
to their requests.

```javascript
net.createServer(function (socket) {
  server.dispatch(socket);
});
```

#### server.close()

This will close all the sockets and then the backend storage. When all is
done the `close` event` will be emitted.

#### server.on('error')

Errors from the backend storage will be emitted here.

#### server.once('close')

This can only be caused by a `server.close()` call.

##License

**The software is license under "MIT"**

> Copyright (c) 2013 Andreas Madsen
>
> Permission is hereby granted, free of charge, to any person obtaining a copy
> of this software and associated documentation files (the "Software"), to deal
> in the Software without restriction, including without limitation the rights
> to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
> copies of the Software, and to permit persons to whom the Software is
> furnished to do so, subject to the following conditions:
>
> The above copyright notice and this permission notice shall be included in
> all copies or substantial portions of the Software.
>
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
> IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
> FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
> AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
> LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
> OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
> THE SOFTWARE.
