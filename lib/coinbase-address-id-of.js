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

function http(method, path) {
  let timestamp = Math.floor(Date.now() / 1000)
  let message = timestamp + method + path
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

  return new Promise((res, rej) => {
    let request = https.request(args, (response) => {
      readCompletely(response).then((json) => {
        res([response.statusCode, json])
      }).catch(rej)
    })
    request.on('error', rej)
    request.end()
  })
}

function getAccounts() {
  let base = '/v2'
  let path = `${base}/accounts`
  return new Promise((res, rej) => {
    http('GET', path).then((result) => {
      let stat = result[0]
      if (stat !== 200) {
        rej(new Error(`http response: ${stat}`))
      } else {
        res(JSON.parse(result[1]).data)
      }
    }).catch(rej)
  })
}

function pageThroughNext(jsons, res, rej, nextPath) {
  http('GET', nextPath).then((result) => {
    let stat = result[0]
    if (stat !== 200) {
      rej(new Error(`http response: ${stat}`))
    } else {
      let json = JSON.parse(result[1])
      if (json.pagination && json.pagination.next_uri && json.pagination.next_uri.length > 0) {
        pageThroughNext(jsons.concat(json.data), res, rej, json.pagination.next_uri)
      } else {
        res(jsons.concat(json.data))
      }
    }
  }).catch(rej)
}

function getAddresses(accountId) {
  let base = '/v2'
  let path = `${base}/accounts/${accountId}/addresses`
  return new Promise((res, rej) => {
    http('GET', path).then((result) => {
      let stat = result[0]
      if (stat !== 200) {
        rej(new Error(`http response: ${stat}`))
      } else {
        let json = JSON.parse(result[1])
        if (json.pagination && json.pagination.next_uri && json.pagination.next_uri.length > 0) {
          pageThroughNext(json.data, res, rej, json.pagination.next_uri)
        } else {
          res(json.data)
        }
      }
    }).catch(rej)
  })
}

function getAddressId(accountId, address) {
  return getAddresses(accountId).then((addresses) => {
    let addressId = undefined
    addresses.forEach((addr) => { if (addr.address === address) { addressId = addr.id } })
    if (addressId === undefined) { throw new Error('account does not have address') }
    return addressId
  })
}

if (argv._.length < 2) { onError(new Error('bad cmd arguments')) }
let coin = argv._[0]
let address = argv._[1]
let accountId = ACCOUNTS[coin]

return getAddressId(accountId, address).then((addressId) => {
  console.log(addressId)
}).catch(onError)
