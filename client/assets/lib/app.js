'use strict';

var app = angular.module('playmaker', ['ui.router']);

/**
 * DOM elements
 */
var court = document.getElementById('court');

/**
 * Data initialisations
 */

// Court zones
var leftWing = { x: 200, y: 200, name: 'left wing' };
var leftBlock = { x: 350, y: 200, name: 'left block' };
var rightBlock = { x: 500, y: 200, name: 'right block' };
var rightWing = { x: 650, y: 200, name: 'right wing' };
var leftElbow = { x: 300, y: 380, name: 'left elbow' };
var topOfKey = { x: 400, y: 380, name: 'top of the key' };
var rightElbow = { x: 650, y: 380, name: 'right elbow' };
var midCourt = { x: 650, y: 530, name: 'mid-cour' };
var backCourt = { x: 650, y: 1130, name: 'back-court' };

var zones = [leftWing, leftBlock, rightBlock, rightWing, leftElbow, topOfKey, rightElbow, midCourt, backCourt];

var playersOnDOM = {};

var defaultConfig = Object.freeze({
  pg: { x: 330, y: 380, hasBall: true },
  sg: { x: 100, y: 300, hasBall: false },
  sf: { x: 560, y: 300, hasBall: false },
  pf: { x: 250, y: 200, hasBall: false },
  c: { x: 400, y: 100, hasBall: false }
});

var PenTypes = Object.freeze({ 'move': 0, 'screen': 1, 'pass': 2 });

var newTransition = Object.freeze({
  pg: { path: [], pen: 0, timeout: 0, nextState: {} },
  sg: { path: [], pen: 0, timeout: 0, nextState: {} },
  sf: { path: [], pen: 0, timeout: 0, nextState: {} },
  pf: { path: [], pen: 0, timeout: 0, nextState: {} },
  c: { path: [], pen: 0, timeout: 0, nextState: {} }
});

var startState = JSON.parse(JSON.stringify(defaultConfig));
var lastState = null;
var currTransition = JSON.parse(JSON.stringify(newTransition));

var playData = {
  startState: startState,
  transitions: [],
  analysis: []

  // Constants and flags
};var FRAME_MILLIS = 1000;
var PASS_MILLIS = 500;
var MARKER_DIAMETER = 40;
var SMOOTHNESS = 2;
var COURT_ID = 'court';
var PLAYER_ID = 'player';
var BALL_ID = 'ballhandler';
var PASS_PATH_LENGTH = 50;
var PASS_TIMEOUT = PASS_MILLIS / PASS_PATH_LENGTH;

// Global functions
function renderState(state) {
  for (var player in playersOnDOM) {
    var marker = playersOnDOM[player];
    var coords = state[player];

    // Reset coordinates and data attributes
    marker.setAttribute('style', 'left: ' + coords.x + 'px; top: ' + coords.y + 'px;');
    marker.setAttribute('data-x', 0);
    marker.setAttribute('data-y', 0);

    // Reset transforms
    marker.style.webkitTransform = marker.style.transform = 'translate(0px, 0px)';

    // Reset class lists
    marker.className = '';
    marker.classList.add(PLAYER_ID);
    if (coords.hasBall) marker.classList.add(BALL_ID);
  }
}

/**
 * Returns the ID of the ball handler in the @param state.
 */
function getCurrentBallHandler(state) {
  for (var player in state) {
    if (state[player].hasBall) return player;
  }return null;
}

function getZone(coord) {
  console.log(coord);
  var x = coord.x;
  var y = coord.y;
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = zones[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var zone = _step.value;
      if (x < zone.x && y < zone.y) return zone.name;
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  return null;
}

// Global events
document.getElementById('saveJSON').addEventListener('click', function (event) {
  var dataAsString = JSON.stringify(playData, null, 4);
  var data = 'text/json;charset=utf-8,' + encodeURIComponent(dataAsString);
  var dl = document.createElement('a');
  dl.href = 'data:' + data;
  dl.download = 'play.json';
  document.body.appendChild(dl);
  dl.click();
});

// Components
app.component('init', {
  templateUrl: '/assets/views/init.html',
  controller: 'InitController'
});

app.component('dev', {
  templateUrl: '/assets/views/dev.html',
  controller: 'DevController'
});

// States
app.config(['$stateProvider', '$urlRouterProvider', function ($stateProvider, $urlRouterProvider) {
  // Register states
  $stateProvider.state({
    name: 'init',
    url: '/',
    component: 'init'
  });

  $stateProvider.state({
    name: 'dev',
    url: '/',
    component: 'dev'
  });

  // Default route
  $urlRouterProvider.otherwise('/');
}]);