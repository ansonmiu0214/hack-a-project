// DOM elements
const court = document.getElementById('court')
const initBallHandler = document.getElementById('initBallHandler')
const resetState = document.getElementById('resetState')

// Data initialisations
const defaultConfig = {
  'pg': { x: 330, y: 550, hasBall: true},
  'sg': { x: 100, y: 450, hasBall: false},
  'sf': { x: 560, y: 450, hasBall: false},
  'pf': { x: 230, y: 380, hasBall: false},
  'c': { x: 400, y: 250, hasBall: false}
}

const playersOnDOM = { }

// Deep clone
let startState = JSON.parse(JSON.stringify(defaultConfig))

// Constants and flags
const FRAME_MILLIS = 2000
let isInitFlag = true

// Implement draggable via interactjs for players
interact('.player').draggable({
  inertia: false,
  max: Infinity,
  autoscroll: true,
  
  // Keep element within parent's boundary
  restrict: {
    restriction: 'parent',
    endOnly: true,
    elementRect: { top: 0, left: 0, bottom: 1, right: 1 }
  },

  onmove: markerMoveHandler,
  onend: markerEndHandler
})

function markerMoveHandler(event) {
  if (isInitFlag) markerMoveInit(event)
  else markerMoveDev(event)
}

function markerEndHandler(event) {
  console.log(startState)
}

/**
 * Moving a marker at this state does not add frames.
 * Only need to update start state.
 */
function markerMoveInit(event) {
  const target = event.target
  const id = target.id

  // Old coordinates
  const old_dx = parseFloat(target.getAttribute('data-x'))
  const old_dy = parseFloat(target.getAttribute('data-y'))
  const old_x = null
  const old_y = null

  // Derive new coordinates
  const new_dx = old_dx + event.dx
  const new_dy = old_dy + event.dy
  const new_x = 0
  const new_y = 0

  // Translate based on data-x and data-y attributes
  target.style.webkitTransform = target.style.transform = `translate(${new_dx}px, ${new_dy}px)`

  // Update data attributes for stateful memory
  target.setAttribute('data-x', new_dx)
  target.setAttribute('data-y', new_dy)

  // Update start state for player
  startState[id].x = new_x
  startState[id].y = new_y
}

function init() {
  // Render players
  generatePlayers()

  // Initialise setup form controls
  for (let player in defaultConfig) {
    const opt = document.createElement('option')
    opt.innerHTML = player.toUpperCase()
    initBallHandler.appendChild(opt)
  }

  initBallHandler.addEventListener('change', changedInitBallHandler)

  resetState.addEventListener('click', resetDefaultState)
}

function generatePlayers() {
  for (let player in defaultConfig) {
    const coord = defaultConfig[player]

    const marker = document.createElement('div')
    marker.id = player

    // Add player class (and ball if hasBall)
    marker.classList.add('player')
    marker.classList
    if (coord.hasBall) marker.classList.add('ball')

    // Set offsets and data-attrs
    marker.setAttribute('style', `left: ${coord.x}px; top: ${coord.y}px;`)
    marker.setAttribute('data-x', 0)
    marker.setAttribute('data-y', 0)

    // Append to DOM
    marker.innerHTML = player
    court.appendChild(marker)

    // Add DOM entry to global object
    playersOnDOM[player] = marker
  }
}

// Update initial ball handler in start state
function changedInitBallHandler(event) {
  const curr = getCurrentBallHandler(startState)
  const next = initBallHandler.value.toLowerCase()

  // Update new ball handler on DOM
  playersOnDOM[curr].classList.remove('ball')
  playersOnDOM[next].classList.add('ball')

  // Update new ball handler on state
  startState[curr].hasBall = false
  startState[next].hasBall = true
}

function resetDefaultState(event) {
  renderState(defaultConfig)
  event.preventDefault()
}

function getCurrentBallHandler(state) {
  for (let player in state) {
    if (state[player].hasBall) return player
  }
  return null
}

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

init()