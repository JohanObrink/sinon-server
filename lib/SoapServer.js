const {readFileSync} = require('fs')
const {parseString} = require('xml2js')
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
        }

        this.reportMissingImplementation({url: request.url, method, args})
        return Promise.resolve({
          status: 404,
          headers: {},
          body: ''
        })
      })
      .catch(err => {
        return Promise.resolve({
          status: 500,
          headers: {},
          body: err
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
            resolve({method})
          } catch (err) {
            reject(err)
          }
        }
      })
    })
  }
}
