const http = require('http')
const Server = require('./Server')

module.exports = class HttpServer extends Server {
  createServer () {
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
            throw new Error('A port must be specified')
          }

          this.listen(options.port, err =>
            err ? reject(err) : resolve())
        })
      },
      stop: function () {
        return new Promise((resolve, reject) =>
          this.close(err => err ? reject(err) : resolve()))
      }
    })
  }
}
