define(['app'], function(app) {

  return app.controller('AddPlayerCtrl', ['$scope', '$stateParams', '$ionicHistory', '$ionicLoading', 'SQLite', 'storage',
    function($scope, $stateParams, $ionicHistory, $ionicLoading, SQLite, storage) {
      $scope.data = {};
      $scope.SQLite = SQLite;
      $scope.storage = storage;
      $scope.confirm = function() {
        if ($scope.data && $scope.data.number && $scope.data.name) {
          for (var i = 0, len = $scope.storage.players.length; i < len; i++) {
            if ($scope.storage.players[i].playerNumber == $scope.data.number) {
              $ionicLoading.show({
                template: '球员号码已存在',
                duration: 1000
              });
              return;
            }
          }
          $scope.SQLite.add('player', {
            playerName: $scope.data.name,
            playerNumber: $scope.data.number,
            playerType: 'Normal'
          }).then(function(res) {
            $scope.storage.players[$stateParams.index - 1] = {
              id: res,
              playerName: $scope.data.name,
              playerNumber: $scope.data.number
            }
            $ionicHistory.goBack();
          });
        } else {
           $ionicLoading.show({
                template: '请填写完整',
                duration: 1000
              });
        }

      }
    }
  ]);

});