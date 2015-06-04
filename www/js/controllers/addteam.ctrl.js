define(['app'], function(app) {

  return app.controller('AddTeamCtrl', ['$scope', '$state', '$stateParams', '$ionicActionSheet', '$ionicHistory', '$ionicPopup', 'SQLite', 'storage',
    function($scope, $state, $stateParams, $ionicActionSheet, $ionicHistory, $ionicPopup, SQLite, storage) {

      $scope.SQLite = SQLite;
      $scope.storage = storage;
      $scope.addteamData = {};
      if ($stateParams.frommyteam) {
        $scope.existTeamPlayer = angular.copy($scope.storage.myteamData.players);
        $scope.storage.players = $scope.storage.myteamData.players;
        $scope.addteamData.teamname = $scope.storage.myteamData.teamname;
        $scope.addteamData.teamid = $scope.storage.myteamData.teamid;
        $scope.addteamData.disabled = true;
      } else {
        storage.formatPlayer(5);
      }

      $scope.showActionSheet = function(e) {
        $scope.$dom = $(e.currentTarget);
        // 显示操作表
        $ionicActionSheet.show({
          buttons: [{
            text: '从我的球员中选'
          }, {
            text: '添加球员'
          }, {
            text: '充数球员'
          }],
          cancelText: '取消',
          buttonClicked: function(index) {
            switch (index) {
              case 0:
                $state.go('app.myplayer', {
                  type: $stateParams.type,
                  index: $scope.$dom.attr('data-index')
                });
                break;
              case 1:
                $state.go('app.addplayer', {
                  index: $scope.$dom.attr('data-index')
                });
                break;
              case 2:
                $scope.storage.addFaker($scope.$dom.attr('data-index') - 1);
                return true;
                break;
              default:
                return true;
            }
          }
        });
      };

      $scope.confirm = function() {
        if (!validate()) {
          return;
        }
        if ($stateParams.frommyteam) {
          Player_Insert($scope.addteamData.teamid);
        } else {
          $scope.SQLite.add('team', {
            teamName: $scope.addteamData.teamname,
            sportType: $stateParams.type,
            teamType:'Normal'
          }).then(function(teamId) {
            Player_Insert(teamId);
          })
        }


      };

      function validate() {
          //验证球队名称
          if (!$.trim($scope.addteamData.teamname)) {
            var alertPopup = $ionicPopup.alert({
              template: '球队名称不能为空'
            });
            return false;
          }
          //验证球队人数
          var _pnumber = 0;
          angular.forEach($scope.storage.players, function(value, key) {
            if (value.playerNumber && value.playerName) {
              _pnumber++;
            }
          })
          if (_pnumber < $stateParams.number) {
            var alertPopup = $ionicPopup.alert({
              template: '球员数少于比赛人数，请继续添加球员'
            });
            return false;
          }
          return true;
        }
        //插入teamMember表
      function Player_Insert(teamid) {
        var _data = [];
        var _faker = []; //充数球员列表
        $scope.teamid = angular.copy(teamid);
        angular.forEach($scope.storage.players, function(value, key) {
          if (value.playerNumber >= 100 && value.playerName == '充数球员' && !value.disabled) {
            _faker.push({
              playerName: value.playerName,
              playerNumber: value.playerNumber,
              playerType:'Temp'
            });
          }
          if (value.id && !value.disabled) {
            _data.push({
              teamID: $scope.teamid,
              playerID: value.id
            })
          }
        })
        if (_faker.length > 0) { //如果有充数球员，则先插Player表拿充数球员的Id，再插teamMember表
          $scope.SQLite.add('player', _faker).then(function(res) {
            angular.forEach(res, function(value, key) {
              _data.push({
                teamID: $scope.teamid,
                playerID: value
              })
            })
          }).then(function() {
            teamMember_Insert(_data);
          });
        } else {
          teamMember_Insert(_data);
        }
      };
      //插入teamMember表
      function teamMember_Insert(playerlist) {
        if (playerlist.length > 0) {
          $scope.playerlist = angular.copy(playerlist);
          $scope.SQLite.add('teamMember', playerlist)
            .then(function() {
              var _plist = []
              if ($stateParams.frommyteam) {
                angular.forEach($scope.existTeamPlayer, function(value, key) {
                  _plist.push({
                    teamID: value.teamID,
                    tlayerID: value.id
                  })
                })
                _plist = _plist.concat($scope.playerlist);
              } else {
                _plist = $scope.playerlist;
              }
              if ($stateParams.team == 'master') {
                $scope.storage.masterTeam = {
                  teamName: $scope.addteamData.teamname,
                  players: _plist
                }
              } else if ($stateParams.team == 'guest') {
                $scope.storage.guestTeam = {
                  teamName: $scope.addteamData.teamname,
                  players: _plist
                }
              }
              $scope.playerlist = null;
              if ($stateParams.frommyteam) {
                $ionicHistory.goBack(-2);
              } else {
                $ionicHistory.goBack();

              }
            });
        }
      };
      $scope.continueAdd = function() {
        $scope.storage.addPlayer();
      }


    }
  ]);
});