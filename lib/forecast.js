var html = require('choo/html')

module.exports = function createView (state, emit) {
  if (document.title !== 'dogecoincalendar.com') {
    document.title = 'dogecoincalendar.com'
  }

  return html`
    <div class="app">
      <div class="cliBox forecastBox">
        <h1>Forecast - Planets - Houses</h1>
        <iframe src="/forecast.txt" width="80%" height="650px"></iframe>
      </div>
    </div>
  `
}
