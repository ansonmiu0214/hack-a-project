// DOM elements
const court = document.getElementById('court')
const initBallHandler = document.getElementById('initBallHandler')
const btnResetState = document.getElementById('resetState')
const btnSaveState = document.getElementById('saveState')
const btnReplay = document.getElementById('replay')

// Data initialisations
const playersOnDOM = { }
const defaultConfig = Object.freeze({
  pg: { x: 330, y: 550, hasBall: true},
  sg: { x: 100, y: 450, hasBall: false},
  sf: { x: 560, y: 450, hasBall: false},
  pf: { x: 230, y: 380, hasBall: false},
  c:  { x: 400, y: 250, hasBall: false}
})
let startState = JSON.parse(JSON.stringify(defaultConfig))

const playData = {
  startState: startState,
  transitions: [],
}

let currTransition = {
  pg: { path: [], timeout: 0, nextState: {} },
  sg: { path: [], timeout: 0, nextState: {} },
  sf: { path: [], timeout: 0, nextState: {} },
  pf: { path: [], timeout: 0, nextState: {} },
  c:  { path: [], timeout: 0, nextState: {} }
}

// Constants and flags
const FRAME_MILLIS = 1000
const MARKER_DIAMETER = 40
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
  if (isInitFlag) console.log(startState)
  else endMoveDevHandler(event)
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
  const old_x = target.offsetLeft + old_dx + (MARKER_DIAMETER / 2)
  const old_y = target.offsetTop + old_dy + (MARKER_DIAMETER / 2)

  // Derive new coordinates
  const new_dx = (old_dx || 0) + event.dx
  const new_dy = (old_dy || 0) + event.dy
  const new_x = target.offsetLeft + new_dx + (MARKER_DIAMETER / 2)
  const new_y = target.offsetTop + new_dy + (MARKER_DIAMETER / 2) 

  // Translate based on data-x and data-y attributes
  target.style.webkitTransform = target.style.transform = `translate(${new_dx}px, ${new_dy}px)`

  // Update data attributes for stateful memory
  target.setAttribute('data-x', new_dx)
  target.setAttribute('data-y', new_dy)

  // Update start state for player
  startState[id].x = new_x
  startState[id].y = new_y
}

function markerMoveDev(event) {
  const target = event.target
  const id = target.id

  // Old coordinates
  const old_dx = parseFloat(target.getAttribute('data-x'))
  const old_dy = parseFloat(target.getAttribute('data-y'))
  const old_x = target.offsetLeft + old_dx + (MARKER_DIAMETER / 2)
  const old_y = target.offsetTop + old_dy + (MARKER_DIAMETER / 2)

  // Derive new coordinates
  const new_dx = (old_dx || 0) + event.dx
  const new_dy = (old_dy || 0) + event.dy
  const new_x = target.offsetLeft + new_dx + (MARKER_DIAMETER / 2)
  const new_y = target.offsetTop + new_dy + (MARKER_DIAMETER / 2) 

  // Translate based on data-x and data-y attributes
  target.style.webkitTransform = target.style.transform = `translate(${new_dx}px, ${new_dy}px)`

  // Update data attributes for stateful memory
  target.setAttribute('data-x', new_dx)
  target.setAttribute('data-y', new_dy)

  // Add midpoint & endpoint (dx & dy)
  currTransition[id].path.push({ dx: event.dx, dy: event.dy })
}

function endMoveDevHandler(event) {
  const id = event.target.id
  currTransition[id].timeout = FRAME_MILLIS / currTransition[id].path.length
  console.log(currTransition)
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

  btnResetState.addEventListener('click', resetDefaultState)
  btnSaveState.addEventListener('click', saveDefaultState)
  btnReplay.addEventListener('click', replay)

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

function saveDefaultState(event) {
  isInitFlag = false
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

function replay(event) {
  // Render start state
  renderState(startState)

  // Show transition
  for (let player in playersOnDOM) movePlayer(playersOnDOM[player])
}

function movePlayer(marker, count = 0) {
  const data = currTransition[marker.id]
  const timeout = data.timeout
  const path = data.path
  const path_length = path.length
  if (path_length > 0) {
    setTimeout(() => {
      // Get dx & dy
      const dx = (parseFloat(marker.getAttribute('data-x')) || 0) + path[count].dx
      const dy = (parseFloat(marker.getAttribute('data-y')) || 0) + path[count].dy

      // Apply transform
      marker.style.transform = marker.style.webkitTransform = `translate(${dx}px, ${dy}px)`

      // Update data-x and data-y attributes
      marker.setAttribute('data-x', dx)
      marker.setAttribute('data-y', dy)

      // Recurse next path
      console.log(count)
      if (count + 1 < path_length) movePlayer(marker, count + 1)
    }, timeout)
  }
}

init()