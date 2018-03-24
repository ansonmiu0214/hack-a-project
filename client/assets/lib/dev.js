'use strict';

var app = angular.module('playmaker');
app.controller('DevController', ['$scope', '$http', '$location', '$state', function ($scope, $http, $location, $state) {
  console.log('DevController loaded!');

  /**
   * Setup
   */
  // DOM elements
  var btnReplay = document.getElementById('replay');

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

  function markerEndHandler(event) {
    var id = event.target.id;
    currTransition[id].timeout = FRAME_MILLIS / currTransition[id].path.length;
    console.log(currTransition);
  }

  btnReplay.addEventListener('click', replay);
  function replay(event) {
    // Render start state
    renderState(startState);

    // Show transition
    for (var player in playersOnDOM) {
      movePlayer(playersOnDOM[player]);
    }
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
}]);