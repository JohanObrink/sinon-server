const http = require('http')
const Server = require('./Server')
const defaultPort = 1337

module.exports = class HttpServer extends Server {
  constructor (options = {}) {
    super(options)
  }
  buildEndpoint ({protocol = 'http', host = 'localhost', port = defaultPort}) {
    return `${protocol}://${host}:${port}`
  }
  createServer () {
    const self = this
    const server = http.createServer((req, res) => {
      return new Promise(resolve => {
        let body
        req.on('data', chunk => {
          if (!body) {
            body = ''
          }
          body += chunk.toString()
        })
        req.on('end', () => resolve({
          method: req.method,
          url: req.url,
          headers: req.headers,
          body
        }))
      })
      .then(request => this.createResponse(request))
      .then(response => this.writeResponse(req, res, response))
    })
    server.options = this.options
    return Object.assign(server, {
      start: function (overrides = {}) {
        return new Promise((resolve, reject) => {
          const options = Object.assign({}, this.options, overrides)
          if (!options.port) {
            options.port = defaultPort
          }
          self.endpoint = self.buildEndpoint(options)

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
  createResponse ({method, url, headers, body}) {
    const args = [method, url, headers, body]
    const promise = this.stub(...args)
    if (promise && typeof promise.then === 'function') {
      return promise
    }

    this.reportMissingImplementation({method, url, headers, body})
    return Promise.resolve({
      status: 404,
      headers: {},
      body: ''
    })
  }
  writeResponse (req, res, response) {
    res.writeHead(response.status, response.headers)
    res.write(this.serializeBody(response.body))
    res.end()
  }
  serializeBody (body) {
    if (typeof body === 'string' || (body instanceof Buffer)) {
      return body
    }
    return JSON.stringify(body)
  }
}
