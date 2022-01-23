let html = require('choo/html')

module.exports = function createView (state, emit) {
  if (document.title !== 'dogecoincalendar.com') {
    document.title = 'dogecoincalendar.com'
  }

  return html`
    <div class="app">
      <div class="homeBox">
        <p><span class="wow"><b>Seven planets and three coins, wow!</b></span> Print the 2020 Dogecoin Lunar Calendar for free!! If you want years 2013 through 2025 you will be asked to <a href="/solve">solve a captcha</a> then you will be asked to pay $10 in coin to one single-use address. DOGE, BTC, and ETH payments are supported, see <a href="/faq">FAQ</a> for details.</p>
        <div class="cframe">
          <iframe class="desktopFrame" src="/year-2020.pdf" width="80%" height="650px"></iframe>
          <iframe class="mobileFrame" src="https://docs.google.com/viewer?url=https://dogecoincalendar.com/year-2020.pdf&embedded=true" width="80%" height="650px"></iframe>
        </div>
      </div>
    </div>
  `
}
