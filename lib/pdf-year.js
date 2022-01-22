const { exec, spawn } = require('child_process')
const argv = require('minimist')(process.argv.slice(2))
const PDFMerger = require('pdf-merger-js')

function onError(err) {
  console.error(err)
  process.exit(1)
}

if (argv._.length < 1) { onError(new Error('bad cmd arguments')) }
let merger = new PDFMerger()
let year = argv._[0]
let month = 1

function write() {
  merger.save(`dist/calendar/year-${year}.pdf`).then(() => {
    console.log(`${year} to dist/calendar/year-${year}.pdf`)
    exec(`cp dist/calendar/year-${year}.pdf dist/year.pdf`, (err, stdout, stderr) => {
      if (err) { return onError(err) }
      console.log(`${year} to dist/year.pdf`)
    })
  }).catch(onError)
}

function next() {
  if (month > 12) { return write() }
  exec(`node lib/pdf-month.js ${month}/${year}`, (err, stdout, stderr) => {
    if (err) { return onError(err) }
    console.log(`${month}/${year} to dist/month.pdf`)
    merger.add('dist/month.pdf')
    month++
    setTimeout(next, 10)
  })
}

next()
