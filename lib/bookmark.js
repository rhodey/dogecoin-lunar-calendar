var html = require('choo/html')

function iframeView(state, emit) {
  if (state.bookmarkId === 0 || state.fetching) {
    return html`<iframe width="400px" height="250px" scrolling="no" srcdoc="<h1>Loading...</h1>"></iframe>`
  } else if (state.balanceOwed <= 0.0) {
    let src = `<h1>Bookmark this page.</h1><h2>Wow, thanks!!</h2>`
    return html`<iframe width="400px" height="250px" scrolling="no" srcdoc=${src}></iframe>`
  } else {
    let src = `<h1>Bookmark this page.</h1><h2>Awaiting payment of ${state.balanceOwed.toFixed(2)} USD</h2>`
    return html`<iframe width="400px" height="250px" scrolling="no" srcdoc=${src}></iframe>`
  }
}

function calendarHref(state, year) {
  return state.balanceOwed <= 0.0 || year === 2020 ?
    html`<a href="/calendar/${year}?bookmark=${state.bookmarkId}">${year} Dogecoin Lunar Calendar</a>` :
    html`<span class="unpaidHref">Pay ${state.balanceOwed.toFixed(2)} total to unlock all years.</span>`
}

function downloadsView(state, emit) {
  let listItems = []
  for (let year = 2013; year <= 2025; year++) {
    listItems.push(html`<li>${year} - ${calendarHref(state, year)}</li>`)
  }
  return html`
    <div class="downloads">
      <ul>
        ${listItems}
      </ul>
    </div>
  `
}

function coinView(state, emit, coin) {
  let address = undefined
  let button = undefined

  function clickPay() {
    emit('click-pay2', coin)
  }

  let kaddress = `${coin.toLowerCase()}Address`
  if (state.bookmarkId === 0) {
    address = html`<p class="address">x000000000000</p>`
    button = html`<button disabled>loading,</button>`
  } else if (state[kaddress]) {
    address = html`<p class="address">${state[kaddress]}</p>`
    button = state.balanceOwed > 0.0 ?
      html`<button disabled>online</button>` :
      html`<button disabled>thanks!</button>`
  } else {
    address = html`<p class="address">x000000000000</p>`
    button = html`<button onclick=${clickPay}>Pay with ${coin}</button>`
  }

  return html`
    <div class="coin">
      <h2>${coin}</h2>
      ${address}
      ${button}
    </div>
  `
}
module.exports = function createView (state, emit) {
  let bookmarkId = state.params.id
  if (bookmarkId !== state.bookmarkId) {
    emit('get-bookmark', bookmarkId)
  }
  return html`
    <div class="app">
      <div class="bookmarkBox">
        <div class="row">
          <div class="coll col-xs-7">
            ${iframeView(state, emit)}
            ${downloadsView(state, emit)}
          </div>
          <div class="coll col-xs-5">
            <div class="coins">
              ${coinView(state, emit, 'DOGE')}
              ${coinView(state, emit, 'BTC')}
              ${coinView(state, emit, 'ETH')}
            </div>
          </div>
        </div>
      </div>
    </div>
  `
}
