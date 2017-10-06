const {createServer} = require('net')
const Server = require('./Server')
const defaultPort = 1337

module.exports = class SocketServer extends Server {
  constructor (options = {}) {
    super(options)
  }
  buildEndpoint ({port = defaultPort}) {
    return {port}
  }
  createServer () {
    const server = createServer(socket => {
      socket.on('data', data => {
        this.createResponse(data)
          .then(res => {
            socket.write(res)
          })
          .catch(() => {})
      })
    })
    server.on('error', err => {
      console.error(err)
    })
    return Object.assign(server, {
      start: (overrides = {}) => {
        const options = Object.assign({}, this.options, overrides)
        if (!options.port) {
          options.port = defaultPort
        }
        this.endpoint = this.buildEndpoint(options)

        return new Promise((resolve) => {
          server.listen(options.port, () => {
            server.running = true
            resolve(this)
          })
        })
      },
      stop: () => {
        return new Promise((resolve) => {
          server.running = false
          server.close()
          resolve()
        })
      }
    })
  }
  createResponse (data) {
    const promise = this.stub(data)
    if (promise && typeof promise.then === 'function') {
      return promise
    }

    if (data instanceof Buffer) {
      let arr = Array.from(data)
      if (arr.length > 10) {
        arr = arr.slice(0, 9).concat(['...'])
      }
      data = {
        data: `[${arr}]`,
        utf8: data.utf8Slice(0, Math.min(10, data.length))
      }
    }
    this.reportMissingImplementation({Buffer: data})
    return Promise.reject()
  }
}
