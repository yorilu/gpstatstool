app.controller('MyTeamCtrl', ['$scope', '$q', '$state', '$stateParams', '$ionicHistory', 'SQLite', 'Storage', 'Util', 'Http',
  function($scope, $q, $state, $stateParams, $ionicHistory, SQLite, storage, util, http) {

    $scope.storage = storage;

    $scope.teamlist = [];
    util.UI.showLoading();
    http.getTeams().then(function(res) {
     // console.log(res);
      if (res && res.data && res.data.length > 0) {
        var _list = [];
        for (var i = 0, len = res.data.length; i < len; i++) {
          if (res.data[i].sportType == $stateParams.type) {
            _list.push(res.data[i]);
          }
        }
        $scope.teamlist = _list;
      }
      util.UI.hideLoading();
    }, function(res) {
     // console.log(res);
      util.UI.hideLoading();
      util.UI.showLoading('网络错误，请检查网络后重试');
      setTimeout(function() {
        util.UI.hideLoading();
        $ionicHistory.goBack();
      }, 1500)
    });

    $scope.selectTeam = function(index) {
      if (($stateParams.team == 'master' && $scope.storage.guestTeam && $scope.storage.guestTeam.players && $scope.storage.guestTeam.players.length > 0 && $scope.storage.guestTeam.players[0].teamId == $scope.teamlist[index].teamId) || ($stateParams.team == 'guest' && $scope.storage.masterTeam && $scope.storage.masterTeam.players && $scope.storage.masterTeam.players.length > 0 && $scope.storage.masterTeam.players[0].teamId == $scope.teamlist[index].teamId)) {
        util.UI.showLoading('主队和客队不能为同一队伍', 1000);
        return;
      };
      if ($scope.teamlist[index].players.length >= $stateParams.number) {
        enoughPlayer(index);
      } else {
        notEnoughPlayer(index);
      }
    }

    function enoughPlayer(index) {
      util.UI.showLoading();
      var teamInfo = formatData($scope.teamlist[index]);
      var _callback = function() {
        if ($stateParams.team == 'master') {
          $scope.storage.masterTeam = {
            teamName: teamInfo.team.teamName,
            players: teamInfo.teamplayers
          }
        } else if ($stateParams.team == 'guest') {
          $scope.storage.guestTeam = {
            teamName: teamInfo.team.teamName,
            players: teamInfo.teamplayers
          }
        }
        $ionicHistory.goBack();
      }
      var playerIds = [];
      angular.forEach(teamInfo.players, function(value, key) {
        playerIds.push(value.id);
      })
      var delTeamSql = "Delete from team where id ='" + teamInfo.team.id + "'";
      var delPlayerSql = "Delete from player where id in('" + playerIds.join("','") + "')";
      var delTeamMemberSql = "Delete from teamMember where teamId ='" + teamInfo.team.id + "'";
      $q.all([SQLite.execute(delTeamSql),SQLite.execute(delPlayerSql), SQLite.execute(delTeamMemberSql)]).then(function(results) {
        $q.all([SQLite.add('team', teamInfo.team), SQLite.add('player', teamInfo.players), SQLite.add('teamMember', teamInfo.teamplayers)]).then(function(results) {
          util.UI.hideLoading();
          _callback();
        }, function(results) {
          util.UI.hideLoading();
          util.UI.showLoading('添加失败，请重试',1000);
        });
      }, function(results) {
        util.UI.hideLoading();
        util.UI.showLoading('添加失败，请重试',1000);
      });
    }

    function notEnoughPlayer(index) {
      util.UI.showLoading();
      var teamInfo = formatData($scope.teamlist[index]);
      var _callback = function() {
        $scope.storage.myteamData = {
          teamname: teamInfo.team.teamName,
          teamid: teamInfo.team.id,
          players: [],
          logoId: teamInfo.team.logoId,
          logoUrl: teamInfo.team.logoUrl
        };
        angular.forEach(teamInfo.players, function(value, key) {
          $scope.storage.myteamData.players.push({
            id: value.id,
            playerName: value.playerName,
            playerNumber: value.playerNumber,
            logoUrl: value.logoUrl,
            teamid: teamInfo.team.id,
            disabled: true
          })
        })
        $state.go('app.addteam', {
          number: $stateParams.number,
          type: $stateParams.type,
          team: $stateParams.team,
          frommyteam: true
        });
      }
      var playerIds = [];
      angular.forEach(teamInfo.players, function(value, key) {
        playerIds.push(value.id);
      })
      var delTeamSql = "Delete from team where id ='" + teamInfo.team.id + "'";
      var delPlayerSql = "Delete from player where id in('" + playerIds.join("','") + "')";
      var delTeamMemberSql = "Delete from teamMember where teamId ='" + teamInfo.team.id + "'";
      $q.all([SQLite.execute(delTeamSql),SQLite.execute(delPlayerSql), SQLite.execute(delTeamMemberSql)]).then(function(results) {
        $q.all([SQLite.add('team', teamInfo.team), SQLite.add('player', teamInfo.players), SQLite.add('teamMember', teamInfo.teamplayers)]).then(function(results) {
          util.UI.hideLoading();
          _callback();
        }, function(results) {
          util.UI.hideLoading();
          util.UI.showLoading('添加失败，请重试',1000);
        });
      }, function(results) {
        util.UI.hideLoading();
        util.UI.showLoading('添加失败，请重试',1000);
      });

    }

    function formatData(teaminfo) {
      var _teamInfo = {
        team: {},
        players: [],
        teamplayers: []
      };
      _teamInfo.team = {
        id: teaminfo.teamId,
        teamType: teaminfo.teamType,
        teamName: teaminfo.teamName,
        sportType: teaminfo.sportType,
        logoUrl: teaminfo.logoUrl,
        logoId: teaminfo.logoId
      }
      angular.forEach(teaminfo.players, function(value, key) {
        _teamInfo.players.push({
          id: value.id,
          playerName: value.playerName,
          playerNumber: value.playerNumber,
          playerType: value.playerType,
          logoUrl: value.logoUrl
        })
        _teamInfo.teamplayers.push({
          playerId: value.id,
          teamId: teaminfo.teamId
        })
      })
      return _teamInfo;
    }
  }
]);