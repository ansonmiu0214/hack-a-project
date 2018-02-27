// Dependencies
const express = require('express')
const bodyParser = require('body-parser')
const path = require('path')
const fs = require('fs')

// Globals
const PORT = process.env.PORT || 5000

// App setup
const app = express()
app.use(bodyParser.json({ limit: '1000mb' }))
app.use(bodyParser.urlencoded({ extended: true }))

/**
 * Endpoints.
 */

// Landing
app.get('/', (req, res, next) => {
  console.log('Initialised!')
  next()
})

// Instantiate client-side resources
app.use(express.static(`${__dirname}/client`))

// Listening port
app.listen(PORT, () => console.log(`Listening on port ${PORT}...`))