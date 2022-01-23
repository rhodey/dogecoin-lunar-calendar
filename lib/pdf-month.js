const fs = require('fs')
const { stat } = require('fs')
const split = require('split')
const dayOfWeek = require('day-of-week').get
const daysOfMonth = require('count-days-in-month')
const astro = require('astronomy-engine')
const ephemeris = require('ephemeris')
const { createCanvas, loadImage } = require('canvas')
const argv = require('minimist')(process.argv.slice(2))

function ppi(inches) {
  return parseInt(inches * 72)
}

const WIDTH = ppi(11)
const HEIGHT = ppi(8.5)

const one = ppi(1)
const two = 2 * one
const three = ppi(3)
const half = one / 2
const quarter = one / 4

const MONTHS = [
  'January', 'February', 'March', 'April',
  'May', 'June', 'July', 'August',
  'September', 'October', 'November', 'December'
]

let newMoons = {}
let q1Moons = {}
let fullMoons = {}
let q3Moons = {}

function moonsOfYear(year) {
  let hour = 1000 * 60 * 60
  let backwards = hour * 24 * 10
  let begin = new Date(Date.parse(`1/1/${year} 12:00`) - backwards).getTime()
  let end = begin + hour * 24 * 375
  let timems = begin + hour

  while (timems < end) {
    let date = new Date(timems)
    let prev = new Date(timems - hour)
    let next = new Date(timems + hour)
    let y = date.getYear() + 1900

    if (y === year) {
      let m = date.getMonth()
      if (!newMoons[m]) { newMoons[m] = [] }
      if (!q1Moons[m]) { q1Moons[m] = [] }
      if (!fullMoons[m]) { fullMoons[m] = [] }
      if (!q3Moons[m]) { q3Moons[m] = [] }

      let moon = astro.MoonPhase(date)
      let mprev = astro.MoonPhase(prev)
      let mnext = astro.MoonPhase(next)

      if (moon < 90.0 && mprev > 270.0) {
        if (Math.abs(360.0 - mprev) < moon) {
          newMoons[prev.getMonth()].push(prev.getDate())
        } else {
          newMoons[date.getMonth()].push(date.getDate())
        }
      }

      if (moon <= 90.0 && mnext >= 90.0) {
        if (90.0 - moon < mnext - 90.0) {
          q1Moons[date.getMonth()].push(date.getDate())
        } else {
          q1Moons[next.getMonth()].push(next.getDate())
        }
      }

      if (moon <= 180.0 && mnext >= 180.0) {
        if (180.0 - moon < mnext - 180.0) {
          fullMoons[date.getMonth()].push(date.getDate())
        } else {
          fullMoons[next.getMonth()].push(next.getDate())
        }
      }

      if (moon <= 270.0 && mnext >= 270.0) {
        if (270.0 - moon < mnext - 270.0) {
          q3Moons[date.getMonth()].push(date.getDate())
        } else {
          q3Moons[next.getMonth()].push(next.getDate())
        }
      }
    }
    timems += hour
  }
}

function drawMonthName(ctx, text, w, h) {
  ctx.font = `${one}px Impact`
  ctx.fillStyle = 'blue'
  ctx.fillText(text, w, h)
  let tw = ctx.measureText(text).width
  ctx.beginPath()
  ctx.strokeStyle = 'rgba(0,0,0,0.6)'
  ctx.lineWidth = ppi(0.20)
  h = h + ppi(0.13)
  ctx.moveTo(w - ppi(0.10), h)
  ctx.lineTo(w + tw + ppi(0.30), h)
  ctx.stroke()
}

function drawYear(ctx, text, w, h, imageDoge) {
  ctx.font = `bold ${one}px Helvetica`
  ctx.fillStyle = 'rgba(0,0,0,0.6)'
  ctx.fillText(text, w, h)
  let widthpx = 600
  let heightpx = 915
  ctx.drawImage(imageDoge,
    0, 0,
    widthpx, heightpx,
    w + ppi(0.55), h - ppi(0.8),
    ppi(0.6), ppi(1.0)
  )
  if (parseInt(text) % 10 === 0) {
    ctx.drawImage(imageDoge,
      0, 0,
      widthpx, heightpx,
      w + ppi(1.65), h - ppi(0.8),
      ppi(0.6), ppi(1.0)
    )
  }
}

function drawCross(ctx, w, h, txt) {
  ctx.beginPath()
  ctx.strokeStyle = 'black'
  ctx.lineWidth = ppi(0.06)

  ctx.moveTo(w, h)
  ctx.lineTo(w + ppi(1.40), h)
  ctx.lineTo(w - ppi(1.40), h)
  ctx.stroke()
  ctx.moveTo(w, h)
  ctx.lineTo(w, h + ppi(1.40))
  ctx.lineTo(w, h - ppi(1.40))
  ctx.stroke()

  ctx.font = `bold italic ${ppi(0.50)}px Helvetica`
  let tw = ctx.measureText(txt).width
  w = w - tw / 2
  h = h - ppi(1.75)
  ctx.fillStyle = 'black'
  ctx.fillText(txt, w, h)

  ctx.beginPath()
  ctx.strokeStyle = '#41f921'
  ctx.lineWidth = ppi(0.05)
  h = h + ppi(0.06)
  ctx.moveTo(w, h)
  ctx.lineTo(w + tw, h)
  ctx.stroke()
}

function drawHouse(ctx, w, h, house, imageHouses) {
  let radius = ppi(1.0)
  let radians = Math.PI / 180.0 * ((house * 30.0) - 2.0)
  ctx.save()
  ctx.translate(w, h)

  let x = radius * Math.cos(radians)
  let y = radius * Math.sin(radians)
  ctx.translate(x, -y)
  ctx.rotate(Math.PI / 180.0 * 106.0 - radians)

  let xHouses = [70, 240, 420, 590, 68, 240, 420, 588, 70, 240, 420, 590]
  let yHouses = [85, 85, 85, 85, 292, 288, 295, 288, 515, 510, 515, 510]
  let widthpx = 110
  let heightpx = 125

  ctx.drawImage(imageHouses,
    xHouses[house - 1], yHouses[house - 1],
    widthpx, heightpx,
    0, ppi(-0.5),
    ppi(0.5), ppi(0.5)
  )
  ctx.restore()
}

function drawHouses(ctx, w, h, year, month, imageHouses) {
  for (let house = 1; house <= 12; house++) {
    drawHouse(ctx, w, h, house, imageHouses)
  }
}

function drawPlanet(ctx, w, h, planet, longitude, imageDoge2, imagePlanets) {
  let radius = ppi(0.9)
  let widthpx = 170
  let heightpx = 200
  let xPlanets = [60, 340, 610, 880, 60, 340, 600, 880, 60, 340]
  let yPlanets = [70, 50, 74, 74, 390, 400, 370, 380, 700, 700]

  let offset = planet === 3 ? -17.0 : 13.0
  let radians = Math.PI / 180.0 * (longitude + offset)
  ctx.save()
  ctx.translate(w, h)

  let x = radius * Math.cos(radians)
  let y = radius * Math.sin(radians)
  ctx.translate(x, -y)
  ctx.rotate(Math.PI / 180.0 * 100.0 - radians)

  if (planet === 3) {
    ctx.scale(-1, 1)
    ctx.rotate(Math.PI / 180.0 * 90.0)
    ctx.drawImage(imageDoge2,
      0, 0,
      320, 320,
      -ppi(0.5), ppi(-0.5),
      ppi(0.5), ppi(0.5)
    )
  } else {
    ctx.drawImage(imagePlanets,
      xPlanets[planet], yPlanets[planet],
      widthpx, heightpx,
      0, ppi(-0.5),
      ppi(0.5), ppi(0.5)
    )
  }
  ctx.restore()
}

function drawPlanetsHelioCentric(ctx, w, h, year, month, imageDoge2, imagePlanets) {
  let planets = ['Sun', 'Mercury', 'Venus', 'Moon', 'Earth', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune']
  let msec = Date.parse(`${1+month}/15/${year} 12:00`)
  let date = new Date(msec)
  for (let i = planets.length - 1; i > 0; i--) {
    if (i !== 4) {
      let longitude = astro.EclipticLongitude(planets[i], date)
      drawPlanet(ctx, w, h, i, longitude, imageDoge2, imagePlanets)
      drawPlanet(ctx, w, h, i, 0.6 + longitude, imageDoge2, imagePlanets)
    }
  }
}

function drawPlanetsGeoCentric(ctx, w, h, year, month, imageDoge2, imagePlanets) {
  let msec = Date.parse(`${1+month}/15/${year} 12:00`)
  let date = new Date(msec)
  let longitude = 74.0060
  let latitude = 40.7128
  let elevation = 0.0
  let bodies = ephemeris.getAllPlanets(date, longitude, latitude, elevation).observed
  let planets = ['sun', 'mercury', 'venus', 'moon', 'moon', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune']
  planets = planets.map((name) => parseInt(bodies[name].apparentLongitudeDd))
  for (let i = planets.length - 1; i >= 0; i--) {
    if (i !== 4) {
      drawPlanet(ctx, w, h, i, planets[i], imageDoge2, imagePlanets)
      drawPlanet(ctx, w, h, i, 0.6 + planets[i], imageDoge2, imagePlanets)
    }
  }
}

function drawPriceLine(ctx, w, h, cw, ch, prices) {
  let incx = Math.floor(cw / 15.0)
  let maxy = Math.max(...prices)
  let incy = (ch / 1.0) * 1.0
  let low = incy * Math.min(...prices)
  ctx.moveTo(w, low + (h - incy * prices[0]))
  prices.forEach(function(price, i) {
    ctx.lineTo(w + i * incx, h + low - incy * price)
  })
}

function drawChart(ctx, w, h, txt, year, month, prices) {
  let ch = quarter + ppi(1.50)
  let cw = ppi(1.85)

  if (prices.length > 0) {
    // whats going on here is every other sample is thrown out to draw a line of lower resolution
    let odd = prices.filter((p, i) => i % 2 === 1)
    let last = prices[prices.length - 1]
    if (last && last !== odd[odd.length - 1]) {
      odd.push(last)
    }

    let low = Math.min(...odd)
    let high = Math.max(...odd)
    let open = odd[0]
    let close = odd[odd.length - 1]
    let normalized = odd.map((price) => ((price - low) / (high - low)) * .75)

    ctx.beginPath()
    ctx.strokeStyle = close >= open ? '#41f921' : 'red'
    ctx.lineWidth = ppi(0.03)
    drawPriceLine(ctx, w - one, -quarter + h + ch, cw, ch, normalized)
    ctx.stroke()

    ctx.font = `${ppi(0.16)}px Helvetica`
    ctx.fillStyle = 'black'
    let txt2 = txt === 'DOGE' ? low.toFixed(4) : low.toFixed(2)
    let tw = ctx.measureText(txt2).width
    ctx.fillText(txt2, w - ppi(1.10) - tw, -quarter + h + ch + ppi(0.05))
    txt2 = txt === 'DOGE' ? high.toFixed(4) : high.toFixed(2)
    tw = ctx.measureText(txt2).width
    ctx.fillText(txt2, w - ppi(1.10) - tw, -quarter + h + ch + ppi(0.05) - ch * .75)
  }
  
  ctx.beginPath()
  ctx.strokeStyle = 'black'
  ctx.lineWidth = ppi(0.04)
  ctx.moveTo(w - one, -quarter + h)
  ctx.lineTo(w - one, -quarter + h + ch)
  ctx.lineTo(w + ppi(.75), -quarter + h + ch)
  ctx.stroke()

  ctx.font = `bold italic ${ppi(0.27)}px Helvetica`
  let tw = ctx.measureText(txt).width
  w = w - tw / 2
  h = h - ppi(0.18)
  ctx.fillStyle = 'black'
  ctx.fillText(txt, w, h)

  ctx.beginPath()
  ctx.strokeStyle = '#41f921'
  ctx.lineWidth = ppi(0.03)
  h = h + ppi(0.04)
  ctx.moveTo(w, h)
  ctx.lineTo(w + tw, h)
  ctx.stroke()
}

function drawHolePunch(ctx, w, h) {
  ctx.beginPath()
  ctx.arc(w, h, ppi(.1), 0, Math.PI * 2, false)
  ctx.fillStyle = 'rgba(0,0,255,0.2)'
  ctx.fill()
  ctx.lineWidth = 0
  ctx.strokeStyle = 'rgba(0,0,0,0.0)'
  ctx.stroke()
}

function pageOne(ctx, year, month, imageDoge, imageDoge2, imageHouses, imagePlanets, coinPrices) {
  let w = half
  let h = one
  let txt = MONTHS[month]
  drawMonthName(ctx, txt, w, h)

  w = ppi(8.5)
  h = ppi(1.0)
  txt = '' + year
  drawYear(ctx, txt, w, h, imageDoge)

  let wcenter = WIDTH / 2
  h = ppi(0.45)
  w = wcenter
  drawHolePunch(ctx, w, h)

  h = ppi(3.80)
  w = wcenter - three - half
  drawCross(ctx, w, h, 'Houses')
  w = wcenter
  drawCross(ctx, w, h, 'HelioCentric')
  w = wcenter + three + half
  drawCross(ctx, w, h, 'GeoCentric')

  txt = 'Spring'
  h = h - ppi(.06)
  w = wcenter + ppi(3.85)
  ctx.font = `bold ${ppi(0.17)}px Helvetica`
  ctx.fillStyle = 'black'
  ctx.fillText(txt, w, h)

  txt = 'Summer'
  w = wcenter - ppi(0.05)
  h = h - ppi(0.7)
  ctx.save()
  ctx.translate(w, h)
  ctx.rotate(Math.PI / 180.0 * -91.0)
  ctx.fillText(txt, 0, 0)
  ctx.restore()

  h = ppi(3.80)
  w = wcenter - three - half
  drawHouses(ctx, w, h, year, month, imageHouses)
  w = wcenter
  drawPlanetsHelioCentric(ctx, w, h, year, month, imageDoge2, imagePlanets)
  w = wcenter + three + half
  drawPlanetsGeoCentric(ctx, w, h, year, month, imageDoge2, imagePlanets)

  h = ppi(6.06)
  w = wcenter - three - half
  drawChart(ctx, w, h, 'BTC', year, month, coinPrices[0])
  w = wcenter
  drawChart(ctx, w, h, 'DOGE', year, month, coinPrices[1])
  w = wcenter + three + half + ppi(0.14)
  drawChart(ctx, w, h, 'ETH', year, month, coinPrices[2])

  h = ppi(8.05)
  w = wcenter - ppi(4.25)
  drawHolePunch(ctx, w, h)
  w = wcenter
  drawHolePunch(ctx, w, h)
  w = wcenter + ppi(4.25)
  drawHolePunch(ctx, w, h)
}

function drawWeekDays(ctx, font, txts, w, h, p) {
  let w2s = []
  let count = txts.length
  for (let i = 0; i < count; i++) {
    let txt = txts[i]
    ctx.font = font
    let tw = ctx.measureText(txt).width
    ctx.fillStyle = 'rgba(0,0,0,0.6)'
    ctx.fillText(txt, w, h)

    ctx.beginPath()
    ctx.strokeStyle = '#41f921'
    ctx.lineWidth = ppi(0.03)
    let h2 = h + ppi(0.04)
    ctx.moveTo(w, h2)
    ctx.lineTo(w + tw, h2)
    ctx.stroke()

    w2s.push(w + tw / 2)
    w = w + p + tw
  }
  return w2s
}

function drawPhase(ctx, w, h, txt) {
  h = h - ppi(0.35)
  ctx.font = `bold italic ${ppi(0.25)}px Helvetica`
  let tw = ctx.measureText(txt).width
  ctx.fillStyle = '#41f921'
  ctx.fillText(txt, w, h)
}

function drawDaysOfMonth(ctx, year, month, font, w2s, h) {
  let date = new Date(Date.parse(`${1+month}/1/${year}`))
  let day7 = dayOfWeek(date, 'America/New_York')
  if (day7 == 0) { day7 = 7 }

  let blanks = day7 - 1
  blanks = new Array(blanks).fill('0x', 0, blanks)
  let dates = new Array(...blanks)
  for (let i = 1; i <= daysOfMonth(year, month); i++) {
    dates.push('' + i)
  }

  dates.forEach(function (date, i) {
    if (i > 0 && i % 7 === 0) { h = h + ppi(0.80) }
    let txt = date
    ctx.font = font
    ctx.fillStyle = 'black'
    let tw = ctx.measureText(txt).width
    let w = w2s[i % 7] - tw / 2
    ctx.fillText(txt, w, h)
    w = w + tw - ppi(0.35)
    if (i >= blanks.length) {
      if (txt.lengh == 2) { w -= tw * 2 }
      if (newMoons[month].indexOf(parseInt(txt)) >= 0) {
        drawPhase(ctx, w, h, '+New')
      } else if (q1Moons[month].indexOf(parseInt(txt)) >= 0) {
        drawPhase(ctx, w, h, '+1')
      } else if (fullMoons[month].indexOf(parseInt(txt)) >= 0) {
        drawPhase(ctx, w, h, '+Full')
      } else if (q3Moons[month].indexOf(parseInt(txt)) >= 0) {
        drawPhase(ctx, w, h, '+3')
      }
    }
  })
}

function drawNotes(ctx, w, h) {
  for (let i = 0; i < 12; i++) {
    ctx.beginPath()
    ctx.strokeStyle = '#41f921'
    ctx.lineWidth = ppi(0.03)
    ctx.moveTo(w, h)
    ctx.lineTo(w + ppi(3.8), h)
    ctx.stroke()
    h += ppi(0.5)
  }
}

function pageTwo(ctx, year, month, imageDoge) {
  let h = ppi(1.5)
  let w = half
  let txt = MONTHS[month]
  drawMonthName(ctx, txt, w, h)

  w = ppi(8.5)
  txt = '' + year
  drawYear(ctx, txt, w, h, imageDoge)

  let wcenter = WIDTH / 2
  h = ppi(.45)
  w = wcenter - ppi(4.25)
  drawHolePunch(ctx, w, h)
  w = wcenter
  drawHolePunch(ctx, w, h)
  w = wcenter + ppi(4.25)
  drawHolePunch(ctx, w, h)

  h = ppi(2.75)
  w = ppi(0.65)
  let font = `bold italic ${ppi(0.50)}px Helvetica`
  let letters = ['M', 'T', 'W', 'TH', 'F', 'S', 'SU']
  let w2s = drawWeekDays(ctx, font, letters, w, h, ppi(0.4))

  h = h + ppi(0.65)
  font = `bold ${ppi(0.40)}px Helvetica`
  drawDaysOfMonth(ctx, year, month, font, w2s, h)

  h = ppi(2.4)
  w = ppi(7)
  drawNotes(ctx, w, h)

  h = ppi(8.05)
  w = wcenter
  drawHolePunch(ctx, w, h)
}

function fileExists(path) {
  return new Promise((res, rej) => {
    stat(path, (err, stats) => {
      if (err) { res(false) }
      else { res(true) }
    })
  })
}

function readCoinPricesIntoArray(year, month, coin) {
  let path = `assets/prices-${coin.toLowerCase()}.csv`
  return fileExists(path).then((exists) => {
    let prices = []
    if (!exists) {
      let thisYear = 1900 + new Date().getYear()
      let thisMonth = new Date().getMonth()
      let len = year === thisYear && month === thisMonth ? 15 : 30 // see later
      len = year > thisYear || (year === thisYear && month > thisMonth) ? 0 : len
      for (let i = 0; i < len; i++) {
        prices.push(Math.ceil(32000 + Math.random() * 40000))
      }
      return prices
    }
    return new Promise((res, rej) => {
      let read = fs.createReadStream(`assets/prices-${coin.toLowerCase()}.csv`)
      read = read.pipe(split())
      read.on('end', () => res(prices))
      read.on('error', rej)
      read.on('data', (line) => {
        let parts = line.split(',')
        if (parts.length === 2) {
          let date = parts[0]
          let year2 = parseInt(date.split('/')[2])
          let month2 = -1 + parseInt(date.split('/')[0])
          if (year2 === year && month2 === month) {
            prices.push(parseFloat(parts[1]))
          }
        }
      })
    })
  })
}

function onError(err) {
  console.error('error', err)
  process.exit(1)
}

let coins = ['BTC', 'DOGE', 'ETH']
let canvas = createCanvas(WIDTH, HEIGHT, 'pdf')
let ctx = canvas.getContext('2d')

if (argv._.length < 1) { onError(new Error('bad cmd arguments')) }
let date = argv._[0]
let year = date.split('/')[1]
let month = date.split('/')[0]

date = new Date(Date.parse(`${month}/15/${year} 12:00`))
year = parseInt(year)
month = -1 + parseInt(month)

Promise.all(coins.map((coin) => readCoinPricesIntoArray(year, month, coin))).then((coinPrices) => {
  return Promise.all([
    loadImage('assets/doge-one.png'),
    loadImage('assets/favicon.png'),
    loadImage('assets/houses.png'),
    loadImage('assets/planets.png')
  ]).then((images) => {
    moonsOfYear(year)
    pageOne(ctx, year, month, images[0], images[1], images[2], images[3], coinPrices)
    ctx.addPage()
    pageTwo(ctx, year, month, images[0])
    canvas.createPDFStream()
          .pipe(fs.createWriteStream('dist/month.pdf'))
  })
}).catch(onError)
