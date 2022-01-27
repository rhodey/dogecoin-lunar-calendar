const fs = require('fs')
const http = require('http')
const { exec } = require('child_process')
const Captcha = require('@haileybot/captcha-generator')
const level = require('level')
const crypto = require('crypto')
const argv = require('minimist')(process.argv.slice(2))

let database = level('database')

function date() {
  return new Date(Date.now() - 1000 * 60 * 60 * 5).toLocaleString()
}

function onError(err) {
  console.error(date(), 'error', err)
  process.exit(1)
}

function on500(response, err) {
  console.error(date(), 'http 500', err)
  response.writeHead(500)
  response.end()
}

function on400(response) {
  console.error(date(), 'http 400.')
  response.writeHead(400)
  response.end()
}

function paramsOfPath(path) {
  let pathParts = path.split('?')
  if (pathParts.length !== 2) { return null }
  let pairs = pathParts[1].split('&')
  let params = { }
  pairs.forEach((pair) => {
    params[pair.split('=')[0]] = pair.split('=')[1]
  })
  return params
}

function put(key, value) {
  return new Promise((res, rej) => {
    database.put(key, value, function (err) {
      if (err) { return rej(err) }
      res(value)
    })
  })
}

function get(key) {
  return new Promise((res, rej) => {
    database.get(key, function (err, value) {
      if (err) { return rej(err) }
      res(value)
    })
  })
}

function getOrNull(key) {
  return get(key).catch((err) => {
    return Promise.resolve(null)
  })
}

function del(key) {
  return new Promise((res, rej) => {
    database.del(key, function (err) {
      if (err) { return rej(err) }
      res()
    })
  })
}

function createCaptcha(response) {
  let captcha = new Captcha()
  let value = captcha.value
  let captchaId = crypto.createHmac('sha256', value).digest('hex')
  let key = `captcha:${captchaId}`
  let dayms = 1000 * 60 * 60 * 24
  let kexpire = `expire:${Date.now()+dayms}:${key}`
  put(kexpire, key).then(() => {
    return put(key, kexpire).then(() => {
      console.log(date(), `captcha ${value} to database.`)
      response.writeHead(200)
      captcha.JPEGStream.pipe(response)
    })
  }).catch((err) => on500(response, err))
}

function createBookmark(response, path) {
  let params = paramsOfPath(path)
  if (!params) { return on400(response) }

  let captchaValue = params['captcha']
  if (captchaValue === undefined) { return on400(response) }

  let captchaId = crypto.createHmac('sha256', captchaValue).digest('hex')
  let key = `captcha:${captchaId}`

  getOrNull(key).then((expire) => {
    if (!expire) {
      response.writeHead(201)
      response.end('captcha is incorrect.')
      return
    }

    return del(expire).then(() => del(key)).then(() => {
      let bookmark = {
        bookmarkId: crypto.randomUUID(),
        balanceOwed: 10.0,
        balancePaid: 0.0
      }
      let json = JSON.stringify(bookmark)
      key = `bookmark:${bookmark.bookmarkId}`
      return put(key, json).then(() => {
        console.log(date(), `bookmark ${bookmark.bookmarkId} to database.`)
        response.writeHead(200)
        response.end(json)
      })
    })
  }).catch((err) => on500(response, err))
}

function createAddressForCoin(coin) {
  return new Promise((res, rej) => {
    exec(`node lib/coinbase-create-address.js ${coin}`, (err, stdout, stderr) => {
      if (err) { return rej(err) }
      let address = stdout.split(',')[0]
      let addressId = stdout.split(',')[1]
      res([address, addressId])
    })
  })
}

function createAddress(response, path) {
  let params = paramsOfPath(path)
  if (!params) { return on400(response) }

  let coins = ['DOGE', 'BTC', 'ETH']
  let coin = params['coin']
  if (coin === undefined) { return on400(response) }
  if (coins.indexOf(coin) < 0) { return on400(response) }

  let bookmarkId = params['bookmark']
  if (bookmarkId === undefined) { return on400(response) }
  let key = `bookmark:${bookmarkId}`

  getOrNull(key).then((bookmark) => {
    if (!bookmark) {
      response.writeHead(404)
      response.end('bookmark not found.')
      return
    }

    bookmark = JSON.parse(bookmark)
    let k2 = `${coin.toLowerCase()}Address`
    if (bookmark[k2] !== undefined) { return on400(response) }

    return createAddressForCoin(coin).then((addresses) => {
      let address = addresses[0]
      let addressId = addresses[1]
      bookmark[k2] = address
      k2 = `${coin.toLowerCase()}AddressId`
      bookmark[k2] = addressId
      return put(key, JSON.stringify(bookmark)).then(() => {
        console.log(date(), `address (${coin}) ${address} to database.`)
        response.writeHead(200)
        response.end(address)
      })
    })
  }).catch((err) => on500(response, err))
}

function getReceiptForCoinAddressId(coin, addressId) {
  return new Promise((res, rej) => {
    exec(`node lib/coinbase-get-receipt.js ${coin} ${addressId}`, (err, stdout, stderr) => {
      if (err) { return rej(err) }
      res(parseFloat(stdout.split(',')[0]))
    })
  })
}

function getReceiptForBookmark(bookmark) {
  let coins = ['DOGE', 'BTC', 'ETH']
  let work = coins.map((coin) => {
    let kaddressId = `${coin.toLowerCase()}AddressId`
    let addressId = bookmark[kaddressId]
    if (addressId) { return getReceiptForCoinAddressId(coin, addressId) }
    return 0.0
  })
  return Promise.all(work).then((results) => {
    let total = results.reduce((acc, paid) => acc += paid, 0.0)
    return total
  })
}

function getBookmark(response, path) {
  let params = paramsOfPath(path)
  if (!params) { return on400(response) }

  let bookmarkId = params['bookmark']
  if (bookmarkId === undefined) { return on400(response) }
  let key = `bookmark:${bookmarkId}`

  getOrNull(key).then((bookmark) => {
    if (!bookmark) {
      response.writeHead(404)
      response.end('bookmark not found.')
      return
    }

    bookmark = JSON.parse(bookmark)
    if (bookmark.balanceOwed <= 0.0) {
      response.writeHead(200)
      response.end(JSON.stringify(bookmark))
      return
    }

    return getReceiptForBookmark(bookmark).then((paid) => {
      if (bookmark.balancePaid !== paid) {
        bookmark.balancePaid = paid
        bookmark.balanceOwed = 10.0 - paid
        console.log(date(), `bookmark (${bookmarkId}) receipt \$${paid.toFixed(2)}.`)
      }
      let json = JSON.stringify(bookmark)
      return put(key, json).then(() => {
        response.writeHead(200)
        response.end(json)
      })
    })
  }).catch((err) => on500(response, err))
}

function getCalendar(response, path) {
  let year = 2020
  let parts = path.split('/')
  if (parts.length > 2) {
    year = parseInt(parts[2])
    if (year < 2013 || year > 2025) { year = 2020 }
  }

  let params = paramsOfPath(path)
  if (!params) { params = { } }
  let bookmarkId = params['bookmark']
  if (bookmarkId === undefined || year === 2020) {
    response.writeHead(201)
    fs.createReadStream(`dist/calendar/year-2020.pdf`).pipe(response)
    return
  }

  let key = `bookmark:${bookmarkId}`
  getOrNull(key).then((bookmark) => {
    if (!bookmark) {
      response.writeHead(201)
      fs.createReadStream(`dist/calendar/year-2020.pdf`).pipe(response)
    } else {
      response.writeHead(200)
      fs.createReadStream(`dist/calendar/year-${year}.pdf`).pipe(response)
    }
  }).catch((err) => on500(response, err))
}

const server = http.createServer(function (request, response) {
  let method = request.method
  let path = request.url
  console.log(date(), 'debug:', method, path)

  if (method !== 'GET') {
    on400(response)
    return
  }

  if (path.startsWith('/api/create-captcha')) {
    createCaptcha(response)
  } else if (path.startsWith('/api/create-bookmark')) {
    createBookmark(response, path)
  } else if (path.startsWith('/api/create-address')) {
    createAddress(response, path)
  } else if (path.startsWith('/api/get-bookmark')) {
    getBookmark(response, path)
  } else if (path.startsWith('/calendar')) {
    getCalendar(response, path)
  } else {
    on400(response)
  }
})

function batchExpire() {
  return new Promise((res, rej) => {
    let keys = database.createKeyStream()
    keys.on('end', () => {
      setTimeout(() => {
        batchExpire()
          .catch(onError)
      }, 1000 * 60 * 15)
      console.log(date(), 'complete batch expire.')
      res()
    })
    keys.on('data', (key) => {
      if (key.startsWith('expire:')) {
        let parts = key.split(':')
        if (parseInt(parts[1]) <= Date.now()) {
          del(parts[2])
            .then(() => del(key))
            .catch(rej)
        }
      }
    })
  })
}

if (argv._.length < 1) { onError(new Error('bad cmd arguments')) }
let port = parseInt(argv._[0])
server.listen(port)
batchExpire().catch(onError)
