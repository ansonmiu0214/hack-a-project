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

    console.log(`final data: (${new_dx}, ${new_dy})`)
  
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

    // Assign timeout and next state of moved player
    currTransition[id].timeout = timeout
    currTransition[id].nextState = nextState
  }

  /**
   * Saves currTransition into play data and resets
   * currTransition into a blank slate.
   */
  function saveFrame(event = null) {
    // Add transition to play data
    playData.transitions.push(currTransition)

    // Update last-updated state from this saved transition
    lastState = parseStateFromTransition(currTransition)

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
    btnReplay.classList.add('active')
    btnReplay.disabled = true

    // Render start state
    renderState(startState)

    // Replay frames denoting maximum frame count
    const frameCount = playData.transitions.length
    replayFrames(startState, playData.transitions, frameCount)
      .then((val) => {
        // Re-enable replay button upon completion
        btnReplay.classList.remove('active')
        btnReplay.disabled = false
      })
  }

  /**
   * Replay frames for @param transitions[@param count]. Makes use of 
   * recursive resolution of the Promise array to ensure that each
   * transition is synchronous (but player movements within a specific
   * transition are ran asynchronously).
   */
  function replayFrames(prevState, transitions, maxCount, count = 0) {
    return new Promise((resolve, reject) => {
      // Base case: no more frames to replay
      if (count == maxCount) {
        resolve(true)
      } else {
        // Initialise array of MovePlayer promises
        const playerMovements = []

        // Parse transition data
        const transition = transitions[count]
        const currState = parseStateFromTransition(transition)

        // Move each player on DOM
        for (let player in playersOnDOM) 
          playerMovements.push(movePlayer(transition, playersOnDOM[player]))

        Promise.all(playerMovements).then((res) => {
          // Handle pass AFTER movement
          const prevHandler = getCurrentBallHandler(prevState)
          const currHandler = getCurrentBallHandler(currState)

          if (prevHandler !== currHandler) {
            runPassAnimation(prevHandler, currHandler).then((res) => {
              replayFrames(currState, transitions, maxCount, count + 1)
                .then((val) => resolve(val))
            })
          } else {
            replayFrames(currState, transitions, maxCount, count + 1)
              .then((val) => resolve(val))
          }
        })
      }
    })
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
      if (currentPen === penPass) disablePassMode()
      if (target == penPass) enablePassMode()

      currentPen.classList.remove('active')
      target.classList.add('active')
      currentPen = target
    }
    event.preventDefault()
  }

  function disablePassMode() {
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

    for (let player in playersOnDOM) removePassCandidate(playersOnDOM[player])
  }

  function enablePassMode() {
    // Disable player marker dragging ability
    interact('.player').unset()
    
    const currHandler = getCurrentBallHandler(parseStateFromTransition(currTransition))
    for (let player in playersOnDOM) {
      if (player !== currHandler) makePassCandidate(playersOnDOM[player])
    }
  }

  function makePassCandidate(playerDOM) {
    const currParent = playerDOM.parentNode
    
    // Return if player is already a candidate
    if (currParent.id !== COURT_ID) return
  
    // Create anchor element with callback for pass candidate
    const anchor = document.createElement('a')
    anchor.classList.add('passCandidate')
    anchor.addEventListener('click', (event) => makePass(event, playerDOM.id))

    // Wrap anchor as parent of player
    currParent.replaceChild(anchor, playerDOM)
    anchor.appendChild(playerDOM)
  }

  function removePassCandidate(playerDOM) {
    const currParent = playerDOM.parentNode

    // Return if player is already not a candidate
    if (currParent.id === COURT_ID) return

    // Remove player and add it back to court's child list
    const court = currParent.parentNode
    currParent.removeChild(playerDOM)
    court.appendChild(playerDOM)

    // Remove anchor tag
    court.removeChild(currParent)
  }

  function makePass(event, receiver) {
    const passer = getCurrentBallHandler(parseStateFromTransition(currTransition))

    // Save frame BEFORE pass
    saveFrame()

    // Update state
    currTransition[passer].nextState.hasBall = false
    currTransition[receiver].nextState.hasBall = true

    // Update CSS
    renderPass(passer, receiver)

    // Update passing candidates (receiver no longer candidate, passer is)
    removePassCandidate(playersOnDOM[receiver])
    makePassCandidate(playersOnDOM[passer])

    // Save frame AFTER pass
    saveFrame() 
    event.preventDefault()
  }

  function runPassAnimation(passer, receiver) {
    const passerDOM = playersOnDOM[passer]
    const receiverDOM = playersOnDOM[receiver]

    // Parse coordinates of passer and receiver
    const passerCoord = {
      x: passerDOM.offsetLeft + parseFloat(passerDOM.getAttribute('data-x')),
      y: passerDOM.offsetTop + parseFloat(passerDOM.getAttribute('data-y'))
    }
    const receiverCoord = {
      x: receiverDOM.offsetLeft + parseFloat(receiverDOM.getAttribute('data-x')),
      y: receiverDOM.offsetTop + parseFloat(receiverDOM.getAttribute('data-y'))
    }

    return new Promise((resolve, reject) => {
      // Generate "ball" at passer coordinate
      const ball = document.createElement('div')
      ball.classList.add('ball')

      // Generate path
      const path = []
      const total_dx = receiverCoord.x - passerCoord.x
      const total_dy = receiverCoord.y - passerCoord.y
      const dx = total_dx / PASS_PATH_LENGTH
      const dy = total_dy / PASS_PATH_LENGTH
      for (let i = 0; i < PASS_PATH_LENGTH; ++i)
        path.push({ x: dx, y: dy })
  
      // Set offsets and data-attrs
      ball.setAttribute('style', `left: ${passerCoord.x}px; top: ${passerCoord.y}px`)
      ball.setAttribute('data-x', 0)
      ball.setAttribute('data-y', 0)
      court.appendChild(ball)

      // Animate pass
      animatePassBall(ball, path).then((val) => {
        // Remove ball from court
        court.removeChild(ball)

        // Update passer CSS representation
        renderPass(passer, receiver)

        // Signal parent
        resolve(true)
      })
    })
  }

  function animatePassBall(ball, path, count = 0) {
    return new Promise((resolve, reject) => {
      if (count == PASS_PATH_LENGTH) {
        resolve(true)
      } else {
        setTimeout(() => {
          // Get dx & dy
          const dx = (parseFloat(ball.getAttribute('data-x')) || 0) + path[count].x
          const dy = (parseFloat(ball.getAttribute('data-y')) || 0) + path[count].y

          // Apply transform
          ball.style.transform = ball.style.webkitTransform = `translate(${dx}px, ${dy}px)`

          // Update data-x and data-y attributes
          ball.setAttribute('data-x', dx)
          ball.setAttribute('data-y', dy)

          // Recursive call
          animatePassBall(ball, path, count + 1).then((val) => resolve(val))
        }, PASS_TIMEOUT)
      }
    })
  }

  /**
   * Show the pass being made by toggling the classes of the passer (#@param oldID)
   * and the receiver (#@param newID).
   */
  function renderPass(oldID, newID) {
    const passer = playersOnDOM[oldID]
    const receiver = playersOnDOM[newID]

    passer.classList.remove(BALL_ID)
    receiver.classList.add(BALL_ID)
  }

  function init() {
    // Set active pen to MOVE
    penMove.classList.add('active')
    currentPen = penMove

    // Enable draggability for players
    disablePassMode()
  }

  /**
   * DOM links
   */
  // Buttons
  btnSave.addEventListener('click', saveFrame)
  btnReplay.disabled = true
  btnReplay.addEventListener('click', replay)

  // Pens
  penMove.addEventListener('click', applyNewPen)
  penScreen.addEventListener('click', applyNewPen)
  penPass.addEventListener('click', applyNewPen)

  init()
}])