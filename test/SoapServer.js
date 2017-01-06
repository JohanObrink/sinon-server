const chai = require('chai')
const expect = chai.expect
const {SoapServer} = require(`${process.cwd()}/lib/`)
const {stub} = require('sinon')
const {createClient} = require('soap')
const {join} = require('path')

chai.use(require('chai-http'))
chai.use(require('sinon-chai'))

before(function () {
  this.timeout(60000)
})

describe('SoapServer', () => {
  let wsdl
  beforeEach(() => {
    wsdl = {
      path: '/HolidayService_v2/HolidayService2.asmx?wsdl',
      content: join(__dirname, 'soap/holiday.wsdl'),
      replace: {
        'http://www.holidaywebservice.com': 'http://localhost:1337'
      }
    }
  })
  describe('constructor', () => {
    let server
    afterEach(() => {
      if (server.running) {
        return server.stop()
      }
    })
    it('sets the correct defaults', () => {
      server = new SoapServer({wsdl})
      expect(server.endpoint).to.equal('http://localhost:1337/HolidayService_v2/HolidayService2.asmx?wsdl')
    })
    it('uses options', () => {
      server = new SoapServer({
        protocol: 'https',
        host: 'foobar',
        port: 4000,
        wsdl
      })
      expect(server.endpoint).to.equal('https://foobar:4000/HolidayService_v2/HolidayService2.asmx?wsdl')
    })
    it('accepts overrides (except for that wsdl must be passed in the constructor)', () => {
      server = new SoapServer({
        protocol: 'https',
        wsdl
      })
      return server
        .start({
          host: 'foobar',
          port: 4000
        })
        .then(server => {
          expect(server.endpoint).to.equal('https://foobar:4000/HolidayService_v2/HolidayService2.asmx?wsdl')
        })
    })
  })
  describe('calls', () => {
    let server, client
    beforeEach((done) => {
      server = new SoapServer({
        port: 1337,
        wsdl
      })
      stub(console, 'warn')
      server.start()
        .then(() => {
          createClient(server.endpoint, (err, _client) => {
            if (err) {
              done(err)
            } else {
              client = _client
              // client.on('request', (xml) => console.log(xml))
              done()
            }
          })
        })
    })
    afterEach(() => {
      console.warn.restore()
      return server.stop()
    })
    it('calls the correct method', (done) => {
      const GetCountriesAvailableResult = {
        CountryCode: [
          {
            Code: 'Canada',
            Description: 'Canada'
          },
          {
            Code: 'GreatBritain',
            Description: 'Great Britain and Wales'
          }
        ]
      }
      const response = {
        GetCountriesAvailableResponse: {
          '@xmlns': 'http://localhost:1337/HolidayService_v2/',
          GetCountriesAvailableResult
        }
      }
      server
        .withArgs('GetCountriesAvailable')
        .resolves({
          response,
          status: 200
        })
      client.GetCountriesAvailable(null, (err, res) => {
        expect(res)
          .to.eql({GetCountriesAvailableResult})

        done(err)
      })
    })
    it('throws correct errors', (done) => {
      server
        .withArgs('GetCountriesAvailable')
        .rejects(Object.assign({message: 'some description'}))
      client.GetCountriesAvailable(null, (err, res) => {
        expect(err).to.be.instanceof(Error)
        expect(err.message)
          .to.equal('soap:Server.InternalError: some description')

        done()
      })
    })
    it('throws NotImplemented error for unimplemented methods', (done) => {
      client.GetCountriesAvailable(null, (err, res) => {
        expect(err).to.be.instanceof(Error)
        expect(err.message)
          .to.equal(`soap:Server.NotImplemented: The method 'GetCountriesAvailable' is not implemented`)

        done()
      })
    })
  })
})
