const chai = require('chai')
const expect = chai.expect
const {createResponse, createErrorResponse, unpackArguments} = require(`${process.cwd()}/lib/soaper`)

describe('soaper', () => {
  describe('#createResponse', () => {
    it('builds a correct response', () => {
      const payload = {
        GetCountriesAvailableResponse: {
          '@xmlns': 'http://localhost:1337/HolidayService_v2/',
          GetCountriesAvailableResult: {
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
        }
      }
      const expected = '<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema"><soap:Body><GetCountriesAvailableResponse xmlns="http://localhost:1337/HolidayService_v2/"><GetCountriesAvailableResult><CountryCode><Code>Canada</Code><Description>Canada</Description></CountryCode><CountryCode><Code>GreatBritain</Code><Description>Great Britain and Wales</Description></CountryCode></GetCountriesAvailableResult></GetCountriesAvailableResponse></soap:Body></soap:Envelope>'
      const result = createResponse(payload)
      expect(result).to.equal(expected)
    })
  })
  describe('#createErrorResponse', () => {
    it('builds a correct response', () => {
      const error = {
        code: 'Server.NotImplemented',
        message: 'borked'
      }
      const expected = `<?xml version="1.0" encoding="utf-8"?>\
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema"><soap:Body>\
<soap:Fault>\
<faultcode>soap:Server.NotImplemented</faultcode>\
<faultstring>borked</faultstring>\
</soap:Fault>\
</soap:Body></soap:Envelope>`
      const result = createErrorResponse(error)
      expect(result).to.equal(expected)
    })
  })
  describe('#unpackArguments', () => {
    it('unpacks a complex object structure', () => {
      const payload = {
        '$': {
          'xmlns': 'http://www.webserviceX.NET/'
        },
        L: [
          {
            Latitude: ['0'],
            Longitude: ['0'],
            SunSetTime: ['0'],
            SunRiseTime: ['0'],
            TimeZone: ['0'],
            Day: ['0'],
            Month: ['0'],
            Year: ['0']
          }
        ]
      }
      const expected = {
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
      expect(unpackArguments(payload)).to.eql(expected)
    })
  })
})
