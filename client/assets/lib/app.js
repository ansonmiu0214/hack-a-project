'use strict';

var _defaultCoords;

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

// DOM elements
var court = document.getElementById('court');

// Data initialisations
var defaultCoords = (_defaultCoords = {
  'pg': { 'x': 0, 'y': 0 }
}, _defineProperty(_defaultCoords, 'pg', { 'x': 50, 'y': 50 }), _defineProperty(_defaultCoords, 'pg', { 'x': 100, 'y': 100 }), _defineProperty(_defaultCoords, 'pg', { 'x': 150, 'y': 150 }), _defineProperty(_defaultCoords, 'pg', { 'x': 200, 'y': 200 }), _defaultCoords);

function init() {
  // Render players
  generatePlayers();
}

function generatePlayers() {
  console.log('generate players');
  for (var player in defaultCoords) {
    var marker = document.createElement('div');
    marker.id = player;
    marker.className = 'player';
    marker.setAttribute('style', 'left: ' + player.x + 'px; top: ' + player.y + 'px');
    marker.setAttribute('data-x', 0);
    marker.setAttribute('data-y', 0);
    marker.innerHTML = player;
    court.appendChild(marker);
  }
}

init();