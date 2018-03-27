const app = angular.module('playmaker', ['ui.router'])

/**
 * DOM elements
 */
const court = document.getElementById('court')
const currPlayName = document.getElementById('currPlayName')

/**
 * Data initialisations
 */

// Court zones
const leftWing    = { x: 200, y: 200, name: 'left wing' }
const leftBlock   = { x: 350, y: 200, name: 'left block' }
const rightBlock  = { x: 500, y: 200, name: 'right block' }
const rightWing   = { x: 650, y: 200, name: 'right wing' }
const leftElbow   = { x: 300, y: 380, name: 'left elbow' }
const topOfKey    = { x: 400, y: 380, name: 'top of the key' }
const rightElbow  = { x: 650, y: 380, name: 'right elbow' }
const midCourt    = { x: 650, y: 530, name: 'mid-court' }
const backCourt   = { x: 650, y: 1130, name: 'back-court'}

const zones = [leftWing, leftBlock, rightBlock, rightWing, 
               leftElbow, topOfKey, rightElbow, midCourt, backCourt]

const playersOnDOM = { }

const defaultConfig = Object.freeze({
  pg: { x: 330, y: 380, hasBall: true},
  sg: { x: 100, y: 300, hasBall: false},
  sf: { x: 560, y: 300, hasBall: false},
  pf: { x: 250, y: 200, hasBall: false},
  c:  { x: 400, y: 100, hasBall: false}
})

const PenTypes = Object.freeze({ 'move': 0, 'screen': 1, 'pass': 2 })

const newTransition = Object.freeze({
  pg: { path: [], pen: 0, timeout: 0, nextState: {} },
  sg: { path: [], pen: 0, timeout: 0, nextState: {} },
  sf: { path: [], pen: 0, timeout: 0, nextState: {} },
  pf: { path: [], pen: 0, timeout: 0, nextState: {} },
  c:  { path: [], pen: 0, timeout: 0, nextState: {} }
})

let startState = null
let lastState = null
let currTransition = JSON.parse(JSON.stringify(newTransition))

let playData = {
  startState: startState,
  transitions: [],
  analysis: []
}

// Constants and flags
const FRAME_MILLIS      = 1000
const PASS_MILLIS       = 500
const MARKER_DIAMETER   = 40
const SMOOTHNESS        = 2
const COURT_ID          = 'court'
const PLAYER_ID         = 'player'
const BALL_ID           = 'ballhandler'
const ACTIVE_BTN        = 'activeButton'
const PASS_PATH_LENGTH  = 50
const PASS_TIMEOUT      = PASS_MILLIS / PASS_PATH_LENGTH
const defaultZone       = '3-out'

// Global functions
function renderState(state) {
  for (let player in playersOnDOM) {
    const marker = playersOnDOM[player]
    const coords = state[player]

    // Reset coordinates and data attributes
    marker.setAttribute('style', `left: ${coords.x}px; top: ${coords.y}px;`)
    marker.setAttribute('data-x', 0)
    marker.setAttribute('data-y', 0)

    // Reset transforms
    marker.style.webkitTransform = marker.style.transform = 'translate(0px, 0px)'

    // Reset class lists
    marker.className = ''
    marker.classList.add(PLAYER_ID)
    if (coords.hasBall) marker.classList.add(BALL_ID)
  }
}

/**
 * Returns the ID of the ball handler in the @param state.
 */
function getCurrentBallHandler(state) {
  for (let player in state) 
    if (state[player].hasBall) return player
  
  return null
}

function getZone(coord) {
  console.log(coord)
  const x = coord.x
  const y = coord.y
  for (let zone of zones) if (x < zone.x && y < zone.y) return zone.name
  return null
}

// Components
app.component('init', {
  templateUrl: '/assets/views/init.html',
  controller: 'InitController'
})

app.component('dev', {
  templateUrl: '/assets/views/dev.html',
  controller: 'DevController'
})

app.component('load', {
  templateUrl: '/assets/views/load.html',
  controller: 'LoadController'
})

// States
app.config(['$stateProvider', '$urlRouterProvider', ($stateProvider, $urlRouterProvider) => {
  // Register states
  $stateProvider.state({
    name: 'init',
    url: '/',
    component: 'init'
  })

  $stateProvider.state({
    name: 'dev',
    url: '/',
    component: 'dev',
    params: {
      playData: null
    }
  })

   $stateProvider.state({
     name: 'load',
     url: '/',
     component: 'load'
   })

  // Default route
  $urlRouterProvider.otherwise('/')
}])

// Global events
document.getElementById('homeButton').addEventListener('click', (event) => window.location = '/')