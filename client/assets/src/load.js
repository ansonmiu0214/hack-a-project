const app = angular.module('playmaker')
app.controller('LoadController', ['$scope', '$http', '$location', '$state', ($scope, $http, $location, $state) => {
  console.log('LoadController loaded!')

  $scope.hasPlays = false

  /**
   * DOM elements
   */
  const backBtn = document.getElementById('backBtn')

  // Wrapper for GET request
  function getPlays() {
    // Get plays from back-end
    $http.get('/api/plays').then((res) => {    
      console.log(res.data)
      const plays = res.data
      if (plays.length === 0) return

      $scope.hasPlays = true
      $scope.plays = plays
    })
  }

  function loadPlay(playID) {
    // Get play and go to development state - passing data as parameter
    $http.get(`/api/play?id=${playID}`)
      .then((res) => {
        const playString = JSON.stringify(res.data)
        $state.go('dev', { playData: playString })
      })
  }

  function deletePlay(playID) {
    $http.delete(`/api/play?id=${playID}`)
      .then((res) => {
        alert('Successfully deleted play.')
        getPlays()
      })
      .catch((err) => alert('Could not delete play.'))
  }

  getPlays()
  $scope.loadPlay = loadPlay
  $scope.deletePlay = deletePlay
    
  // Linking
  backBtn.addEventListener('click', (event) => $state.go('init'))
}])