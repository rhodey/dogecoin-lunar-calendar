var html = require('choo/html')

module.exports = function createView (state, emit) {
  if (document.title !== 'dogecoincalendar.com') {
    document.title = 'dogecoincalendar.com'
  }

  return html`
    <div class="app">
      <div class="cliBox moonsBox">
        <h1>New, Quarter, Full, Third Quarter,</h1>
        <iframe src="/moons.txt" width="80%" height="650px"></iframe>
      </div>
    </div>
  `
}
