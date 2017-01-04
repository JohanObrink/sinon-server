const HttpServer = require('./HttpServer')
const SoapServer = require('./SoapServer')

function create (Type, args) {
  return new Type(...args)
}

module.exports = {
  HttpServer,
  SoapServer,
  http: (...args) => create(HttpServer, args)
}
