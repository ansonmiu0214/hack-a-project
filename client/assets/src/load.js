const app = angular.module('playmaker')
app.controller('LoadController', ['$scope', '$http', '$location', '$state', ($scope, $http, $location, $state) => {
  console.log('LoadController loaded!')

  $scope.hasPlays = false

  /**
   * DOM elements
   */
  const backBtn = document.getElementById('backBtn')

  // Get plays from back-end
  $http.get('/api/plays').then((res) => {    
    console.log(res.data)
    const plays = res.data
    if (plays.length === 0) return

    $scope.hasPlays = true
  })
    
  // Linking
  backBtn.addEventListener('click', (event) => $state.go('init'))
}])