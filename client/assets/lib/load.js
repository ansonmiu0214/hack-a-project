'use strict';

var app = angular.module('playmaker');
app.controller('LoadController', ['$scope', '$http', '$location', '$state', function ($scope, $http, $location, $state) {
  console.log('LoadController loaded!');

  $scope.hasPlays = false;

  /**
   * DOM elements
   */
  var backBtn = document.getElementById('backBtn');

  function getPlays() {
    // Get plays from back-end
    $http.get('/api/plays').then(function (res) {
      console.log(res.data);
      var plays = res.data;
      if (plays.length === 0) return;

      $scope.hasPlays = true;
      $scope.plays = plays;
    });
  }

  function loadPlay(playID) {
    // Get play and go to development state - passing data as parameter
    $http.get('/api/play?id=' + playID).then(function (res) {
      var playString = JSON.stringify(res.data);
      $state.go('dev', { playData: playString });
    });
  }

  function deletePlay(playID) {
    $http.delete('/api/play?id=' + playID).then(function (res) {
      alert('Successfully deleted play.');
      getPlays();
    }).catch(function (err) {
      return alert('Could not delete play.');
    });
  }

  getPlays();
  $scope.loadPlay = loadPlay;
  $scope.deletePlay = deletePlay;

  // Linking
  backBtn.addEventListener('click', function (event) {
    return $state.go('init');
  });
}]);