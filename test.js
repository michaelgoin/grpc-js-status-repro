'use strict'

const tap = require('tap')

const { setupClientStream, setupServer} = require('./grpc-setup')

const recordItemWithWrite = (stream) => {
  stream.on('data', () => {
    // Writing data critical for triggering bug.
    stream.write({messages_seen: 1})

    // end the stream -- sends back a STATUS OK
    stream.end()
  })
}

/**
 * This test fails.
 * With the server writing data, but no subscription to the 'data' event on the
 * client stream, the client stream 'status' event never fires.
 */
tap.test('Should call status after data written w/o data subscription', {timeout: 10000}, (t) => {
  t.plan(1)

  setupServer(recordItemWithWrite, (server, port) => {
    t.teardown(() => {
      server.tryShutdown(()=>{})
    })

    const endpoint = `localhost:${port}`

    const callStream = setupClientStream(endpoint)
    callStream.on('status', (grpcStatus) => {
      console.log('hit status: ', JSON.stringify(grpcStatus))
      t.pass('status called') // this assert is never hit so plan(1) check fails on timeout

      callStream.removeAllListeners()
      callStream.end()

      t.end()
    })

    callStream.on('error', (err) => {
      t.error(err)
    })

    callStream.write({ name: 'blah' })
  })
})

tap.test('Should call status after data written with data subscription', {timeout: 10000}, (t) => {
  t.plan(1)

  setupServer(recordItemWithWrite, (server, port) => {
    t.teardown(() => {
      server.tryShutdown(()=>{})
    })

    const endpoint = `localhost:${port}`

    const callStream = setupClientStream(endpoint)

    // this makes things work
    callStream.on('data', (response) => {
      console.log('got a response: ', JSON.stringify(response))
    })

    callStream.on('status', (grpcStatus) => {
      console.log('hit status: ', JSON.stringify(grpcStatus))
      t.pass('status called') // this assert is hit so test should pass plan(1)

      callStream.removeAllListeners()
      callStream.end()

      t.end()
    })

    callStream.on('error', (err) => {
      t.error(err)
    })

    callStream.write({ name: 'blah' })
  })
})

tap.test('Should call status w/o data written w/o data subscription', {timeout: 10000}, (t) => {
  t.plan(1)

  const recordItemNoWrite = (stream) => {
    stream.on('data', () => {
      // end the stream -- sends back a STATUS OK
      stream.end()
    })
  }

  setupServer(recordItemNoWrite, (server, port) => {
    t.teardown(() => {
      server.tryShutdown(()=>{})
    })

    const endpoint = `localhost:${port}`

    const callStream = setupClientStream(endpoint)
    callStream.on('status', (grpcStatus) => {
      console.log('hit status: ', JSON.stringify(grpcStatus))
      // this assert is hit, even without data subscription,
      // because the server never wrote data
      t.pass('status called')

      callStream.removeAllListeners()
      callStream.end()

      t.end()
    })

    callStream.on('error', (err) => {
      t.error(err)
    })

    callStream.write({ name: 'blah' })
  })
})
