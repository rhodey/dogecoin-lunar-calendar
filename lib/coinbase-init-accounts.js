const fs = require('fs')
const https = require('https')
const crypto = require('crypto')
const argv = require('minimist')(process.argv.slice(2))

const ACCESS = process.env.coinbase_access
const SECRET = process.env.coinbase_secret
const HOSTNAME = 'api.coinbase.com'

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

function getAccountsForCoins(coins) {
  return getAccounts().then((json) => {
    let accounts = []
    json.forEach((account) => {
      let cidx = coins.indexOf(account.currency.code)
      if (cidx >= 0) { accounts[cidx] = account }
    })
    return accounts
  })
}

getAccountsForCoins(['DOGE', 'BTC', 'ETH']).then((accounts) => {
  console.log(`coinbase_doge_id=${accounts[0].id}`)
  console.log(`coinbase_btc_id=${accounts[1].id}`)
  console.log(`coinbase_eth_id=${accounts[2].id}`)
}).catch(onError)
