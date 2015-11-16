app.controller('LogoCtrl', ['$scope', '$ionicHistory', 'SQLite', 'Storage', 'Util',
  function($scope, $ionicHistory, SQLite, storage, util) {

    $scope.storage = storage;

    $scope.selectedId = $scope.storage.logoId;

    SQLite.execute('select id from logoLib').then(function(res) {
      $scope.logolist = res;
    })

    $scope.select = function(logoid) {
      $scope.storage.logoId = logoid;
      $scope.storage.logoUrl = "";
      $ionicHistory.goBack();
    }
  }
]);