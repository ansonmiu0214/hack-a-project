const app = angular.module('playmaker')
app.controller('InitController', ['$scope', '$http', '$location', '$state', ($scope, $http, $location, $state) => {
  console.log('InitController loaded!')

  /**
   * Setup
   */
  
  // DOM elements
  const divBallHandler = document.getElementById('ballHandlers')
  const btnResetState = document.getElementById('resetState')
  const btnSaveState = document.getElementById('saveState')

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

  /**
   * Moving a marker at this state does not add frames.
   * Only need to update start state.
   */
  function markerMoveHandler(event) {
    const target = event.target
    
    // Derive new coordinates
    const dx = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx
    const dy = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy

    // Translate based on data-x and data-y attributes
    target.style.webkitTransform = target.style.transform = `translate(${dx}px, ${dy}px)`

    // Update data attributes for stateful memory
    target.setAttribute('data-x', dx)
    target.setAttribute('data-y', dy)
  }

  function markerEndHandler(event) {
    const target = event.target
    const id = target.id

    // Compute coordinates
    const dx = parseFloat(target.getAttribute('data-x'))
    const dy = parseFloat(target.getAttribute('data-y'))
    const x = target.offsetLeft + dx
    const y = target.offsetTop + dy

    // Update start state for player
    startState[id].x = x
    startState[id].y = y
  }

  function resetDefaultState(event) {
    renderState(defaultConfig)
    event.preventDefault()
  }
  
  function saveDefaultState(event) {
    // Initialise lastState from startState
    lastState = JSON.parse(JSON.stringify(startState))
    
    // Initialise nextStates of each player in current transition
    for (let player in lastState) 
      currTransition[player].nextState = JSON.parse(JSON.stringify(lastState[player]))

    // Change to play-development state
    $state.go('dev')

    event.preventDefault()
  }

  function generatePlayers() {
    for (let player in defaultConfig) {
      const coord = defaultConfig[player]

      const marker = document.createElement('div')
      marker.id = player

      // Add player class (and ball if hasBall)
      marker.classList.add(PLAYER_ID)
      if (coord.hasBall) marker.classList.add(BALL_ID)

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
    const next = event.target.value

    // Update new ball handler on DOM
    playersOnDOM[curr].classList.remove(BALL_ID)
    playersOnDOM[next].classList.add(BALL_ID)

    // Update new ball handler on state
    startState[curr].hasBall = false
    startState[next].hasBall = true
  }
  
  function init() {
    // Render players
    generatePlayers()

    // Populate radio button for initial ball handler
    for (let player in defaultConfig) {
      const formCheck = document.createElement('div')
      formCheck.className = 'form-check'

      // Generate input and label corresponding to player
      formCheck.innerHTML = `<input class="form-check-input ballHandlerRadio"
        type="radio" name="ballHandlerRadio" id="radio_${player}" 
        value="${player}" ${player === 'pg' ? "checked" : ""}>`
      formCheck.innerHTML += `<label class="form-check-label" 
        for="radio_${player}">${player.toUpperCase()}</label>`
      
      divBallHandler.appendChild(formCheck) 
    }

    // Add onclick callback for all ball handler radio inputs
    document.querySelectorAll('.ballHandlerRadio')
      .forEach((radio, index) => radio.addEventListener('change', changedInitBallHandler))

    btnResetState.addEventListener('click', resetDefaultState)
    btnSaveState.addEventListener('click', saveDefaultState)
  }

  /**
   * Post-setup
   */
  init()
}])