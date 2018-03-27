'use strict';

var app = angular.module('playmaker');
app.controller('LoadController', ['$scope', '$http', '$location', '$state', function ($scope, $http, $location, $state) {
  console.log('LoadController loaded!');

  $scope.hasPlays = false;

  /**
   * DOM elements
   */
  var backBtn = document.getElementById('backBtn');

  // Get plays from back-end
  $http.get('/api/plays').then(function (res) {
    console.log(res.data);
    var plays = res.data;
    if (plays.length === 0) return;

    $scope.hasPlays = true;
  });

  // Linking
  backBtn.addEventListener('click', function (event) {
    return $state.go('init');
  });
}]);