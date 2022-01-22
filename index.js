let choo = require('choo')
let app = choo({ href: false })

if (process.env.NODE_ENV !== 'production') {
  app.use(require('choo-devtools')())
}

function store (state, emitter) {
  state.bookmarkId = 0
  state.balanceOwed = 10.0
  state.payWithCoin = undefined
  state.fetching = false

    emitter.on('captcha-fail', () => {
      state.fetching = false
      state.payWithCoin = undefined
      emitter.emit(state.events.RENDER)
    })

    emitter.on('captcha-success', (success) => {
      state.fetching = false
      let coin = success[0]
      let address = success[1]
      let kaddress = `${coin.toLowerCase()}Address`
      state[kaddress] = address
      state.payWithCoin = undefined
      let path = `/bookmark/${state.bookmarkId}`
      emitter.emit('get-bookmark', state.bookmarkId)
      emitter.emit(state.events.REPLACESTATE, path)
    })

    emitter.on('load-fail', () => {
      state.fetching = false
      emitter.emit(state.events.RENDER)
    })

    emitter.on('load-success', (json) => {
      state.fetching = false
      Object.assign(state, json)
      emitter.emit(state.events.RENDER)
      setTimeout(function() {
        if (state.balanceOwed > 0.0) {
          emitter.emit('get-bookmark', state.bookmarkId)
        }
      }, 1000 * 10)
    })

    emitter.on('address-success', (success) => {
      state.fetching = false
      let coin = success[0]
      let address = success[1]
      let kaddress = `${coin.toLowerCase()}Address`
      state[kaddress] = address
      emitter.emit(state.events.RENDER)
    })

    emitter.on('get-bookmark', (bookmarkId) => {
      if (state.fetching) { return }
      state.fetching = true
      emitter.emit(state.events.RENDER)
      let path = `/api/get-bookmark?bookmark=${bookmarkId}&bust=${Date.now()}`
      fetch(path).then((response) => {
        if (response.status !== 200) {
          emitter.emit('load-fail')
        } else {
          return response.json().then((json) => emitter.emit('load-success', json))
        }
      }).catch((err) => console.log('error', err))
    })

    emitter.on('click-pay', (coin) => {
      state.payWithCoin = coin
      emitter.emit(state.events.RENDER)
    })

    emitter.on('click-pay2', (coin) => {
      if (state.fetching) { return }
      state.fetching = true
      emitter.emit(state.events.RENDER)
      let bookmarkId = state.bookmarkId
      let path = `/api/create-address?coin=${coin}&bookmark=${bookmarkId}&bust=${Date.now()}`
      fetch(path).then((response) => {
        if (response.status !== 200) {
          emitter.emit('captcha-fail')
        } else {
          return response
            .text().then((text) => emitter.emit('address-success', [coin, text]))
        }
      }).catch((err) => console.log('error', err))
    })

    emitter.on('click-solve', (value) => {
      if (state.fetching) { return }
      state.fetching = true
      emitter.emit(state.events.RENDER)
      let path = `/api/create-bookmark?captcha=${value}&bust=${Date.now()}`
      fetch(path).then((response) => {
        if (response.status !== 200) { return emitter.emit('captcha-fail') }
        return response.json().then((json) => {
          Object.assign(state, json)
          let coin = state.payWithCoin
          path = `/api/create-address?coin=${coin}&bookmark=${state.bookmarkId}`
          return fetch(path).then((response) => {
            if (response.status === 200) {
               return response
                 .text().then((txt) => emitter.emit('captcha-success', [coin, txt]))
            } else {
              emitter.emit('captcha-fail')
            }
          })
        })
      }).catch((err) => console.log('error', err))
    })
}

app.use(store)

app.route('/', require('./lib/home.js'))
app.route('/faq', require('./lib/faq.js'))
app.route('/solve', require('./lib/solve.js'))
app.route('/bookmark/:id', require('./lib/bookmark.js'))
app.route('/historic', require('./lib/historic.js'))
app.route('/forecast', require('./lib/forecast.js'))
app.route('/moons', require('./lib/moons.js'))
app.route('/dates', require('./lib/dates.js'))
app.route('/days', require('./lib/days.js'))
app.route('/*', require('./lib/404.js'))

module.exports = app.mount('.app')
