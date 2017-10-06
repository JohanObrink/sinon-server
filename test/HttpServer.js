const chai = require('chai')
const expect = chai.expect
const {HttpServer} = require(`${process.cwd()}/lib/`)
const {spy, stub, match} = require('sinon')
const {chain} = require('./testhelper')

chai.use(require('chai-http'))
chai.use(require('sinon-chai'))

before(function () {
  this.timeout(60000)
})

describe('HttpServer', () => {
  describe('constructor', () => {
    let server
    afterEach(() => {
      if (server.running) {
        return server.stop()
      }
    })
    it('sets the correct defaults', () => {
      server = new HttpServer()
      expect(server.endpoint).to.equal('http://localhost:1337')
    })
    it('uses options', () => {
      server = new HttpServer({
        protocol: 'https',
        host: 'foobar',
        port: 4000
      })
      expect(server.endpoint).to.equal('https://foobar:4000')
    })
    it('accepts overrides', () => {
      server = new HttpServer({protocol: 'https'})
      return server
        .start({
          host: 'foobar',
          port: 4000
        })
        .then(server => {
          expect(server.endpoint).to.equal('https://foobar:4000')
        })
    })
  })
  describe('calls', () => {
    let server, request
    beforeEach(() => {
      server = new HttpServer({port: 1337})
      request = chai.request(server.endpoint)
      stub(console, 'warn')

      return server.start()
    })
    afterEach(() => {
      console.warn.restore()
      return server.stop()
    })
    it('calls through', () => {
      const all = Object.assign(spy(), {__name: 'all'})
      const getIndex = Object.assign(spy(), {__name: 'getIndex'})
      const secondCall = Object.assign(spy(), {__name: 'secondCall'})
      const secondGetIndex = Object.assign(spy(), {__name: 'secondGetIndex'})

      server.calls(all)
      server.withArgs('GET', '/').calls(getIndex).resolves({status: 204})
      server.onCall(1).calls(secondCall)
      server.withArgs('GET', '/').onCall(1).calls(secondGetIndex)

      return chain([
        () => {
          return request.get('/')
            .then(res => expect(res).to.have.status(204))
        },
        () => {
          return request.post('/')
            .catch(res => expect(res).to.have.status(404))
        },
        () => {
          return request.get('/')
            .then(res => expect(res).to.have.status(204))
        },
        () => {
          return request.get('/')
            .then(res => expect(res).to.have.status(204))
        }
      ])
      .then(() => {
        expect(all.callCount, 'all').to.equal(4)
        expect(all, 'all').calledWith('GET', '/').and.calledWith('POST', '/')

        expect(getIndex.callCount, 'getIndex').to.equal(3)
        expect(getIndex, 'getIndex').calledWith('GET', '/').and.not.calledWith('POST', '/')

        expect(secondCall, 'secondCall').calledOnce.calledWith('POST', '/')

        expect(secondGetIndex, 'secondGetIndex').calledOnce.calledWith('GET', '/')
      })
    })
    it('warns of unspecified implementations', () => {
      return request
        .get('/')
        .catch(res => {
          expect(res).to.have.status(404)
          expect(console.warn)
            .calledOnce
        })
    })
    it('calls the stub correctly', () => {
      const method = 'POST'
      const url = '/foo'
      const headers = {accept: 'application/json'}
      const body = {foo: 'bar'}

      return request
        .post('/foo')
        .set('Accept', 'application/json')
        .send({foo: 'bar'})
        .catch(res => {
          expect(res).to.have.status(404)
          expect(server.stub)
            .calledOnce
            .calledWith(method, url, match(headers), JSON.stringify(body))
        })
    })
    it('returns the correct default response', () => {
      return request
        .get('/')
        .set('Accept', 'application/json')
        .catch(res => {
          expect(res).to.have.status(404)
          expect(res.response.text).to.eql('')
        })
    })
    it('returns the correct response', () => {
      const method = 'POST'
      const url = '/foo'
      const headers = {accept: 'application/json'}
      const body = {foo: 'bar'}
      const response = {
        status: 201,
        headers: {'Content-Type': 'application/json'},
        body: {
          herp: 'derp'
        }
      }
      server
        .withArgs(method, url, match(headers), JSON.stringify(body))
        .resolves(response)
      return request
        .post('/foo')
        .set('Accept', 'application/json')
        .send({foo: 'bar'})
        .then(res => {
          expect(res).to.have.status(201)
          expect(res.body).to.eql(response.body)
        })
        .catch(err => {
          console.log(err)
        })
    })
    it('it does not warn for configured calls', () => {
      const method = 'POST'
      const url = '/foo'
      const headers = {accept: 'application/json'}
      const body = {foo: 'bar'}
      const response = {
        status: 201,
        headers: {'Content-Type': 'application/json'},
        body: {
          herp: 'derp'
        }
      }
      server
        .withArgs(method, url, match(headers), JSON.stringify(body))
        .resolves(response)
      return request
        .post('/foo')
        .set('Accept', 'application/json')
        .send({foo: 'bar'})
        .then(res => {
          expect(res).to.have.status(201)
          expect(console.warn).not.called
        })
    })
  })
})
