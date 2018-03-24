const app = angular.module('playmaker')
app.controller('DevController', ['$scope', '$http', '$location', '$state', ($scope, $http, $location, $state) => {
  console.log('DevController loaded!')

  /**
   * Setup
   */
  // DOM elements
  const btnUndo = document.getElementById('undoFrame')
  const btnSave = document.getElementById('saveFrame')
  const btnReplay = document.getElementById('replay')
  const penMove = document.getElementById('move')
  const penScreen = document.getElementById('screen')
  const penPass = document.getElementById('pass')
  const pens = [penMove, penScreen, penPass]

  // Pen
  let currentPen = null

  function markerMoveHandler(event) {
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
  
    // Add midpoints & endpoint (dx & dy)
    const dx = event.dx / SMOOTHNESS
    const dy = event.dy / SMOOTHNESS

    for (let i = 0; i < SMOOTHNESS; ++i) 
      currTransition[id].path.push({ dx: dx, dy: dy })
  }

  function markerEndHandler(event) {
    // Parse data
    const target = event.target
    const id = target.id
    const currBallHander = getCurrentBallHandler(parseStateFromTransition(currTransition))

    // Compute frame timeout: total_transition_duration / num_of_transitions
    const timeout = FRAME_MILLIS / currTransition[id].path.length

    // Derive new coordinates
    const new_x = target.offsetLeft + parseFloat(target.getAttribute('data-x')) + (MARKER_DIAMETER / 2)
    const new_y = target.offsetTop + parseFloat(target.getAttribute('data-y')) + (MARKER_DIAMETER / 2) 

    // Formulate a new state for the player that moved
    const nextState = {
      x: new_x, 
      y: new_y, 
      hasBall: currBallHander === id
    }

    console.log(nextState)

    // Assign timeout and next state of moved player
    currTransition[id].timeout = timeout
    currTransition[id].nextState = nextState
  }

  /**
   * Saves currTransition into play data and resets
   * currTransition into a blank slate.
   */
  function saveFrame(event) {
    // Add transition to play data
    playData.transitions.push(currTransition)

    console.log(lastState)
    // Update last-updated state from this saved transition
    lastState = parseStateFromTransition(currTransition)
    console.log(lastState)

    // Reset 'current transition' to a blank slate
    currTransition = initTransition(currTransition)

    // Enable replay button
    btnReplay.disabled = playData.transitions.length == 0
  }

  /**
   * Returns a new transition with all paths/timeouts cleared but
   * with nextState of each player inherited from its nextState
   * as per @param transition.
   */
  function initTransition(transition) {
    const currTransition = JSON.parse(JSON.stringify(newTransition))

    for (let player in currTransition)
      currTransition[player].nextState = JSON.parse(JSON.stringify(transition[player].nextState))
    
    return currTransition
  }

  /**
   * Returns the next state of all the players as parsed from
   * the data provided in @param transition.
   */
  function parseStateFromTransition(transition) {
    const parsedState = {}

    for (let player in transition) parsedState[player] = transition[player].nextState
    return parsedState
  }

  function replay(event) {
    // Render start state
    renderState(startState)

    // Replay frames denoting maximum frame count
    const frameCount = playData.transitions.length
    replayFrames(playData.transitions, frameCount)
  }

  /**
   * Replay frames for @param transitions[@param count]. Makes use of 
   * recursive resolution of the Promise array to ensure that each
   * transition is synchronous (but player movements within a specific
   * transition are ran asynchronously).
   */
  function replayFrames(transitions, maxCount, count = 0) {
    // Base case: no more frames to replay
    if (count == maxCount) return

    // Initialise array of MovePlayer promises
    const playerMovements = []
    
    // Parse transition data
    const transition = transitions[count]

    // Move each player on DOM
    for (let player in playersOnDOM) 
      playerMovements.push(movePlayer(transition, playersOnDOM[player]))

    Promise.all(playerMovements).then((res) => replayFrames(transitions, maxCount, count + 1))
  }
  
  /**
   * Moves the player @param marker from path data in the @param transition.
   * Returns a Promise that the caller resolves to synchronise player movement
   * per transition: movement within a transition can be async but caller must
   * complete all player movement per transition in sync. Recursive call also
   * handles Promise resolution.
   */
  function movePlayer(transition, marker, count = 0) {
    return new Promise((resolve, reject) => {
      // Parse data
      const data = transition[marker.id]
      const timeout = data.timeout
      const path = data.path
      const path_length = path.length

      if (path_length == 0 || count == path_length) {
        // Resolve on base cases
        resolve(true)
      } else {
        setTimeout(() => {
          if (!path[count]) {
            console.log(`Undefined path count for ${marker.id} count ${count} length ${path.length}`)
          }
  
          // Get dx & dy   
          const dx = (parseFloat(marker.getAttribute('data-x')) || 0) + path[count].dx
          const dy = (parseFloat(marker.getAttribute('data-y')) || 0) + path[count].dy
    
          // Apply transform
          marker.style.transform = marker.style.webkitTransform = `translate(${dx}px, ${dy}px)`
    
          // Update data-x and data-y attributes
          marker.setAttribute('data-x', dx)
          marker.setAttribute('data-y', dy)
  
          // Recursive call
          movePlayer(transition, marker, count + 1).then((val) => resolve(val)) 
        }, timeout)
      }
    })
  }

  function applyNewPen(event) {
    const target = event.target
    if (target !== currentPen) {
      if (currentPen === penPass) enableDraggable()
      if (target == penPass) disableDraggable()

      currentPen.classList.remove('active')
      target.classList.add('active')
      currentPen = target
    }
    event.preventDefault()
  }

  function enableDraggable() {
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
  }

  function disableDraggable() {
    interact('.player').unset()
  }

  function init() {
    // Set active pen to MOVE
    penMove.classList.add('active')
    currentPen = penMove

    // Enable draggability for players
    enableDraggable()
  }

  /**
   * DOM links
   */
  // Buttons
  btnReplay.disabled = true
  btnSave.addEventListener('click', saveFrame)
  btnReplay.addEventListener('click', replay)

  // Pens
  penMove.addEventListener('click', applyNewPen)
  penScreen.addEventListener('click', applyNewPen)
  penPass.addEventListener('click', applyNewPen)

  init()
}])