const HttpServer = require('./HttpServer')

function create (Type, args) {
  return new Type(...args)
}

module.exports = {
  HttpServer,
  http: (...args) => create(HttpServer, args)
}
