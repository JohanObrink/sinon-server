const {stub} = require('sinon')
require('sinon-as-promised')
require('./sinon-calls')

module.exports = class Server {
  constructor (options) {
    this.options = options
    this.stub = stub()
    this.server = this.createServer()

    Object.keys(this.stub)
      .filter(key => typeof this.stub[key] === 'function')
      .forEach(key => {
        this[key] = this.stub[key].bind(this.stub)
      })
  }
  createServer () {
    throw new Error(`I'm using an abstract class pattern here...
      So sue me ;)`)
  }
  start (...args) {
    return this.server.start(...args)
  }
  stop () {
    if (this.server) {
      return this.server.stop()
        .then(() => {
          this.server = null
        })
    } else {
      return Promise.reject(new Error('Server not yet started'))
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
