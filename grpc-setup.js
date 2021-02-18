'use strict'

const protoLoader = require('@grpc/proto-loader')
const grpc = require('@grpc/grpc-js')

const PROTO_FILE = `${__dirname}/endpoint.proto`

const PROTO_OPTIONS = {keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
}

function setupClientStream(endpoint) {
  const packageDefinition = protoLoader.loadSync(PROTO_FILE, PROTO_OPTIONS)

  const serviceDefinition = grpc.loadPackageDefinition(
    packageDefinition
  ).com.something.v1

  const client = new serviceDefinition.MyService(
    endpoint,
    grpc.credentials.createInsecure()
  )

  const stream = client.RecordItem()
  return stream
}

function setupServer(recordItem, callback) {
  const packageDefinition = protoLoader.loadSync(PROTO_FILE, PROTO_OPTIONS)
  const serviceDefinition = grpc.loadPackageDefinition(packageDefinition).com.something.v1

  const server = new grpc.Server()
  server.addService(
    serviceDefinition.MyService.service,
    {recordItem}
  )

  server.bindAsync('localhost:0', grpc.credentials.createInsecure(), (err, port) => {
    if (err) {
      throw err
    }
    server.start()

    callback(server, port)
  })
}

module.exports = {
  setupClientStream,
  setupServer
}
