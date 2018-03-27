'use strict';

var app = angular.module('playmaker');
app.controller('InitController', ['$scope', '$http', '$location', '$state', function ($scope, $http, $location, $state) {
  console.log('InitController loaded!');

  /**
   * Setup
   */

  // DOM elements
  var divBallHandler = document.getElementById('ballHandlers');
  var divZoneSetup = document.getElementById('zoneSetup');
  var btnResetState = document.getElementById('resetState');
  var btnSaveState = document.getElementById('saveState');
  var btnLoadPlay = document.getElementById('loadPlay');

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
    renderState($scope.zones[defaultZone]);
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
    var config = $scope.zones[defaultZone];
    for (var player in config) {
      var coord = config[player];

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

  function changedInitZone(event) {
    // Get next zone ID
    var next = event.target.value;

    // Change start state and render
    startState = $scope.zones[next];
    renderState(startState);
  }

  function init() {
    // Populate radio button for initial ball handler
    for (var player in defaultConfig) {
      var formCheck = document.createElement('div');
      formCheck.className = 'form-check';

      // Generate input and label corresponding to player
      formCheck.innerHTML = '<input class="form-check-input ballHandlerRadio"\n        type="radio" name="ballHandlerRadio" id="radio_' + player + '" \n        value="' + player + '" ' + (player === 'pg' ? "checked" : "") + '>';
      formCheck.innerHTML += '<label class="form-check-label" \n        for="radio_' + player + '">' + player.toUpperCase() + '</label>';

      divBallHandler.appendChild(formCheck);
    }

    // Add onclick callback for all ball handler radio inputs
    document.querySelectorAll('.ballHandlerRadio').forEach(function (radio, index) {
      return radio.addEventListener('change', changedInitBallHandler);
    });

    // Load in standard formations from API
    $http.get('/api/zones').then(function (res) {
      // Save to scope variable
      $scope.zones = res.data;

      for (var zone in res.data) {
        var zoneOption = document.createElement('div');
        zoneOption.className = 'form-check';

        zoneOption.innerHTML = '<input class="form-check-input zoneRadio"\n          type="radio" name="zoneRadio" id="radio_' + zone + '" \n          value="' + zone + '" ' + (zone === defaultZone ? "checked" : "") + '>';
        zoneOption.innerHTML += '<label class="form-check-label" \n          for="radio_' + zone + '">' + zone + '</label>';

        divZoneSetup.appendChild(zoneOption);
      }

      document.querySelectorAll('.zoneRadio').forEach(function (radio, index) {
        return radio.addEventListener('change', changedInitZone);
      });

      // Render players
      generatePlayers();

      // Set up start state as per default state
      startState = JSON.parse(JSON.stringify($scope.zones[defaultZone]));
    });

    btnResetState.addEventListener('click', resetDefaultState);
    btnSaveState.addEventListener('click', saveDefaultState);
    btnLoadPlay.addEventListener('click', function (event) {
      return $state.go('load');
    });
  }

  /**
   * Post-setup
   */
  init();
}]);