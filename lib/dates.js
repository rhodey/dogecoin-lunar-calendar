var html = require('choo/html')

module.exports = function createView (state, emit) {
  if (document.title !== 'dogecoincalendar.com') {
    document.title = 'dogecoincalendar.com'
  }

  return html`
    <div class="app">
      <div class="cliBox datesBox">
        <h1>1 - 31,</h1>
        <iframe src="/dates.txt" width="80%" height="650px"></iframe>
      </div>
    </div>
  `
}
