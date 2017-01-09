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
  describe('holiday', () => {
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
      const response = {
        GetCountriesAvailableResponse: {
          '@xmlns': 'http://localhost:1337/HolidayService_v2/',
          GetCountriesAvailableResult: {}
        }
      }
      server
        .withArgs('GetCountriesAvailable')
        .resolves(response)
      client.GetCountriesAvailable(null, (err, res) => {
        expect(server.stub)
          .calledWith('GetCountriesAvailable')

        done(err)
      })
    })
    it('calls the correct method with data', (done) => {
      const response = {
        GetHolidaysAvailableResponse: {
          '@xmlns': 'http://localhost:1337/HolidayService_v2/',
          GetHolidaysAvailableResult: {}
        }
      }
      server
        .withArgs('GetHolidaysAvailable', 'Canada')
        .resolves(response)
      client.GetHolidaysAvailable('Canada', (err, res) => {
        expect(server.stub)
          .calledWith('GetHolidaysAvailable', 'Canada')

        done(err)
      })
    })
    it('calls the correct method with complex data', (done) => {
      const response = {
        GetHolidayDateResponse: {
          '@xmlns': 'http://localhost:1337/HolidayService_v2/',
          GetHolidayDateResult: new Date('2017-01-01T00:00:00.000Z')
        }
      }
      const args = {
        countryCode: 'Canada',
        holidayCode: 'NEW-YEARS-DAY-ACTUAL',
        year: '2017'
      }
      server
        .withArgs('GetHolidayDate', args)
        .resolves(response)
      client.GetHolidayDate(args, (err, res) => {
        expect(server.stub)
          .calledWith('GetHolidayDate', args)

        done(err)
      })
    })
    it('returns the correct response from object', (done) => {
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
        .resolves(response)
      client.GetCountriesAvailable(null, (err, res) => {
        expect(res)
          .to.eql({GetCountriesAvailableResult})

        done(err)
      })
    })
    it('returns the correct response from string', (done) => {
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
      const response = '<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema"><soap:Body><GetCountriesAvailableResponse xmlns="http://localhost:1337/HolidayService_v2/"><GetCountriesAvailableResult><CountryCode><Code>Canada</Code><Description>Canada</Description></CountryCode><CountryCode><Code>GreatBritain</Code><Description>Great Britain and Wales</Description></CountryCode></GetCountriesAvailableResult></GetCountriesAvailableResponse></soap:Body></soap:Envelope>'
      server
        .withArgs('GetCountriesAvailable')
        .resolves(response)
      client.GetCountriesAvailable(null, (err, res) => {
        expect(res)
          .to.eql({GetCountriesAvailableResult})

        done(err)
      })
    })
    it('throws correct errors', (done) => {
      server
        .withArgs('GetCountriesAvailable')
        .rejects({message: 'some description'})
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
  describe('sunsetriseservice', () => {
    let server, client
    beforeEach((done) => {
      wsdl = {
        path: '/sunsetriseservice.asmx?WSDL',
        content: join(__dirname, 'soap/sunsetrise.wsdl'),
        replace: {
          'www.webservicex.net': 'localhost:1337'
        }
      }
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
              done()
            }
          })
        })
    })
    afterEach(() => {
      console.warn.restore()
      return server.stop()
    })
    it('serialises nested object args correctly', (done) => {
      const response = {
        GetSunSetRiseTimeResponse: {
          '@xmlns': 'http://localhost:1337/HolidayService_v2/',
          GetSunSetRiseTimeResult: {}
        }
      }
      const args = {
        L: {
          Latitude: '0',
          Longitude: '0',
          SunSetTime: '0',
          SunRiseTime: '0',
          TimeZone: '0',
          Day: '0',
          Month: '0',
          Year: '0'
        }
      }
      server
        .withArgs('GetSunSetRiseTime', args)
        .resolves(response)
      client.GetSunSetRiseTime(args, (err, res) => {
        expect(server.stub)
          .calledWith('GetSunSetRiseTime', args)

        done(err)
      })
    })
  })
})
