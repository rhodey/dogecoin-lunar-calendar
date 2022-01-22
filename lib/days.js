var html = require('choo/html')

module.exports = function createView (state, emit) {
  if (document.title !== 'dogecoincalendar.com') {
    document.title = 'dogecoincalendar.com'
  }

  return html`
    <div class="app">
      <div class="cliBox daysBox">
        <h1>Monday - Sunday,</h1>
        <iframe src="/days.txt" width="80%" height="650px"></iframe>
      </div>
    </div>
  `
}
