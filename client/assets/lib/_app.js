'use strict';

// DOM elements
var court = document.getElementById('court');
var initBallHandler = document.getElementById('initBallHandler');
var btnResetState = document.getElementById('resetState');
var btnSaveState = document.getElementById('saveState');
var btnReplay = document.getElementById('replay');

// Data initialisations
var playersOnDOM = {};
var defaultConfig = Object.freeze({
  pg: { x: 330, y: 550, hasBall: true },
  sg: { x: 100, y: 450, hasBall: false },
  sf: { x: 560, y: 450, hasBall: false },
  pf: { x: 230, y: 380, hasBall: false },
  c: { x: 400, y: 250, hasBall: false }
});
var startState = JSON.parse(JSON.stringify(defaultConfig));

var playData = {
  startState: startState,
  transitions: []
};

var currTransition = {
  pg: { path: [], timeout: 0, nextState: {} },
  sg: { path: [], timeout: 0, nextState: {} },
  sf: { path: [], timeout: 0, nextState: {} },
  pf: { path: [], timeout: 0, nextState: {} },
  c: { path: [], timeout: 0, nextState: {} }

  // Constants and flags
};var FRAME_MILLIS = 1000;
var MARKER_DIAMETER = 40;
var isInitFlag = true;

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

function markerMoveHandler(event) {
  if (isInitFlag) markerMoveInit(event);else markerMoveDev(event);
}

function markerEndHandler(event) {
  if (isInitFlag) console.log(startState);else endMoveDevHandler(event);
}

/**
 * Moving a marker at this state does not add frames.
 * Only need to update start state.
 */
function markerMoveInit(event) {
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

function markerMoveDev(event) {
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

  // Add midpoint & endpoint (dx & dy)
  currTransition[id].path.push({ dx: event.dx, dy: event.dy });
}

function endMoveDevHandler(event) {
  var id = event.target.id;
  currTransition[id].timeout = FRAME_MILLIS / currTransition[id].path.length;
  console.log(currTransition);
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
  btnReplay.addEventListener('click', replay);
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

function resetDefaultState(event) {
  renderState(defaultConfig);
  event.preventDefault();
}

function saveDefaultState(event) {
  isInitFlag = false;
  event.preventDefault();
}

function getCurrentBallHandler(state) {
  for (var player in state) {
    if (state[player].hasBall) return player;
  }
  return null;
}

function renderState(state) {
  for (var player in playersOnDOM) {
    var marker = playersOnDOM[player];
    var coords = defaultConfig[player];

    // Reset coordinates and data attributes
    marker.setAttribute('style', 'left: ' + coords.x + 'px; top: ' + coords.y + 'px;');
    marker.setAttribute('data-x', 0);
    marker.setAttribute('data-y', 0);

    // Reset transforms
    marker.style.webkitTransform = marker.style.transform = 'translate(0px, 0px)';

    // Reset class lists
    marker.className = '';
    marker.classList.add('player');
    if (coords.hasBall) marker.classList.add('ball');
  }
}

function replay(event) {
  // Render start state
  renderState(startState);

  // Show transition
  for (var player in playersOnDOM) {
    movePlayer(playersOnDOM[player]);
  }
}

function movePlayer(marker) {
  var count = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

  var data = currTransition[marker.id];
  var timeout = data.timeout;
  var path = data.path;
  var path_length = path.length;
  if (path_length > 0) {
    setTimeout(function () {
      // Get dx & dy
      var dx = (parseFloat(marker.getAttribute('data-x')) || 0) + path[count].dx;
      var dy = (parseFloat(marker.getAttribute('data-y')) || 0) + path[count].dy;

      // Apply transform
      marker.style.transform = marker.style.webkitTransform = 'translate(' + dx + 'px, ' + dy + 'px)';

      // Update data-x and data-y attributes
      marker.setAttribute('data-x', dx);
      marker.setAttribute('data-y', dy);

      // Recurse next path
      console.log(count);
      if (count + 1 < path_length) movePlayer(marker, count + 1);
    }, timeout);
  }
}

init();