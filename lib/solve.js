var html = require('choo/html')

function iframeView(state, emit) {
  if (state.fetching) {
    return html`<iframe width="400px" height="250px" scrolling="no" srcdoc="<h1>Loading...</h1>"></iframe>`
  } if (state.payWithCoin) {
    return html`<iframe width="400px" height="250px" scrolling="no" src="/api/create-captcha"></iframe>`
  } else {
    return html`<iframe width="400px" height="250px" scrolling="no" srcdoc="<h1>Select payment,</h1>"></iframe>`
  }
}

function calendarHref(state, year) {
  if (year === 2020) { return html`<a href="/year-2020.pdf">2020 Dogecoin Lunar Calendar</a>` }
  return state.balanceOwed <= 0.0 ?
    html`<a href="/calendar/${year}?bookmark=${state.bookmarkId}">${year} Dogecoin Lunar Calendar</a>` :
    html`<span class="unpaidHref">Pay \$${state.balanceOwed.toFixed(2)} total to unlock all years.</span>`
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
    emit('click-pay', coin)
  }

  function clickSolve() {
    let value = document.getElementById('solveInput').value
    emit('click-solve', value)
  }

  if (state.payWithCoin === undefined || state.payWithCoin !== coin) {
    address = html`<p class="address">x000000000000</p>`
    button = html`<button onclick=${clickPay}>Pay with ${coin}</button>`
  } else {
    address = html`<input class="solveInput" id="solveInput" type="text" autocomplete="off"></input>`
    button = html`<button class="solveButton" onclick=${clickSolve}>solve</button>`
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
  return html`
    <div class="app">
      <div class="solveBox">
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
