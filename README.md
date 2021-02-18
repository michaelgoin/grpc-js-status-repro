# grpc-js Status Event Bug Reproduction

grpc-js appears to be failing to emit the client stream 'status' event when the server has written data and the client stream 'data' event has **not** been subscribed to.

This project attempts to represent a somewhat simple reproduction of the issue.

It contains 3 test cases to display the issue, showing when the 'status' event is and is not invoked:

1. Failing case of no client 'data' subscription with server writing data.
2. Passing case that includes client 'data' subscription with server writing data.
3. Passing case of no client 'data' subscription but server does not write data.

## High Level Example

When a server writes data similar to:

```js
const recordItemWithWrite = (stream) => {
  stream.on('data', () => {
    // Writing data critical for triggering bug.
    stream.write({messages_seen: 1})

    // end the stream -- sends back a STATUS OK
    stream.end()
  })
}
```

And a client stream listens to 'status', but not 'data', similar to:

```js
callStream.on('status', (grpcStatus) => {
  // this is never hit
})

callStream.on('error', (err) => {})

callStream.write({ name: 'blah' })
```

The 'status' handler will never be invoked.

## Running

`npm install` OR `npm ci`

node-tap is used to setup the test cases. As such, this can be ran directly via node or via the tap CLI client which can be installed globally (`npm install tap -g`).

* `node .` OR
* `node ./test` OR
* `npm run test` OR
* `tap ./test.js --no-coverage`

## Code Navigation

Test cases can be found in `./test.js`.

General client/server setup code no specifically relevant (in theory) to the test cases exist in `./grpc-setup`.

`./index.js` just invokes `./test.js`.
