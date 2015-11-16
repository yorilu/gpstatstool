app.controller('AddPlayerCtrl', ['$scope', '$stateParams', '$ionicHistory', '$ionicActionSheet', 'SQLite', 'Storage', 'Camera', 'Util', 'Http',
  function($scope, $stateParams, $ionicHistory, $ionicActionSheet, SQLite, storage, camera, util, http) {
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
        for (var i = 0, len = $scope.storage.players.length; i < len; i++) {
          if (i == $stateParams.index - 1) {
            continue;
          }
          if ($scope.storage.players[i].playerNumber == $scope.data.number) {
            util.UI.showLoading('球员号码已存在', 1000);
            return;
          }
        }
        if ($.trim($scope.data.phone) != '' && !/^(1[1-9][0-9])\d{8}$/.test($scope.data.phone)) {
          util.UI.showLoading('手机号码不正确', 1000);
          return;
        }
        util.UI.showLoading()
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
      } else {
        util.UI.showLoading('请填写完整', 1000);
      }

    };

    function addPlayer() {
      var playerId = util.creatGUID();
      var param = {
        players: [{
          playerId: playerId,
          playerName: $scope.data.name,
          playerNumber: $scope.data.number,
          phoneNumber: $scope.data.phone||"",
          playerType: 'Normal',
          logoUrl: $scope.pLogoUrl,
          scorer: $scope.storage.account
        }]
      };
      http.addPlayer(param).then(
        function() {
          SQLite.add('player', {
            id: playerId,
            playerName: $scope.data.name,
            playerNumber: $scope.data.number,
            playerType: 'Normal',
            logoUrl: $scope.pLogoUrl,
          }).then(function(res) {
            $scope.storage.players[$stateParams.index - 1] = {
              id: playerId,
              playerName: $scope.data.name,
              playerNumber: $scope.data.number
            }
            util.UI.hideLoading();
            $ionicHistory.goBack();
          });
        },
        function() {
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