const app = angular.module('playmaker', ['ui.router'])

// DOM elements
const court = document.getElementById('court')
// const btnReplay = document.getElementById('replay')

// Data initialisations
const playersOnDOM = { }
const defaultConfig = Object.freeze({
  pg: { x: 330, y: 550, hasBall: true},
  sg: { x: 100, y: 450, hasBall: false},
  sf: { x: 560, y: 450, hasBall: false},
  pf: { x: 230, y: 380, hasBall: false},
  c:  { x: 400, y: 250, hasBall: false}
})
const newTransition = Object.freeze({
  pg: { path: [], timeout: 0, nextState: {} },
  sg: { path: [], timeout: 0, nextState: {} },
  sf: { path: [], timeout: 0, nextState: {} },
  pf: { path: [], timeout: 0, nextState: {} },
  c:  { path: [], timeout: 0, nextState: {} }
})

let startState = JSON.parse(JSON.stringify(defaultConfig))

const playData = {
  startState: startState,
  transitions: [],
}

let currTransition = JSON.parse(JSON.stringify(newTransition))

// Constants and flags
const FRAME_MILLIS = 800
const MARKER_DIAMETER = 40

// Global functions
function renderState(state) {
  for (let player in playersOnDOM) {
    const marker = playersOnDOM[player]
    const coords = defaultConfig[player]

    // Reset coordinates and data attributes
    marker.setAttribute('style', `left: ${coords.x}px; top: ${coords.y}px;`)
    marker.setAttribute('data-x', 0)
    marker.setAttribute('data-y', 0)

    // Reset transforms
    marker.style.webkitTransform = marker.style.transform = 'translate(0px, 0px)'

    // Reset class lists
    marker.className = ''
    marker.classList.add('player')
    if (coords.hasBall) marker.classList.add('ball')
  }
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
    component: 'dev'
  })

  // Default route
  $urlRouterProvider.otherwise('/')
}])