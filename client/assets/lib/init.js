'use strict';

var app = angular.module('playmaker');
app.controller('InitController', ['$scope', '$http', '$location', '$state', function ($scope, $http, $location, $state) {
  console.log('InitController loaded!');

  /**
   * Setup
   */

  // DOM elements
  var initBallHandler = document.getElementById('initBallHandler');
  var btnResetState = document.getElementById('resetState');
  var btnSaveState = document.getElementById('saveState');

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

  /**
   * Moving a marker at this state does not add frames.
   * Only need to update start state.
   */
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

    // Update start state for player
    startState[id].x = new_x;
    startState[id].y = new_y;
  }

  function markerEndHandler(event) {
    console.log(startState);
  }

  function resetDefaultState(event) {
    renderState(defaultConfig);
    event.preventDefault();
  }

  function saveDefaultState(event) {
    // Initialise lastState from startState
    lastState = JSON.parse(JSON.stringify(startState));

    // Initialise nextStates of each player in current transition
    for (var player in lastState) {
      currTransition[player].nextState = JSON.parse(JSON.stringify(lastState[player]));
    } // Change to play-development state
    $state.go('dev');

    event.preventDefault();
  }

  function generatePlayers() {
    for (var player in defaultConfig) {
      var coord = defaultConfig[player];

      var marker = document.createElement('div');
      marker.id = player;

      // Add player class (and ball if hasBall)
      marker.classList.add('player');
      marker.classList;
      if (coord.hasBall) marker.classList.add('ball');

      // Set offsets and data-attrs
      marker.setAttribute('style', 'left: ' + coord.x + 'px; top: ' + coord.y + 'px;');
      marker.setAttribute('data-x', 0);
      marker.setAttribute('data-y', 0);

      // Append to DOM
      marker.innerHTML = player;
      court.appendChild(marker);

      // Add DOM entry to global object
      playersOnDOM[player] = marker;
    }
  }

  // Update initial ball handler in start state
  function changedInitBallHandler(event) {
    var curr = getCurrentBallHandler(startState);
    var next = initBallHandler.value.toLowerCase();

    // Update new ball handler on DOM
    playersOnDOM[curr].classList.remove('ball');
    playersOnDOM[next].classList.add('ball');

    // Update new ball handler on state
    startState[curr].hasBall = false;
    startState[next].hasBall = true;
  }

  function init() {
    // Render players
    generatePlayers();

    // Initialise setup form controls
    for (var player in defaultConfig) {
      var opt = document.createElement('option');
      opt.innerHTML = player.toUpperCase();
      initBallHandler.appendChild(opt);
    }

    initBallHandler.addEventListener('change', changedInitBallHandler);
    btnResetState.addEventListener('click', resetDefaultState);
    btnSaveState.addEventListener('click', saveDefaultState);
  }

  /**
   * Post-setup
   */
  init();
}]);