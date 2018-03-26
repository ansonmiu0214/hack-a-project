'use strict';

var app = angular.module('playmaker');
app.controller('InitController', ['$scope', '$http', '$location', '$state', function ($scope, $http, $location, $state) {
  console.log('InitController loaded!');

  /**
   * Setup
   */

  // DOM elements
  var divBallHandler = document.getElementById('ballHandlers');
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

    // Derive new coordinates
    var dx = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
    var dy = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;

    // Translate based on data-x and data-y attributes
    target.style.webkitTransform = target.style.transform = 'translate(' + dx + 'px, ' + dy + 'px)';

    // Update data attributes for stateful memory
    target.setAttribute('data-x', dx);
    target.setAttribute('data-y', dy);
  }

  function markerEndHandler(event) {
    var target = event.target;
    var id = target.id;

    // Compute coordinates
    var dx = parseFloat(target.getAttribute('data-x'));
    var dy = parseFloat(target.getAttribute('data-y'));
    var x = target.offsetLeft + dx;
    var y = target.offsetTop + dy;

    // Update start state for player
    startState[id].x = x;
    startState[id].y = y;
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

    // Populate radio button for initial ball handler
    for (var player in defaultConfig) {
      var formCheck = document.createElement('div');
      formCheck.className = 'form-check';

      // Generate input and label corresponding to player
      formCheck.innerHTML = '<input class="form-check-input ballHandlerRadio"\n        type="radio" name="ballHandlerRadio" id="radio_' + player + '" \n        value="' + player + '" ' + (player === 'pg' ? "checked" : "") + '>';
      formCheck.innerHTML += '<label class="form-check-label" \n        for="radio_' + player + '">' + player.toUpperCase() + '</label>';

      divBallHandler.appendChild(formCheck);
    }

    var zoneArray = ['2-1-2', '1-3-1', '4-out'];
    zoneArray.forEach(function (elem, index) {
      var zoneOption = document.createElement('div');
      zoneOption.className = 'form-check';

      zoneOption.innerHTML = '<input class="form-check-input zoneRadio"\n      type="radio" name="zoneRadio" id="radio_' + elem + '" \n      value="' + elem + '">';
      zoneOption.innerHTML += '<label class="form-check-label" \n      for="radio_' + elem + '">' + elem + '</label>';

      document.getElementById('zoneSetup').appendChild(zoneOption);
    });

    // Add onclick callback for all ball handler radio inputs
    document.querySelectorAll('.ballHandlerRadio').forEach(function (radio, index) {
      return radio.addEventListener('change', changedInitBallHandler);
    });

    btnResetState.addEventListener('click', resetDefaultState);
    btnSaveState.addEventListener('click', saveDefaultState);
  }

  /**
   * Post-setup
   */
  init();
}]);