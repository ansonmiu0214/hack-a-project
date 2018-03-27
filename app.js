// Dependencies
const express = require('express')
const bodyParser = require('body-parser')
const path = require('path')
const fs = require('fs')

// Globals
const PORT = process.env.PORT || 5000
const ZONE_DIR = './zones'

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
  fs.readdirSync('./zones').forEach(jsonFile => {
    // Parse JSON file in folder
    const zoneObj = JSON.parse(fs.readFileSync(`${ZONE_DIR}/${jsonFile}`, 'utf8'))

    // Copy into return object
    zones[zoneObj.name] = zoneObj.setup
  })

  res.send(zones)
})

// Get JSON of play
app.get('/api/play', (req, res) => {
  
})

// Save new play to server
app.post('/api/play', (req, res) => {
  
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