app.controller('AddTeamCtrl', ['$scope', '$state', '$q', '$stateParams', '$ionicActionSheet', '$ionicHistory', 'SQLite', 'Storage', 'Http', 'Util', 'Camera',
  function($scope, $state, $q, $stateParams, $ionicActionSheet, $ionicHistory, SQLite, storage, http, util, camera) {


    $scope.storage = storage;

    $scope.addteamData = {};

    $scope.storage.logoId = "";

    $scope.storage.logoUrl = "";

    //从我的球队进入
    if ($stateParams.frommyteam) {
      $scope.frommyteam = true;
      $scope.existTeamPlayer = angular.copy($scope.storage.myteamData.players);
      $scope.storage.players = $scope.storage.myteamData.players;
      $scope.storage.logoId = $scope.storage.myteamData.logoId;
      $scope.storage.logoUrl = $scope.storage.myteamData.logoUrl;
      $scope.addteamData.teamname = $scope.storage.myteamData.teamname;
      $scope.addteamData.teamid = $scope.storage.myteamData.teamid;
      $scope.addteamData.disabled = true;
      if ($scope.storage.players.length == 0) {
        storage.formatPlayer(1);
      }
    } else {
      $scope.frommyteam = false;
      storage.formatPlayer(5);
      var logoid = $stateParams.team == 'master' ? $scope.storage.guestLogo : $scope.storage.masterLogo;
      SQLite.getTeamLogo(logoid).then(function(res) {
        $scope.storage.logoId = res;
        $stateParams.team == 'master' ? $scope.storage.masterLogo = res : $scope.storage.guestLogo = res;
      });
    }


    $scope.showActionSheet = function(player, i) {
      if (player.disabled) {
        return;
      }
      // 显示操作表
      $ionicActionSheet.show({
        buttons: [{
          text: '从我的球员中选'
        }, {
          text: '添加球员'
        }],
        cancelText: '取消',
        buttonClicked: function(index) {
          switch (index) {
            case 0:
              $state.go('app.myplayer', {
                type: $stateParams.type,
                index: i + 1
              });
              break;
            case 1:
              $state.go('app.addplayer', {
                index: i + 1
              });
              break;
            default:
              return true;
          }
        }
      });
    };

    function validate() {
      //验证球队名称
      if (!$.trim($scope.addteamData.teamname)) {
        util.UI.showLoading('球队名称不能为空', 1000);
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
        util.UI.showLoading('球员数少于比赛人数，请继续添加球员', 1000);
        return false;
      }
      return true;
    };

    $scope.confirm = function() {
      if (!validate()) {
        return;
      }
      var playerlist = [];
      util.UI.showLoading();
      if ($stateParams.frommyteam) {
        playerlist = formatPlayerList($scope.addteamData.teamid);
        if (playerlist.length > 0) {
          http.addTeamPlayer({
          teamPlayers: playerlist
        }).then(function() {
            util.UI.hideLoading();
            addTeamPlayer_Local(playerlist);
          }, function(results) {
            util.UI.hideLoading();
            util.UI.showLoading('网络错误，请检查网络后重试', 1000);
          })
        }
      } else {
          addTeam();
      }
    };


    function addTeam() {
      var teamParams = {
        id: util.creatGUID(),
        teamType: 'Normal',
        teamName: $scope.addteamData.teamname,
        sportType: $stateParams.type,
        scoreKeeperAccount: $scope.storage.account,
        logoUrl: $scope.storage.logoUrl,
        logoId: $scope.storage.logoId
      };
      var playerlist = formatPlayerList(teamParams.id);
      if (playerlist.length > 0) {
        //同时调用2个接口
        $q.all([http.addTeam(teamParams), http.addTeamPlayer({
          teamPlayers: playerlist
        })]).then(function(results) {
          util.UI.hideLoading();
          addTeam_Local(teamParams);
          addTeamPlayer_Local(playerlist);
        }, function(results) {
          util.UI.hideLoading();
          util.UI.showLoading('网络错误，请检查网络后重试', 1000);
        });
      } else {
        util.UI.hideLoading();
        util.UI.showLoading('球员数据错误', 1000);
      }
    }

    function formatPlayerList(teamId) {
      var p = [];
      angular.forEach($scope.storage.players, function(value, key) {
        if (value.id && !value.disabled) {
          p.push({
            teamId: teamId,
            playerId: value.id
          })
        }
      })
      return p;
    };

    function addTeam_Local(param) {
      delete param.scoreKeeperAccount;
      SQLite.add('team', param).then(function() {
        console.log('addTeam local success');
      })
    };

    function addTeamPlayer_Local(playerlist) {
      SQLite.add('teamMember', playerlist)
        .then(function() {
          if ($stateParams.frommyteam) {
            angular.forEach($scope.existTeamPlayer, function(value, key) {
              playerlist.push({
                teamId: value.teamid,
                playerId: value.id
              })
            })
          }
          if ($stateParams.team == 'master') {
            $scope.storage.masterTeam = {
              teamName: $scope.addteamData.teamname,
              players: playerlist
            }
          } else if ($stateParams.team == 'guest') {
            $scope.storage.guestTeam = {
              teamName: $scope.addteamData.teamname,
              players: playerlist
            }
          }
          if ($stateParams.frommyteam) {
            $ionicHistory.goBack(-2);
          } else {
            $ionicHistory.goBack();
          }
        });
    };

    $scope.continueAdd = function() {
      $scope.storage.addPlayer();
    };
    $scope.showLogoSheet = function() {
      if ($scope.frommyteam) {
        return;
      }
      var success = function(data) {
        util.UI.showLoading();
        http.uploadLogo(data, 'team').then(function(res) {
          util.UI.hideLoading();
          $scope.storage.logoId = res.data.logoId;
          $scope.storage.logoUrl = res.data.logoUrl;
          $scope.$apply();
        }, function(res) {
          util.UI.hideLoading();
          util.UI.showLoading('球队LOGO上传失败，请重试', 1000);
        })
      }
      var error = function(message) {
        console.log(message);
      }
      $ionicActionSheet.show({
        buttons: [{
          text: '内置LOGO'
        }, {
          text: '拍 照'
        }, {
          text: '从相册选择'
        }],
        cancelText: '取消',
        buttonClicked: function(index) {
          switch (index) {
            case 0:
              $state.go('app.logo')
              break;
            case 1:
              camera.takePhoto(success, error)
              return true;
              break;
            case 2:
              camera.getPhoto(success, error)
              return true;
              break;
            default:
              return true;
          }
        }
      });
    };

  }
]);