const app = angular.module('playmaker')
app.controller('InitController', ['$scope', '$http', '$location', '$state', ($scope, $http, $location, $state) => {
  console.log('InitController loaded!')

  /**
   * Setup
   */
  
  // DOM elements
  const divBallHandler = document.getElementById('ballHandlers')
  const divZoneSetup = document.getElementById('zoneSetup')
  const btnResetState = document.getElementById('resetState')
  const btnSaveState = document.getElementById('saveState')
  const btnLoadPlay = document.getElementById('loadPlay')

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
    renderState($scope.zones[defaultZone])
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
    const config = $scope.zones[defaultZone]
    for (let player in config) {
      const coord = config[player]

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

  function changedInitZone(event) {
    // Get next zone ID
    const next = event.target.value

    // Change start state and render
    startState = $scope.zones[next]
    renderState(startState)
  }
  
  function init() {
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

    // Load in standard formations from API
    $http.get('/api/zones').then((res) => {
      // Save to scope variable
      $scope.zones = res.data

      for (let zone in res.data) {
        const zoneOption = document.createElement('div')
        zoneOption.className = 'form-check'
  
        zoneOption.innerHTML = `<input class="form-check-input zoneRadio"
          type="radio" name="zoneRadio" id="radio_${zone}" 
          value="${zone}" ${zone === defaultZone ? "checked" : ""}>`
        zoneOption.innerHTML += `<label class="form-check-label" 
          for="radio_${zone}">${zone}</label>`
  
        divZoneSetup.appendChild(zoneOption) 
      }      

      document.querySelectorAll('.zoneRadio')
        .forEach((radio, index) => radio.addEventListener('change', changedInitZone))

      // Render players
      generatePlayers()

      // Set up start state as per default state
      startState = JSON.parse(JSON.stringify($scope.zones[defaultZone]))
    })
    
    btnResetState.addEventListener('click', resetDefaultState)
    btnSaveState.addEventListener('click', saveDefaultState)
    btnLoadPlay.addEventListener('click', (event) => $state.go('load'))
  }

  /**
   * Post-setup
   */
  init()
}])