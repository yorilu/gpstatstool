app.controller('MyPlayerCtrl', ['$scope', '$stateParams', 'Storage', 'SQLite', '$ionicHistory', 'Util', 'Http',
  function($scope, $stateParams, storage, SQLite, $ionicHistory, util, http) {

    $scope.storage = storage;
    $scope.playerlist = [];

    util.UI.showLoading();
    http.getPlayers().then(function(res) {
     // console.log(res);
      util.UI.hideLoading();
      if(res&&res.data&&res.data.players&&res.data.players.length)
      {
      $scope.playerlist = res.data.players;
      }
    }, function(res) {
     // console.log(res);
      util.UI.hideLoading();
      util.UI.showLoading('网络错误，请检查网络后重试');
      setTimeout(function() {
        util.UI.hideLoading();
        $ionicHistory.goBack();
      }, 1500)
    });

    $scope.selectPlayer = function(index) {
      //过滤掉已经在球队中的队员
      for (var i = 0, len = $scope.storage.players.length; i < len; i++) {
        //如原来球员3已经是麦迪，再在球员3选中麦迪的时候允许选择
        if (i === $stateParams.index - 1) {
          continue;
        }
        if ($scope.playerlist[index].playerId == $scope.storage.players[i].id) {
          util.UI.showLoading('不能重复添加同一球员', 1000);
          return;
        }
        if ($scope.playerlist[index].playerNumber == $scope.storage.players[i].playerNumber) {
          util.UI.showLoading('不能重复同样号码的球员', 1000);
          return;
        }
      }
      var _callback = function() {
        $scope.storage.players[$stateParams.index - 1] = {
          id: $scope.playerlist[index].playerId,
          playerName: $scope.playerlist[index].playerName,
          playerNumber: $scope.playerlist[index].playerNumber
        }
        $ionicHistory.goBack();
      }
      util.UI.showLoading();
      var param={
         id: $scope.playerlist[index].playerId,
          playerType: $scope.playerlist[index].playerType,
          playerName: $scope.playerlist[index].playerName,
          playerNumber: $scope.playerlist[index].playerNumber,
          logoUrl: $scope.playerlist[index].logoUrl,
      }
      SQLite.add('player',param).then(function(results) {
        util.UI.hideLoading();
        _callback();
      }, function(results) {
        util.UI.hideLoading();
        _callback();
      });
    }
  }
]);