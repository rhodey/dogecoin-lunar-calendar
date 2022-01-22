const https = require('https')
const crypto = require('crypto')
const argv = require('minimist')(process.argv.slice(2))

const ACCESS = process.env.coinbase_access
const SECRET = process.env.coinbase_secret
const HOSTNAME = 'api.coinbase.com'

const ACCOUNTS = {
  DOGE: process.env.coinbase_doge_id,
  BTC: process.env.coinbase_btc_id,
  ETH: process.env.coinbase_eth_id
}

function onError(err) {
  console.error('error', err)
  process.exit(1)
}

function readCompletely(response) {
  let json = ""
  return new Promise((res, rej) => {
    response.on('data', (txt) => json += txt)
    response.on('end', () => {
      res(json)
    })
  })
}

function http(method, path, body) {
  let timestamp = Math.floor(Date.now() / 1000)
  let message = timestamp + method + path + body
  let signature = crypto.createHmac('sha256', SECRET).update(message).digest('hex')

  let args = {
    headers : {
      'CB-ACCESS-KEY': ACCESS,
      'CB-ACCESS-SIGN': signature,
      'CB-ACCESS-TIMESTAMP': timestamp,
      'CB-VERSION': '2022-01-12'
    },
    hostname: HOSTNAME, port: 443,
    method, path
  }

  if (body.length > 0) {
    body = new TextEncoder().encode(body)
    args.headers['Content-Type'] = 'application/json'
    args.headers['Content-Length'] = body.length
  }

  return new Promise((res, rej) => {
    let request = https.request(args, function(response) {
      readCompletely(response).then((json) => {
        res([response.statusCode, json])
      }).catch(rej)
    })
    request.on('error', rej)
    if (body.length > 0) { request.write(body) }
    request.end()
  })
}

function getAccounts() {
  let base = '/v2'
  let path = `${base}/accounts`
  return new Promise((res, rej) => {
    http('GET', path, '').then(function(result) {
      let stat = result[0]
      if (stat !== 200) {
        rej(new Error(`http response: ${stat}`))
      } else {
        res(JSON.parse(result[1]).data)
      }
    }).catch(rej)
  })
}

function createAddress(accountId) {
  let base = '/v2'
  let path = `${base}/accounts/${accountId}/addresses`
  let body = JSON.stringify({ name: 'dogecoincalendar.com receive address.' })
  return new Promise((res, rej) => {
    http('POST', path, body).then(function(result) {
      let stat = parseInt(result[0])
      if (!(stat >= 200 && stat < 300)) {
        rej(new Error(`http response: ${stat}`))
      } else {
        res(JSON.parse(result[1]).data)
      }
    }).catch(rej)
  })
}

if (argv._.length < 1) { onError(new Error('bad cmd arguments')) }
let coin = argv._[0]
let accountId = ACCOUNTS[coin]

createAddress(accountId).then((address) => {
  console.log(`${address.address}, ${address.id}`)
}).catch(onError)
