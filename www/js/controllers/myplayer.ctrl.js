define(['app'], function(app) {

  return app.controller('MyPlayerCtrl', ['$scope', '$stateParams', 'storage', 'SQLite', '$ionicLoading', '$ionicHistory',
    function($scope, $stateParams, storage, SQLite, $ionicLoading, $ionicHistory) {

      var SQL_QUERY_PLAYER =
        'select a.ID,a.PlayerName,a.PlayerNumber,b.TeamID,c.TeamName ' +
        'from Player a ' +
        'left join (select TeamID,max(CreateTime),PlayerID from TeamMember group by PlayerID)  b on a.ID=b.PlayerID ' +
        'left join Team c on c.ID=b.TeamID ' +
        'where a.PlayerType<>"Temp" and c.SportType=' + "'" + $stateParams.type + "'";
      $scope.SQLite = SQLite;

      $scope.storage = storage;
      $scope.playerlist = [];
      $scope.SQLite.execute(SQL_QUERY_PLAYER)
        .then(function(res) {
          console.log(res);
          $scope.playerlist = res;
        })


      $scope.selectPlayer = function(index) {
        //过滤掉已经在球队中的队员
        for (var i = 0, len = $scope.storage.players.length; i < len; i++) {
          //如原来球员3已经是麦迪，再在球员3选中麦迪的时候允许选择
          if (i === $stateParams.index - 1) {
            continue;
          }
          if ($scope.playerlist[index].id == $scope.storage.players[i].id) {
            $ionicLoading.show({
              template: '不能重复添加同一球员',
              duration: 1000
            });
            return;
          }
        }
        $scope.storage.players[$stateParams.index - 1] = {
          id: $scope.playerlist[index].id,
          playerName: $scope.playerlist[index].playerName,
          playerNumber: $scope.playerlist[index].playerNumber
        }
        $ionicHistory.goBack();
      }

    }
  ]);

});