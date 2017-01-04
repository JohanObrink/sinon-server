const http = require('http')
const Server = require('./Server')
const defaultPort = 1337

function buildEndpoint ({protocol = 'http', host = 'localhost', port = defaultPort}) {
  return `${protocol}://${host}:${port}`
}

module.exports = class HttpServer extends Server {
  constructor (options = {}) {
    super(options)
    this.endpoint = buildEndpoint(options)
  }
  createServer () {
    const self = this
    const server = http.createServer((req, res) => {
      return new Promise(resolve => {
        let data
        req.on('data', chunk => {
          if (!data) {
            data = ''
          }
          data += chunk.toString()
        })
        req.on('end', () => resolve(data))
      })
      .then(body => {
        const args = [req.method, req.url, req.headers, body]
        const promise = this.stub(...args)
        if (promise && typeof promise.then === 'function') {
          return promise
        }

        this.reportMissingImplementation({
          method: req.method,
          url: req.url,
          headers: req.headers,
          body
        })
        return Promise.resolve({
          status: 404,
          headers: {},
          body: ''
        })
      })
      .then(response => {
        res.writeHead(response.status, response.headers)
        let body = response.body
        if (typeof body !== 'string' && !(body instanceof Buffer)) {
          body = JSON.stringify(body)
        }
        res.write(body)
        res.end()
      })
    })
    server.options = this.options
    return Object.assign(server, {
      start: function (overrides = {}) {
        return new Promise((resolve, reject) => {
          const options = Object.assign({}, this.options, overrides)
          if (!options.port) {
            options.port = defaultPort
          }
          self.endpoint = buildEndpoint(options)

          this.listen(options.port, err =>
            err ? reject(err) : resolve(self))
        })
      },
      stop: function () {
        return new Promise((resolve, reject) =>
          this.close(err => err ? reject(err) : resolve(self)))
      }
    })
  }
}
