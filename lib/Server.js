const {stub} = require('sinon')
require('sinon-as-promised')
require('./sinon-calls')

module.exports = class Server {
  constructor (options) {
    this.options = options
    this.stub = stub()
    this.endpoint = this.buildEndpoint(options)
    this.server = this.createServer()
    this.running = false

    Object.keys(this.stub)
      .filter(key => typeof this.stub[key] === 'function')
      .forEach(key => {
        this[key] = this.stub[key].bind(this.stub)
      })
  }
  start (...args) {
    return this.server
      .start(...args)
      .then(res => {
        this.running = true
        return res
      })
  }
  stop () {
    if (this.server) {
      return this.server.stop()
        .then(res => {
          this.server = null
          this.running = false
          return res
        })
    } else {
      return Promise.reject(new Error('Server is not running'))
    }
  }
  reportMissingImplementation (args) {
    function stringify (val) {
      const str = JSON.stringify(val, null, 2)
      return str ? str.split('\n').join('\n    ') : str
    }
    const keys = Object.keys(args)
    let msg = `It seems you are missing an implementation.
Add [server].withArgs(${keys.join(', ')})\n`
    keys.forEach(key => {
      msg += `  ${key}:\n    ${stringify(args[key])}\n`
    })
    console.warn(msg)
  }
}
