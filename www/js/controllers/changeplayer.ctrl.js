app.controller('ChangePlayerCtrl', ['$scope', '$q', '$stateParams', '$ionicHistory', '$ionicActionSheet', 'SQLite', 'Storage', 'Camera', 'Util', 'Http',
  function($scope, $q, $stateParams, $ionicHistory, $ionicActionSheet, SQLite, storage, camera, util, http) {
    $scope.data = {};
    $scope.storage = storage;

    $scope.pLogoUrl = "";

    $scope.isPhoto = false;

    $scope.confirm = function() {
      if ($scope.data && $scope.data.number && $scope.data.name) {
        var num = $scope.data.number;
        //如果号码0开始,提示用户不正确
        if (!/^[0-9]*$/.test(num) || num.length > 1 && num.substr(0, 1) == '0') {
          util.UI.showLoading('球员号码不正确', 1000);
          return;
        }
        if ($.trim($scope.data.phone) != '' && !/^(1[1-9][0-9])\d{8}$/.test($scope.data.phone)) {
          util.UI.showLoading('手机号码不正确', 1000);
          return;
        }
        util.UI.showLoading()
        var sql = 'select count(*) as num from teamMember a,player b where  a.playerId=b.id and a.teamId=? and b.playerNumber=?';
        SQLite.execute(sql, [$stateParams.teamID, $scope.data.number]).then(function(res) {
          if (res[0].num > 0) {
            util.UI.hideLoading();
            util.UI.showLoading('球员号码已存在', 1000);
          } else {
            if ($scope.isPhoto) {
              http.uploadLogo($scope.pLogoUrl, 'player').then(function(res) {
                $scope.pLogoUrl = res.data.logoUrl;
                addPlayer();
              }, function(res) {
                util.UI.hideLoading();
                util.UI.showLoading('球员LOGO上传失败，请重试', 1000);
              })
            } else {
              addPlayer();
            }
          }
        })
      } else {
        util.UI.showLoading('请填写完整', 1000);
      }
    };

    function addPlayer() {
      var playerId = util.creatGUID();
      var player_param = {
        players: [{
          playerId: playerId,
          playerName: $scope.data.name,
          playerNumber: $scope.data.number,
          phoneNumber: $scope.data.phone || "",
          playerType: 'Normal',
          logoUrl: $scope.pLogoUrl,
          scorer: $scope.storage.account
        }]
      };
      var teamPlayer_param = {
        teamPlayers: [{
          playerId: playerId,
          teamId: $stateParams.teamID
        }]
      }
      var gamePlayer_param = {
        gamePlayers: [{
          playerId: playerId,
          teamId: $stateParams.teamID,
          gameId: $stateParams.matchID,
          setFirst: 0
        }]
      }
      util.UI.showLoading();
      $q.all([http.addPlayer(player_param), http.addTeamPlayer(teamPlayer_param), http.addGamePlayer(gamePlayer_param)]).then(
        function(results) {
          addPlayer_local(playerId);
        },
        function(results) {
          util.UI.hideLoading();
          util.UI.showLoading('网络错误，请检查网络后重试', 1000);
        });
    }

    function addPlayer_local(playerId) {
      var local_player_param = {
        id: playerId,
        playerName: $scope.data.name,
        playerNumber: $scope.data.number,
        playerType: 'Normal',
        logoUrl: $scope.pLogoUrl,
      };
      var local_teamPlayer_param = {
        playerId: playerId,
        teamId: $stateParams.teamID
      };
      var local_gamePlayer_param = {
        playerId: playerId,
        teamId: $stateParams.teamID,
        gameId: $stateParams.matchID,
        isFirst: 0,
        hasPlay: 0, //0 没有场过,1,上过场
        onPlay: 0 //0不在场,1在场
      };
      $q.all([SQLite.add('player', local_player_param), SQLite.add('teamMember', local_teamPlayer_param), SQLite.add('gamePlayers', local_gamePlayer_param)])
        .then(function(results) {
          updateOnPlayFlag(playerId);
        }, function(results) {
          util.UI.hideLoading();
          util.UI.showLoading('网络错误，请检查网络后重试', 1000);
        });
    }

    function updateOnPlayFlag(playerId) {
      var sql_old = 'update gamePlayers set onPlay=0 where gameId=? and teamId=? and playerId=?';
      var sql_new = 'update gamePlayers set hasPlay=1,onPlay=1 where gameId=? and teamId=? and playerId=?';
      $q.all([SQLite.execute(sql_old, [$stateParams.matchID, $stateParams.teamID, $stateParams.playerID]), SQLite.execute(sql_new, [$stateParams.matchID, $stateParams.teamID, playerId])]).then(function(results) {
        util.UI.hideLoading();
        $scope.storage.changePlayerInfo = {
          teamId: $stateParams.teamID,
          oldPlayerId: $stateParams.playerID,
          newPlayerId: playerId
        }
        $ionicHistory.goBack();
      }, function(results) {
        util.UI.hideLoading();
        util.UI.showLoading('网络错误，请检查网络后重试', 1000);
      })
    }

    $scope.showLogoSheet = function() {
      var success = function(data) {
        $scope.pLogoUrl = data;
        $scope.isPhoto = true;
        $scope.$apply();
      }
      var error = function(message) {
        console.log(message);
      }
      $ionicActionSheet.show({
        buttons: [{
          text: '拍 照'
        }, {
          text: '从相册选择'
        }],
        cancelText: '取消',
        buttonClicked: function(index) {
          switch (index) {
            case 0:
              camera.takePhoto(success, error)
              return true;
              break;
            case 1:
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