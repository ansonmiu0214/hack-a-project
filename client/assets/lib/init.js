'use strict';

var app = angular.module('playmaker');
app.controller('InitController', ['$scope', '$http', '$location', '$state', function ($scope, $http, $location, $state) {
  console.log('InitController loaded!');

  /**
   * Setup
   */

  // DOM elements
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
    var old_x = target.offsetLeft + old_dx;
    var old_y = target.offsetTop + old_dy;

    // Derive new coordinates
    var new_dx = (old_dx || 0) + event.dx;
    var new_dy = (old_dy || 0) + event.dy;
    var new_x = target.offsetLeft + new_dx;
    var new_y = target.offsetTop + new_dy;

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
      marker.classList.add(PLAYER_ID);
      if (coord.hasBall) marker.classList.add(BALL_ID);

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
    var next = event.target.value;

    // Update new ball handler on DOM
    playersOnDOM[curr].classList.remove(BALL_ID);
    playersOnDOM[next].classList.add(BALL_ID);

    // Update new ball handler on state
    startState[curr].hasBall = false;
    startState[next].hasBall = true;
  }

  function init() {
    // Render players
    generatePlayers();

    for (var player in defaultConfig) {
      var formCheck = document.createElement('div');
      formCheck.className = 'form-check';
      formCheck.innerHTML = '<input class="form-check-input ballHandlerRadio"\n        type="radio" name="ballHandlerRadio" id="radio_' + player + '" \n        value="' + player + '" ' + (player === 'pg' ? "checked" : "") + '>';
      formCheck.innerHTML += '<label class="form-check-label" \n        for="radio_' + player + '">' + player.toUpperCase() + '</label>';

      document.getElementById('ballHandlers').appendChild(formCheck);
    }

    document.querySelectorAll('.ballHandlerRadio').forEach(function (radio, index) {
      radio.addEventListener('change', changedInitBallHandler);
    });

    btnResetState.addEventListener('click', resetDefaultState);
    btnSaveState.addEventListener('click', saveDefaultState);
  }

  /**
   * Post-setup
   */
  init();
}]);