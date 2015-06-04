define(['app'], function(app) {

  return app.controller('MyTeamCtrl', ['$scope', '$state', '$stateParams', '$ionicHistory', '$ionicLoading', 'SQLite', 'storage',
    function($scope, $state, $stateParams, $ionicHistory, $ionicLoading, SQLite, storage) {

      var SQL_QUERY_TEAMLIST = 'select a.ID,a.TeamName,b.num ' +
        'from TEAM a,' +
        '(select count(*) as num, TeamMember.TeamID from TeamMember group by TeamID ) b ' +
        'where a.ID=b.TeamID and a.teamType<>"Temp" and a.SportType=' + "'" + $stateParams.type + "'";

      var SQL_QUERY_ONETEAM = 'SELECT * FROM TeamMember WHERE TeamID=';

      var SQL_QUERY_NOT_ENOUGH = 'SELECT a.TeamID,b.ID,b.PlayerName,b.PlayerNumber FROM TeamMember a,Player b WHERE a.PlayerID=b.ID and a.TeamID=';
      $scope.SQLite = SQLite;

      $scope.storage = storage;

      $scope.SQLite.execute(SQL_QUERY_TEAMLIST)
        .then(function(res) {
          console.log(res);
          $scope.teamlist = res;
        });
      $scope.selectTeam = function(index) {
        if ($scope.teamlist[index].num >= $stateParams.number) {
          enoughPlayer(index);
        } else {



          $scope.SQLite.execute(SQL_QUERY_NOT_ENOUGH + "'" + $scope.teamlist[index].ID + "'")
            .then(function(res) {
              console.log(res);
              $scope.storage.myteamData = {
                teamname: '',
                teamid:'',
                players: []
              };
              $scope.storage.myteamData.teamname = $scope.teamlist[index].teamName;
              $scope.storage.myteamData.teamid = $scope.teamlist[index].ID;
              angular.forEach(res, function(value, key) {
                $scope.storage.myteamData.players.push({
                  id: value.ID,
                  playerName: value.playerName,
                  playerNumber: value.playerNumber,
                  teamID:value.teamID,
                  disabled: true
                })
              })
              $state.go('app.addteam', {
                number: $stateParams.number,
                type: $stateParams.type,
                team: $stateParams.team,
                frommyteam: true
              });
            });
        }



      };

      function enoughPlayer(index) {
        if (($stateParams.team == 'master' && $scope.storage.guestTeam && $scope.storage.guestTeam.players && $scope.storage.guestTeam.players.length > 0 && $scope.storage.guestTeam.players[0].TeamID == $scope.teamlist[index].ID) || ($stateParams.team == 'guest' && $scope.storage.masterTeam && $scope.storage.masterTeam.players && $scope.storage.masterTeam.players.length > 0 && $scope.storage.masterTeam.players[0].TeamID == $scope.teamlist[index].ID)) {
                      $ionicLoading.show({
              template: '主队和客队不能为同一队伍',
              duration: 1000
            });
          return;
        };
        $scope.SQLite.execute(SQL_QUERY_ONETEAM + "'" + $scope.teamlist[index].ID + "'")
          .then(function(res) {
            console.log(res);
            if ($stateParams.team == 'master') {
              $scope.storage.masterTeam = {
                teamName: $scope.teamlist[index].TeamName,
                players: res
              }
            } else if ($stateParams.team == 'guest') {
              $scope.storage.guestTeam = {
                teamName: $scope.teamlist[index].TeamName,
                players: res
              }
            }
            $ionicHistory.goBack();
            //$scope.teamlist = res;
          });
      }

    }
  ]);

});