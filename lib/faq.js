var html = require('choo/html')

module.exports = function createView (state, emit) {
  if (document.title !== 'dogecoincalendar.com') {
    document.title = 'dogecoincalendar.com'
  }

  return html`
    <div class="app">
      <div class="faqBox">
        <h1>F . A . Q.</h1>
        <br/>
        <h2>What is different about this calendar?</h2>
        <p>Monday is drawn first of the week and planetary locations reflect the 15th of the month.</p>
        <br/>
        <div class="faq2">
          <h2>Is the price history real?</h2>
          <p>Wow, totally. Price updates are published into purchased PDFs daily.</p>
        </div>
        <br/>
        <div class="faq3">
          <h2>What are +1 and +3?</h2>
          <p>+1 and +3 represent first and third quarter Moons.</p>
        </div>
        <br/>
        <div class="faq4">
          <h2>This as data</h2>
          <p>See <a href="/historic">historic</a> and <a href="/forecast">forecast</a>.</p>
        </div>
      </div>
    </div>
  `
}
