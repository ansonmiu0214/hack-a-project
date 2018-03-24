'use strict';

var app = angular.module('playmaker');
app.controller('DevController', ['$scope', '$http', '$location', '$state', function ($scope, $http, $location, $state) {
  console.log('DevController loaded!');

  /**
   * Setup
   */
  // DOM elements
  var btnUndo = document.getElementById('undoFrame');
  var btnSave = document.getElementById('saveFrame');
  var btnReplay = document.getElementById('replay');
  var penMove = document.getElementById('move');
  var penScreen = document.getElementById('screen');
  var penPass = document.getElementById('pass');
  var pens = [penMove, penScreen, penPass];

  // Pen
  var currentPen = null;

  function markerMoveHandler(event) {
    var target = event.target;
    var id = target.id;

    // Old coordinates
    var old_dx = parseFloat(target.getAttribute('data-x'));
    var old_dy = parseFloat(target.getAttribute('data-y'));
    var old_x = target.offsetLeft + old_dx + MARKER_DIAMETER / 2;
    var old_y = target.offsetTop + old_dy + MARKER_DIAMETER / 2;

    // Derive new coordinates
    var new_dx = (old_dx || 0) + event.dx;
    var new_dy = (old_dy || 0) + event.dy;
    var new_x = target.offsetLeft + new_dx + MARKER_DIAMETER / 2;
    var new_y = target.offsetTop + new_dy + MARKER_DIAMETER / 2;

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
    var new_x = target.offsetLeft + parseFloat(target.getAttribute('data-x')) + MARKER_DIAMETER / 2;
    var new_y = target.offsetTop + parseFloat(target.getAttribute('data-y')) + MARKER_DIAMETER / 2;

    // Formulate a new state for the player that moved
    var nextState = {
      x: new_x,
      y: new_y,
      hasBall: currBallHander === id
    };

    console.log(nextState);

    // Assign timeout and next state of moved player
    currTransition[id].timeout = timeout;
    currTransition[id].nextState = nextState;
  }

  /**
   * Saves currTransition into play data and resets
   * currTransition into a blank slate.
   */
  function saveFrame(event) {
    // Add transition to play data
    playData.transitions.push(currTransition);

    console.log(lastState);
    // Update last-updated state from this saved transition
    lastState = parseStateFromTransition(currTransition);
    console.log(lastState);

    // Reset 'current transition' to a blank slate
    currTransition = initTransition(currTransition);

    // Enable replay button
    btnReplay.disabled = playData.transitions.length == 0;
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

    // Replay frames denoting maximum frame count
    var frameCount = playData.transitions.length;
    replayFrames(playData.transitions, frameCount);
  }

  /**
   * Replay frames for @param transitions[@param count]. Makes use of 
   * recursive resolution of the Promise array to ensure that each
   * transition is synchronous (but player movements within a specific
   * transition are ran asynchronously).
   */
  function replayFrames(transitions, maxCount) {
    var count = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;

    // Base case: no more frames to replay
    if (count == maxCount) return;

    // Initialise array of MovePlayer promises
    var playerMovements = [];

    // Parse transition data
    var transition = transitions[count];

    // Move each player on DOM
    for (var player in playersOnDOM) {
      playerMovements.push(movePlayer(transition, playersOnDOM[player]));
    }Promise.all(playerMovements).then(function (res) {
      return replayFrames(transitions, maxCount, count + 1);
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

      if (path_length == 0 || count == path_length) {
        // Resolve on base cases
        resolve(true);
      } else {
        setTimeout(function () {
          if (!path[count]) {
            console.log('Undefined path count for ' + marker.id + ' count ' + count + ' length ' + path.length);
          }

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
      if (currentPen === penPass) enableDraggable();
      if (target == penPass) disableDraggable();

      currentPen.classList.remove('active');
      target.classList.add('active');
      currentPen = target;
    }
    event.preventDefault();
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
    });
  }

  function disableDraggable() {
    interact('.player').unset();
  }

  function init() {
    // Set active pen to MOVE
    penMove.classList.add('active');
    currentPen = penMove;

    // Enable draggability for players
    enableDraggable();
  }

  /**
   * DOM links
   */
  // Buttons
  btnReplay.disabled = true;
  btnSave.addEventListener('click', saveFrame);
  btnReplay.addEventListener('click', replay);

  // Pens
  penMove.addEventListener('click', applyNewPen);
  penScreen.addEventListener('click', applyNewPen);
  penPass.addEventListener('click', applyNewPen);

  init();
}]);