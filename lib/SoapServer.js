const {readFileSync} = require('fs')
const {parseString} = require('xml2js')
const {createResponse, createErrorResponse, unpackArguments} = require('./soaper')
const HttpServer = require('./HttpServer')
const defaultPort = 1337

module.exports = class SoapServer extends HttpServer {
  constructor (options = {}) {
    super(options)
  }
  buildEndpoint ({wsdl, protocol = 'http', host = 'localhost', port = defaultPort}) {
    if (!wsdl) {
      throw new Error('You must specify a wsdl with path and content')
    }
    this.wsdl = readFileSync(wsdl.content, {encoding: 'utf8'})
    if (wsdl.replace) {
      Object.keys(wsdl.replace)
        .forEach(key => {
          this.wsdl = this.wsdl.split(key).join(wsdl.replace[key])
        })
    }
    return `${protocol}://${host}:${port}${wsdl.path}`
  }
  createResponse (request) {
    if (request.method === 'GET' && request.url === this.options.wsdl.path) {
      return Promise.resolve({
        status: 200,
        headers: {
          'Content-Type': 'text/xml; charset=utf-8'
        },
        body: this.wsdl
      })
    }

    return this.parseSoap(request.body)
      .then(({method, args}) => {
        const promise = this.stub(method, args)
        if (promise && typeof promise.then === 'function') {
          return promise
            .then(body => ({
              status: 200,
              body
            }))
        }

        this.reportMissingImplementation({url: request.url, method, args})
        return Promise.reject({
          code: 'Server.NotImplemented',
          message: `The method '${method}' is not implemented`
        })
      })
      .catch(err => {
        return Promise.resolve({
          status: 500,
          headers: {},
          body: createErrorResponse(err)
        })
      })
  }
  parseSoap (xml) {
    return new Promise((resolve, reject) => {
      parseString(xml, (err, doc) => {
        if (err) {
          reject(err)
        } else {
          try {
            const body = doc['soap:Envelope']['soap:Body'][0]
            const method = Object.keys(body)[0]
            let args
            if (body[method] && body[method].length) {
              args = unpackArguments(body[method][0])
            }
            resolve({method, args})
          } catch (err) {
            reject(err)
          }
        }
      })
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
    return createResponse(body)
  }
}
