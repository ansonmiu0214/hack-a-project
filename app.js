// Dependencies
const express = require('express')
const bodyParser = require('body-parser')
const path = require('path')
const fs = require('fs')
const crypto = require('crypto')

// Globals
const PORT = process.env.PORT || 5000
const ZONE_DIR = './zones'
const PLAY_DIR = './plays'

// App setup
const app = express()
app.use(bodyParser.json({ limit: '1000mb' }))
app.use(bodyParser.urlencoded({ extended: true }))

/**
 * Endpoints.
 */

// Get a JS object of initial zone formations
app.get('/api/zones', (req, res) => {
  const zones = { }

  // Loop through all files in the `zones' directory
  fs.readdirSync(ZONE_DIR).forEach(jsonFile => {
    // Parse JSON file in folder
    const zoneObj = JSON.parse(fs.readFileSync(`${ZONE_DIR}/${jsonFile}`, 'utf8'))

    // Copy into return object
    zones[zoneObj.name] = zoneObj.setup
  })

  res.send(zones)
})

// Get JSON of play
app.get('/api/play', (req, res) => {
  // Parse hash 
  const hash = req.query.id

  // Construct path
  const path = `${PLAY_DIR}/${hash}.json`

  // Check for existence
  if (!fs.existsSync(path)) {
    res.sendStatus(404)
    return
  }

  // Parse play object data from JSON
  const playObj = JSON.parse(fs.readFileSync(path, 'utf8'))
  res.send(playObj)
})

app.get('/api/plays', (req, res) => {
  const plays = []

  // Loop through all plays in the `plays' directory
  fs.readdirSync(PLAY_DIR).forEach(jsonFile => {
    // Parse JSON file
    const playObj = JSON.parse(fs.readFileSync(`${PLAY_DIR}/${jsonFile}`, 'utf8'))

    // Parse hash and construct load obj
    const hash = path.posix.basename(jsonFile, '.json')
    
    plays.push({
      id: hash,
      name: playObj.name,
      caption: playObj.caption
    })
  })

  res.send(plays)
})

// Save new play to server
app.post('/api/play', (req, res) => {
  // Parse play data from request
  const play = req.body

  // Apply hash on name
  const playID = crypto.createHash('md5').update(play.name).digest('hex')

  // Write to file
  fs.writeFileSync(`${PLAY_DIR}/${playID}.json`, JSON.stringify(play, null, 2), 'utf8')

  // Send success status
  res.sendStatus(200)
})

// Landing
app.get('/', (req, res, next) => {
  console.log('Initialised!')
  next()
})

// Instantiate client-side resources
app.use(express.static(`${__dirname}/client`))

// Listening port
app.listen(PORT, () => console.log(`Listening on port ${PORT}...`))