# sinon-server
A mock server to answer calls to external systems controlled by a sinon stub

## Install

```npm install sinon-server```

## Use

```javascript
const {request} = require('http')
const {match} = require('sinon')

const {HttpServer} = require('./lib')
const testServer = new HttpServer({port: 1337})
```

### Example 1
```javascript
testServer
  .withArgs('GET', '/', match({'accept': 'application/json'}))
  .resolves({
    status: 200,
    headers: {'Content-Type': 'application/json'},
    body: {
      success: 'great'
    }
  })

const options = {
  host: 'localhost',
  port: '1337',
  headers: {'Accept': 'application/json'}
}

testServer
  .start()
  .then(() => {
    const req1 = request(Object.assign({method: 'GET', path: '/'}, options), res => {
      console.log('status', res.statusCode)
      console.log('headers', res.headers)

      res.setEncoding('utf8')
      res.on('data', data => console.log(data))
    })
    req1.end()
  })
  .then(() => testServer.stop())
```

### Example 2
```javascript
testServer
  .withArgs('POST', '/users', match.object, JSON.stringify({foo: 'bar'}))
  .resolves({
    status: 201,
    headers: {'Content-Type': 'text/html'},
    body: `<!doctype html>
<html>
  <body>
    <h1>User created!</h1>
  </body>
</html>`
  })

const options = {
  host: 'localhost',
  port: '1337',
  headers: {'Accept': 'application/json'}
}

testServer
  .start()
  .then(() => {
    const req2 = request(Object.assign({method: 'POST', path: '/users'}, options), res => {
      console.log('status', res.statusCode)
      console.log('headers', res.headers)

      res.setEncoding('utf8')
      res.on('data', data => console.log(data))
    })
    req2.write(JSON.stringify({foo: 'bar'}))
    req2.end()
  })
.then(() => testServer.stop())
```
