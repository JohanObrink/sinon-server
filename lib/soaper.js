/*
<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope
  xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xmlns:xsd="http://www.w3.org/2001/XMLSchema">
  <soap:Body>
    <GetCountriesAvailableResponse
      xmlns="http://www.holidaywebservice.com/HolidayService_v2/">
      <GetCountriesAvailableResult>
        <CountryCode>
          <Code>Canada</Code>
          <Description>Canada</Description>
        </CountryCode>
        <CountryCode>
          <Code>GreatBritain</Code>
          <Description>Great Britain and Wales</Description>
        </CountryCode>
      </GetCountriesAvailableResult>
    </GetCountriesAvailableResponse>
  </soap:Body>
</soap:Envelope>
*/

function toXmlDocument (object) {
  const rootNodeName = Object.keys(object)[0]
  const rootNode = JSON.parse(JSON.stringify(object[rootNodeName]))
  return '<?xml version="1.0" encoding="utf-8"?>' + toXmlNode(rootNodeName, rootNode)
}

function toAttribute (name, value) {
  return `${name.substring(1)}="${value}"`
}

function toXmlNode (nodeName, node) {
  let children = ''
  let attributes = ''

  if (node instanceof Array) {
    return node
      .map(childNode => toXmlNode(nodeName, childNode))
      .join('')
  } else if (typeof node === 'object') {
    Object.keys(node)
      .forEach(key => {
        if (key[0] === '@') {
          attributes += ' ' + toAttribute(key, node[key])
        } else {
          children += toXmlNode(key, node[key])
        }
      })
  } else {
    children = node
  }

  return `<${nodeName}${attributes}>${children}</${nodeName}>`
}

function createSoapFault (error) {
  return {
    'soap:Fault': {
      'faultcode': `soap:${error.code || 'Server.InternalError'}`,
      'faultstring': error.message
    }
  }
}

function createResponse (payload) {
  const envelope = {
    'soap:Envelope': {
      '@xmlns:soap': 'http://schemas.xmlsoap.org/soap/envelope/',
      '@xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
      '@xmlns:xsd': 'http://www.w3.org/2001/XMLSchema',

      'soap:Body': payload
    }
  }
  return toXmlDocument(envelope)
}

function createErrorResponse (error) {
  const envelope = {
    'soap:Envelope': {
      '@xmlns:soap': 'http://schemas.xmlsoap.org/soap/envelope/',
      '@xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
      '@xmlns:xsd': 'http://www.w3.org/2001/XMLSchema',

      'soap:Body': createSoapFault(error)
    }
  }
  return toXmlDocument(envelope)
}

function unpackArguments (payload) {
  if (payload._) {
    return payload._
  } else {
    return Object.keys(payload)
      .filter(key => key !== '$')
      .reduce((args, key) => {
        let arg = payload[key]
        if (arg instanceof Array && arg.length === 1) {
          arg = arg[0]
        }
        if (typeof arg === 'object') {
          arg = unpackArguments(arg)
        }
        return Object.assign(args, {[key]: arg})
      }, {})
  }
}

module.exports = {createResponse, createErrorResponse, unpackArguments}
