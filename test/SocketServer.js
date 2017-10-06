const chai = require('chai')
const expect = chai.expect
const {SocketServer} = require(`${process.cwd()}/lib/`)
const {createConnection} = require('net')
const {spy, stub} = require('sinon')
const {chain, delay} = require('./testhelper')

chai.use(require('sinon-chai'))

before(function () {
  this.timeout(60000)
})

describe('SocketServer', () => {
  let server
  beforeEach(() => {
    stub(console, 'warn')
  })
  afterEach(() => {
    console.warn.restore()
    if (server && server.running) {
      return server.stop()
    }
  })
  describe('constructor', () => {
    it('sets the correct defaults', () => {
      server = new SocketServer()
      expect(server.endpoint).to.eql({port: 1337})
    })
    it('uses options', () => {
      server = new SocketServer({
        host: '127.0.0.1',
        port: 4000
      })
      expect(server.endpoint).to.eql({port: 4000})
    })
    it('accepts overrides', () => {
      server = new SocketServer({port: 1337})
      return server
        .start({
          port: 4000
        })
        .then(server => {
          expect(server.endpoint).to.eql({port: 4000})
        })
    })
  })
  describe('calls', () => {
    let client, clientListener
    beforeEach(() => {
      server = new SocketServer({port: 1337})
      clientListener = spy()

      return server
        .start()
        .then(() => new Promise(resolve => {
          client = createConnection({port: 1337}, () => {
            client.on('data', (data) => {
              clientListener(data)
            })
            resolve()
          })
        }))
    })
    it('calls through', () => {
      const all = Object.assign(spy(), {__name: 'all'})
      const sendHello = Object.assign(spy(), {__name: 'sendHello'})
      const secondCall = Object.assign(spy(), {__name: 'secondCall'})
      const secondSendHello = Object.assign(spy(), {__name: 'secondGetIndex'})

      server.calls(all)
      server.withArgs(Buffer.from('hello')).calls(sendHello).resolves('reply')
      server.onCall(1).calls(secondCall)
      server.withArgs(Buffer.from('hello')).onCall(1).calls(secondSendHello)

      return chain([
        () => {
          client.write('hello')
          return delay(() => {
            expect(clientListener)
              .calledOnce
              .calledWith(Buffer.from('reply'))
          }, 10)
        },
        () => {
          client.write('foo')
          return delay(() => {
            expect(clientListener).calledOnce
          }, 10)
        },
        () => {
          client.write('hello')
          return delay(() => {
            expect(clientListener)
              .calledTwice
              .calledWith(Buffer.from('reply'))
          }, 10)
        },
        () => {
          client.write('hello')
          return delay(() => {
            expect(clientListener)
              .calledThrice
              .calledWith(Buffer.from('reply'))
          }, 10)
        }
      ])
      .then(() => {
        expect(all.callCount, 'callCount all').to.equal(4)
        expect(all, 'all')
          .calledWith(Buffer.from('hello'))
          .and.calledWith(Buffer.from('foo'))

        expect(sendHello.callCount, 'sendHello').to.equal(3)
        expect(sendHello, 'sendHello')
          .calledWith(Buffer.from('hello'))
          .and.not.calledWith(Buffer.from('foo'))

        expect(secondCall, 'secondCall')
          .calledOnce.calledWith(Buffer.from('foo'))

        expect(secondSendHello, 'secondSendHello')
          .calledOnce.calledWith(Buffer.from('hello'))
      })
    })
    it('warns of unspecified implementations', () => {
      client.write('hello')
      return delay(() => {
        expect(console.warn).calledOnce
      }, 10)
    })
  })
})
