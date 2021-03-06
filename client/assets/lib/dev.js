'use strict';

var app = angular.module('playmaker');
app.controller('DevController', ['$scope', '$http', '$location', '$state', function ($scope, $http, $location, $state) {
  console.log('DevController loaded!');
  $scope.hasUnsavedChanges = false;
  $scope.currFrame = 1;
  $scope.totalFrames = 1;

  /**
   * Setup
   */

  // DOM - pens
  var penMove = document.getElementById('move');
  var penScreen = document.getElementById('screen');
  var penPass = document.getElementById('pass');
  var pens = [penMove, penScreen, penPass];

  // DOM - current frame
  var currStageNumber = document.getElementById('currStageNumber');
  var stageUnsaved = document.getElementById('stageUnsaved');
  var stageAnalysis = document.getElementById('stageAnalysis');
  var btnUndo = document.getElementById('undoFrame');
  var btnSave = document.getElementById('saveFrame');

  // DOM - play controls
  var btnPrevFrame = document.getElementById('btnPrevFrame');
  var frameIndicator = document.getElementById('frameIndicator');
  var btnNextFrame = document.getElementById('btnNextFrame');
  var btnReplay = document.getElementById('replay');
  var btnSavePlay = document.getElementById('savePlay');
  var btnExportPlay = document.getElementById('exportPlay');

  // DOM - save modal
  var playName = document.getElementById('playName');
  var playDescription = document.getElementById('playDescription');
  var sendToServer = document.getElementById('sendPlayToServer');

  // Pen
  var currentPen = null;
  var currentPenType = 0;

  function markerMoveHandler(event) {
    var target = event.target;
    var id = target.id;

    // Derive new dx & dy
    var new_dx = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
    var new_dy = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;

    // Translate based on data-x and data-y attributes
    target.style.webkitTransform = target.style.transform = 'translate(' + new_dx + 'px, ' + new_dy + 'px)';

    // Update data attributes for stateful memory
    target.setAttribute('data-x', new_dx);
    target.setAttribute('data-y', new_dy);

    // Add midpoints & endpoint (dx & dy)
    var dx = event.dx / SMOOTHNESS;
    var dy = event.dy / SMOOTHNESS;

    for (var i = 0; i < SMOOTHNESS; ++i) {
      currTransition[id].path.push({ dx: dx, dy: dy });
    }
  }

  function markerEndHandler(event) {
    // Parse data
    var target = event.target;
    var id = target.id;
    var currBallHander = getCurrentBallHandler(parseStateFromTransition(currTransition));

    // Compute frame timeout: total_transition_duration / num_of_transitions
    var timeout = FRAME_MILLIS / currTransition[id].path.length;

    // Derive new coordinates
    var new_x = target.offsetLeft + parseFloat(target.getAttribute('data-x'));
    var new_y = target.offsetTop + parseFloat(target.getAttribute('data-y'));

    // Formulate a new state for the player that moved
    var nextStateCoord = {
      x: new_x,
      y: new_y,
      hasBall: currBallHander === id

      // Assign timeout, next state and pen type of moved player
    };currTransition[id].timeout = timeout;
    currTransition[id].nextState = nextStateCoord;
    currTransition[id].pen = currentPenType;

    generateAnalysis(id, lastState, nextStateCoord);

    // Indicate unsaved change flag
    if (!$scope.hasUnsavedChanges) $scope.$apply(function () {
      return $scope.hasUnsavedChanges = true;
    });
  }

  function generateAnalysis(playerID, prevState, currCoord) {
    var handler = getCurrentBallHandler(prevState);
    var displayID = playerID.toUpperCase();

    // Get current location
    var currLocation = getZone(currCoord);
    switch (currentPenType) {
      case PenTypes.move:
        stageAnalysis.value += displayID + ' ' + (handler === playerID ? "dribbles" : "moves") + ' to the ' + currLocation + '. ';
        break;
      case PenTypes.screen:
        stageAnalysis.value += displayID + ' sets screen in the ' + currLocation + '. ';
        break;
      case PenTypes.pass:
        break;
    }
  }

  function hasUnsavedFrame() {
    for (var player in currTransition) {
      var data = currTransition[player];
      if (data.path.length > 0) return true;
      if (data.pen !== PenTypes.move) return true;
    }

    return false;
  }

  /**
   * Saves currTransition into play data and resets
   * currTransition into a blank slate.
   */
  function saveFrame() {
    var event = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;

    // Add transition to play data
    playData.transitions.push(currTransition);

    // Add analysis to play data
    playData.analysis.push(stageAnalysis.value);

    // Update last-updated state from this saved transition
    lastState = parseStateFromTransition(currTransition);

    // Reset 'current transition' to a blank slate
    currTransition = initTransition(currTransition);

    // Enable replay button
    btnReplay.disabled = playData.transitions.length == 0;
    $scope.$apply(function () {
      $scope.totalFrames++;
      $scope.currFrame++;
      $scope.hasUnsavedChanges = false;
    });

    stageAnalysis.value = "";
  }

  function initTransitionFromState(state) {
    var transition = JSON.parse(JSON.stringify(newTransition));
    for (var player in state) {
      transition[player].nextState = state[player];
    }return transition;
  }

  /**
   * Returns a new transition with all paths/timeouts cleared but
   * with nextState of each player inherited from its nextState
   * as per @param transition.
   */
  function initTransition(transition) {
    var currTransition = JSON.parse(JSON.stringify(newTransition));

    for (var player in currTransition) {
      currTransition[player].nextState = JSON.parse(JSON.stringify(transition[player].nextState));
    }return currTransition;
  }

  /**
   * Returns the next state of all the players as parsed from
   * the data provided in @param transition.
   */
  function parseStateFromTransition(transition) {
    var parsedState = {};

    for (var player in transition) {
      parsedState[player] = transition[player].nextState;
    }return parsedState;
  }

  function replay(event) {
    // Render start state
    renderState(startState);

    $scope.$apply(function () {
      return $scope.currFrame = 0;
    });

    // Replay frames denoting maximum frame count
    var frameCount = playData.transitions.length;
    replayFrames(startState, playData.transitions, frameCount);
  }

  /**
   * Replay frames for @param transitions[@param count]. Makes use of 
   * recursive resolution of the Promise array to ensure that each
   * transition is synchronous (but player movements within a specific
   * transition are ran asynchronously).
   */
  function replayFrames(prevState, transitions, maxCount) {
    var count = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;
    var isForward = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : true;

    return new Promise(function (resolve, reject) {
      // Base case: no more frames to replay
      if (count === maxCount) {
        resolve(true);
      } else {
        $scope.$apply(function () {
          return $scope.currFrame++;
        });

        // Update analysis
        stageAnalysis.value = playData.analysis[count];

        // Initialise array of MovePlayer promises
        var playerMovements = [];

        // Parse transition data
        var transition = transitions[count];
        var currState = parseStateFromTransition(transition);

        // Move each player on DOM
        for (var player in playersOnDOM) {
          playerMovements.push(movePlayer(transition, playersOnDOM[player]));
        }Promise.all(playerMovements).then(function (res) {
          // Handle pass AFTER movement
          var prevHandler = getCurrentBallHandler(prevState);
          var currHandler = getCurrentBallHandler(currState);

          if (prevHandler !== currHandler) {
            runPassAnimation(prevHandler, currHandler).then(function (res) {
              replayFrames(currState, transitions, maxCount, count + 1, isForward).then(function (val) {
                return resolve(val);
              });
            });
          } else {
            replayFrames(currState, transitions, maxCount, count + 1, isForward).then(function (val) {
              return resolve(val);
            });
          }
        });
      }
    });
  }

  /**
   * Moves the player @param marker from path data in the @param transition.
   * Returns a Promise that the caller resolves to synchronise player movement
   * per transition: movement within a transition can be async but caller must
   * complete all player movement per transition in sync. Recursive call also
   * handles Promise resolution.
   */
  function movePlayer(transition, marker) {
    var count = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;

    return new Promise(function (resolve, reject) {
      // Parse data
      var data = transition[marker.id];
      var timeout = data.timeout;
      var path = data.path;
      var path_length = path.length;

      if (path_length === 0 || count === path_length) {
        // Resolve on base cases
        resolve(true);
      } else {
        setTimeout(function () {
          // Get dx & dy   
          var dx = (parseFloat(marker.getAttribute('data-x')) || 0) + path[count].dx;
          var dy = (parseFloat(marker.getAttribute('data-y')) || 0) + path[count].dy;

          // Apply transform
          marker.style.transform = marker.style.webkitTransform = 'translate(' + dx + 'px, ' + dy + 'px)';

          // Update data-x and data-y attributes
          marker.setAttribute('data-x', dx);
          marker.setAttribute('data-y', dy);

          // Recursive call
          movePlayer(transition, marker, count + 1).then(function (val) {
            return resolve(val);
          });
        }, timeout);
      }
    });
  }

  function applyNewPen(event) {
    var target = event.target;
    if (target !== currentPen) {
      if (currentPen === penPass) disablePassMode();
      if (target == penPass) enablePassMode();

      currentPen.classList.remove(ACTIVE_BTN);
      target.classList.add(ACTIVE_BTN);
      currentPen = target;
      currentPenType = PenTypes[target.id];
    }

    event.preventDefault();
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
    });

    for (var player in playersOnDOM) {
      removePassCandidate(playersOnDOM[player]);
    }
  }

  function enablePassMode() {
    // Disable player marker dragging ability
    interact('.player').unset();

    var currHandler = getCurrentBallHandler(parseStateFromTransition(currTransition));
    for (var player in playersOnDOM) {
      if (player !== currHandler) makePassCandidate(playersOnDOM[player]);
    }
  }

  function makePassCandidate(playerDOM) {
    var currParent = playerDOM.parentNode;

    // Return if player is already a candidate
    if (currParent.id !== COURT_ID) return;

    // Create anchor element with callback for pass candidate
    var anchor = document.createElement('a');
    anchor.classList.add('passCandidate');
    anchor.addEventListener('click', function (event) {
      return makePass(event, playerDOM.id);
    });

    // Wrap anchor as parent of player
    currParent.replaceChild(anchor, playerDOM);
    anchor.appendChild(playerDOM);
  }

  function removePassCandidate(playerDOM) {
    var currParent = playerDOM.parentNode;

    // Return if player is already not a candidate
    if (currParent.id === COURT_ID) return;

    // Remove player and add it back to court's child list
    var court = currParent.parentNode;
    currParent.removeChild(playerDOM);
    court.appendChild(playerDOM);

    // Remove anchor tag
    court.removeChild(currParent);
  }

  function makePass(event, receiver) {
    var passer = getCurrentBallHandler(parseStateFromTransition(currTransition));

    // Save frame BEFORE pass
    if (hasUnsavedFrame()) saveFrame();

    // Update state
    currTransition[passer].nextState.hasBall = false;
    currTransition[receiver].nextState.hasBall = true;

    // Update CSS
    renderPass(passer, receiver);

    var receiverLocation = getZone(currTransition[receiver].nextState);

    // Default caption
    stageAnalysis.value += passer.toUpperCase() + ' passes to ' + receiver.toUpperCase() + ' in the ' + receiverLocation + '. ';

    // Update passing candidates (receiver no longer candidate, passer is)
    removePassCandidate(playersOnDOM[receiver]);
    makePassCandidate(playersOnDOM[passer]);

    // Save frame AFTER pass
    saveFrame();
    event.preventDefault();
  }

  function runPassAnimation(passer, receiver) {
    var passerDOM = playersOnDOM[passer];
    var receiverDOM = playersOnDOM[receiver];

    // Parse coordinates of passer and receiver
    var passerCoord = {
      x: passerDOM.offsetLeft + parseFloat(passerDOM.getAttribute('data-x')),
      y: passerDOM.offsetTop + parseFloat(passerDOM.getAttribute('data-y'))
    };
    var receiverCoord = {
      x: receiverDOM.offsetLeft + parseFloat(receiverDOM.getAttribute('data-x')),
      y: receiverDOM.offsetTop + parseFloat(receiverDOM.getAttribute('data-y'))
    };

    return new Promise(function (resolve, reject) {
      // Generate "ball" at passer coordinate
      var ball = document.createElement('div');
      ball.classList.add('ball');

      // Generate path
      var path = [];
      var total_dx = receiverCoord.x - passerCoord.x;
      var total_dy = receiverCoord.y - passerCoord.y;
      var dx = total_dx / PASS_PATH_LENGTH;
      var dy = total_dy / PASS_PATH_LENGTH;
      for (var i = 0; i < PASS_PATH_LENGTH; ++i) {
        path.push({ x: dx, y: dy });
      } // Set offsets and data-attrs
      ball.setAttribute('style', 'left: ' + passerCoord.x + 'px; top: ' + passerCoord.y + 'px');
      ball.setAttribute('data-x', 0);
      ball.setAttribute('data-y', 0);
      court.appendChild(ball);

      // Animate pass
      animatePassBall(ball, path).then(function (val) {
        // Remove ball from court
        court.removeChild(ball);

        // Update passer CSS representation
        renderPass(passer, receiver);

        // Signal parent
        resolve(true);
      });
    });
  }

  function animatePassBall(ball, path) {
    var count = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;

    return new Promise(function (resolve, reject) {
      if (count == PASS_PATH_LENGTH) {
        resolve(true);
      } else {
        setTimeout(function () {
          // Get dx & dy
          var dx = (parseFloat(ball.getAttribute('data-x')) || 0) + path[count].x;
          var dy = (parseFloat(ball.getAttribute('data-y')) || 0) + path[count].y;

          // Apply transform
          ball.style.transform = ball.style.webkitTransform = 'translate(' + dx + 'px, ' + dy + 'px)';

          // Update data-x and data-y attributes
          ball.setAttribute('data-x', dx);
          ball.setAttribute('data-y', dy);

          // Recursive call
          animatePassBall(ball, path, count + 1).then(function (val) {
            return resolve(val);
          });
        }, PASS_TIMEOUT);
      }
    });
  }

  /**
   * Show the pass being made by toggling the classes of the passer (#@param oldID)
   * and the receiver (#@param newID).
   */
  function renderPass(oldID, newID) {
    var passer = playersOnDOM[oldID];
    var receiver = playersOnDOM[newID];

    passer.classList.remove(BALL_ID);
    receiver.classList.add(BALL_ID);
  }

  function getTotalFrameCount(playDataObject) {
    return playDataObject.transitions.length + 1;
  }

  function undoFrame(event) {
    // Don't need to do anything if no changes detected
    if (!hasUnsavedFrame()) return;

    // Revert current transition variable
    currTransition = initTransitionFromState(lastState);

    // Render previous state
    renderState(lastState);

    // Reset analysis text area
    stageAnalysis.value = '';

    $scope.$apply(function () {
      return $scope.hasUnsavedChanges = false;
    });
  }

  function goToPrevFrame(event) {
    // Update scope variable
    $scope.$apply(function () {
      return $scope.currFrame--;
    });

    // Refresh analysis
    stageAnalysis.value = playData.analysis[$scope.currFrame - 1];

    // Render state
    if ($scope.currFrame === 1) renderState(startState);else renderState(parseStateFromTransition(playData.transitions[$scope.currFrame - 2]));
  }

  function goToNextFrame(event) {
    // Disable button to prevent concurrent animations
    btnNextFrame.disabled = true;

    // Show animation
    var currState = $scope.currFrame === 1 ? startState : parseStateFromTransition(playData.transitions[$scope.currFrame - 2]);

    replayFrames(currState, playData.transitions, $scope.currFrame, $scope.currFrame - 1).then(function (val) {
      // Refresh analysis
      var nextAnalysis = playData.analysis[$scope.currFrame - 1];
      stageAnalysis.value = nextAnalysis ? nextAnalysis : '';

      // Re-enable button
      if ($scope.currFrame < $scope.totalFrames) btnNextFrame.disabled = false;
    });
  }

  function postPlayToServer(event) {
    // Get form data
    var name = playName.value;
    var caption = playDescription.value;

    // Construct object that encapsulates name/caption to send to back end.
    var playToSend = {
      name: name,
      caption: caption,
      playData: playData

      // Make post request and handle success callback
    };$http.post('/api/play', playToSend).then(function (res) {
      alert('Play saved successfully!');
      currPlayName.innerHTML = 'Current play: [' + name + ']';
    });
  }

  function loadPlay(data) {
    // Parse data from object
    var playDataFromServer = data.playData;
    var totalFrameCount = getTotalFrameCount(playDataFromServer);

    $scope.currFrame = totalFrameCount;
    $scope.totalFrames = totalFrameCount;

    // Change play data
    playData = playDataFromServer;
    startState = playData.startState;
    if (totalFrameCount > 1) {
      var lastTransition = playDataFromServer.transitions[totalFrameCount - 2];
      currTransition = initTransition(lastTransition);
      renderState(parseStateFromTransition(lastTransition));
    } else {
      currTransition = initTransitionFromState(playDataFromServer.startState);
      renderState(startState);
      stageAnalysis.value = playDataFromServer.analysis[totalFrameCount - 2];
    }

    // Update name
    currPlayName.innerHTML = 'Current play: [' + data.name + ']';
  }

  function init() {
    // Set active pen to MOVE
    penMove.classList.add(ACTIVE_BTN);
    currentPen = penMove;
    currentPenType = PenTypes[currentPen.id];

    // Enable draggability for players
    disablePassMode();

    /**
     * DOM links
     */
    // Pens
    pens.forEach(function (pen, index) {
      return pen.addEventListener('click', applyNewPen);
    });

    // Current frame control
    btnUndo.addEventListener('click', undoFrame);
    btnSave.addEventListener('click', saveFrame);

    // Overall play control
    btnPrevFrame.addEventListener('click', goToPrevFrame);
    btnNextFrame.addEventListener('click', goToNextFrame);
    btnReplay.addEventListener('click', replay);

    playName.addEventListener('keyup', function (event) {
      return sendToServer.disabled = event.target.value.trim().length === 0;
    });

    sendToServer.addEventListener('click', postPlayToServer);

    // Initialise current play name
    currPlayName.innerHTML = 'Current play: [untitled]';

    // Check for input play and load if necessary
    var inputPlay = $state.params.playData;
    if (inputPlay !== null) loadPlay(JSON.parse(inputPlay));
  }

  init();
}]);