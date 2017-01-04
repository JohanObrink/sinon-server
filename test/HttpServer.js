const supertest = require('supertest-as-promised')(Promise)
const chai = require('chai')
const expect = chai.expect
const {HttpServer} = require(`${process.cwd()}/lib/`)
const {spy, stub, match} = require('sinon')

chai.use(require('sinon-chai'))

function chain (funcs) {
  return funcs.reduce((promise, func) => promise.then(func), Promise.resolve())
}
before(function () {
  this.timeout(60000)
})

describe('HttpServer', () => {
  let server, request
  beforeEach(() => {
    server = new HttpServer()
    request = supertest(server.server)
    stub(console, 'warn')
  })
  afterEach(() => {
    console.warn.restore()
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
        return request.get('/').expect(204)
      },
      () => {
        return request.post('/').expect(404)
      },
      () => {
        return request.get('/').expect(204)
      },
      () => {
        return request.get('/').expect(204)
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
      .expect(404)
      .then(() => {
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
      .expect(404)
      .then(() => {
        expect(server.stub)
          .calledOnce
          .calledWith(method, url, match(headers), JSON.stringify(body))
      })
  })
  it('returns the correct default response', () => {
    return request
      .get('/')
      .set('Accept', 'application/json')
      .end()
      .then(response => {
        expect(response.status).to.equal(404)
        expect(response.text).to.eql('')
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
    request
      .post('/foo')
      .set('Accept', 'application/json')
      .send({foo: 'bar'})
      .expect(201)
      .then(res => {
        expect(res.body).to.eql(response.body)
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
      .expect(201)
      .then(() => {
        expect(console.warn).not.called
      })
  })
})
