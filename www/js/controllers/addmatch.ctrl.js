define(['app', 'mobiscroll'], function(app) {

  return app.controller('AddMatchCtrl', ['$scope', '$q', '$state', '$stateParams', '$ionicLoading', '$ionicActionSheet', 'SQLite', 'storage', 'geolocation',
    function($scope, $q, $state, $stateParams, $ionicLoading,$ionicActionSheet, SQLite, storage, geolocation) {

      // Date & Time demo initialization
      $scope.storage = storage;

      $scope.SQLite = SQLite;

      $scope.storage.formatMatch();

      var matchType = {
        '足球': [{
          text: '5V5'
        }, {
          text: '6V6'
        }, {
          text: '7V7'
        }, {
          text: '8V8'
        }, {
          text: '9V9'
        }, {
          text: '10V10'
        }, {
          text: '11V11'
        }],
        '篮球': [{
          text: '1V1'
        }, {
          text: '2V2'
        }, {
          text: '3V3'
        }, {
          text: '4V4'
        }, {
          text: '5V5'
        }]
      }

      $('#txt_datetime').mobiscroll().datetime({
        theme: 'ios', // Specify theme like: theme: 'ios' or omit setting to use default 
        mode: 'scroller', // Specify scroller mode like: mode: 'mixed' or omit setting to use default 
        display: 'bottom', // Specify display mode like: display: 'bottom' or omit setting to use default 
        minDate: new Date(), // More info about minDate: http://docs.mobiscroll.com/2-15-1/datetime#!opt-minDate
        dateFormat: 'yy-mm-dd',
        timeFormat: 'HH:ii',
        timeWheels: 'HHii',
        defaultValue: new Date()
      });
      var geoPromise = geolocation.getCurrentPosition();
      geoPromise.then(function(data) {
        // alert(JSON.stringify(data));
        // data={
        //   longitude:"",
        //   lantitude:""
        // }

      }, function() {})
      $scope.showTeamSheet = function(e) {
        if (!$scope.number) {
          $ionicLoading.show({
            template: '必须先选择赛事类型',
            duration: 1000
          });
          return;
        }
        $scope.$dom = $(e.currentTarget);
        // 显示操作表
        $ionicActionSheet.show({
          buttons: [{
            text: '从我的球队中选'
          }, {
            text: '添加球队'
          }, {
            text: '充数球队'
          }],
          cancelText: '取消',
          buttonClicked: function(index) {
            switch (index) {
              case 0:
                $state.go('app.myteam', {
                  number: $scope.number,
                  type: $stateParams.type,
                  team: $scope.$dom.attr('data-type')
                });
                break;
              case 1:
                $state.go('app.addteam', {
                  number: $scope.number,
                  type: $stateParams.type,
                  team: $scope.$dom.attr('data-type')
                });
                break;
              case 2:
                if ($scope.$dom.attr('id') == 'txt_masterTeam') {
                  $scope.storage.masterTeam.teamName = '充数球队';
                } else if ($scope.$dom.attr('id') == 'txt_guestTeam') {
                  $scope.storage.guestTeam.teamName = '充数球队';
                }
                return true;
                break;
              default:
                return true;
            }
          }
        });
      };
      $scope.showTypeSheet = function(e) {
        $scope.$dom = $(e.currentTarget);
        // 显示操作表
        $ionicActionSheet.show({
          buttons: matchType[$stateParams.type],
          titleText: '选择赛事类型',
          cancelText: '取消',
          buttonClicked: function(index, obj) {
            $scope.$dom.val(obj.text);
            $scope.number = obj.text.substr(0, 1);
            $scope.storage.formatMatch();
            return true;
          }
        });

      };

      $scope.create = function() {
        if (!validate()) {
          return;
        }

        if ($scope.storage.masterTeam.teamName == '充数球队' && $scope.storage.masterTeam.players.length == 0 && $scope.storage.guestTeam.teamName == '充数球队' && $scope.storage.guestTeam.players.length == 0) {
          faker_Insert(2);
        } else if ($scope.storage.masterTeam.teamName == '充数球队' && $scope.storage.masterTeam.players.length == 0) {
          faker_Insert(0);
        } else if ($scope.storage.guestTeam.teamName == '充数球队' && $scope.storage.guestTeam.players.length == 0) {
          faker_Insert(1);
        } else {
          game_Insert();
        }
      };
      //0:master,1:guest,2:both
      function faker_Insert(type) {
        var _teamlist = [{
          teamName: '充数球队',
          sportType: $stateParams.type,
          teamType: 'Temp'
        }];
        if (type == 2) {
          _teamlist.push({
            teamName: '充数球队',
            sportType: $stateParams.type,
            teamType: 'Temp'
          })
        }
        $scope.SQLite.add('team', _teamlist).then(
          function(teamid) {
            $scope.teamid = angular.copy(teamid);
            var _data = [];
            var _faker = []; //充数球员列表
            for (var i = 0; i < $scope.number; i++) {
              _faker.push({
                playerName: '充数球员',
                playerNumber: 100 + i,
                playerType: 'Temp'
              })
            }
            if (teamid.length == 2) {
              _faker = _faker.concat(_faker);
            }
            $scope.SQLite.add('player', _faker).then(function(res) {
              angular.forEach(res, function(value, key) {
                if (key < $scope.number) {
                  _data.push({
                    teamID: $scope.teamid[0],
                    playerID: value
                  })
                } else {
                  _data.push({
                    teamID: $scope.teamid[1],
                    playerID: value
                  })
                }
              })
            }).then(function() {
              $scope.SQLite.add('teamMember', _data)
                .then(function() {
                  if (type == 0) {
                    $scope.storage.masterTeam = {
                      teamName: '充数球队',
                      players: _data
                    }
                  } else if (type == 1) {
                    $scope.storage.guestTeam = {
                      teamName: '充数球队',
                      players: _data
                    }
                  } else if (type == 2) {
                    $scope.storage.guestTeam = {
                      teamName: '充数球队',
                      players: _data.splice(0, $scope.number)
                    }
                    $scope.storage.masterTeam = {
                      teamName: '充数球队',
                      players: _data
                    }
                  }
                  game_Insert();
                })
            });
          })
      }

      function game_Insert() {
        $scope.SQLite.add('game', {
          gameType: $scope.number + 'v' + $scope.number,
          homeTeamID: $scope.storage.masterTeam.players[0].teamID,
          guestTeamID: $scope.storage.guestTeam.players[0].teamID,
          stadiumName: $.trim($('#txt_location').val()),
          courtName: $.trim($('#txt_court').val()),
          remark: '',
          sportType: $stateParams.type,
          status: 0,
          teamAScore: 0,
          teamBScore: 0
        }).then(function(res) {
          $scope.gameid = res;
          var _data = [];
          angular.forEach($scope.storage.masterTeam.players, function(value, key) {
            _data.push({
              gameID: res,
              teamID: value.teamID,
              playerID: value.playerID,
              isFirst: key < $scope.number ? 1 : 0,
              onPlay: key < $scope.number ? 1 : 0
            })
          })
          angular.forEach($scope.storage.guestTeam.players, function(value, key) {
            _data.push({
              gameID: res,
              teamID: value.teamID,
              playerID: value.playerID,
              isFirst: key < $scope.number ? 1 : 0,
              onPlay: key < $scope.number ? 1 : 0
            })
          })

          $scope.SQLite.add('gamePlayers', _data).then(function(res) {
            $state.go('app.game', {
              matchID: $scope.gameid
            });
          });
        });
      }

      function validate() {
        if (!$scope.number) {
          $ionicLoading.show({
            template: '必须先选择赛事类型',
            duration: 1000
          });
          return false;
        }
        if ($.trim($('#txt_datetime').val()) == '') {
           $ionicLoading.show({
            template: '必须先选择比赛时间',
            duration: 1000
          });
          return false;
        }


        if (!$scope.storage.masterTeam || !$scope.storage.masterTeam.teamName || !$scope.storage.guestTeam || !$scope.storage.guestTeam.teamName) {
           $ionicLoading.show({
            template: '参赛球队不能为空',
            duration: 1000
          });
          return false;
        }
        return true;
      }

      // $scope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams) {
      //   debugger;
      //   console.log("State changed: ", fromState);

      //   if (fromState.name == "app.addteam") {
      //     //scope.storage.teamName=window.storage.teamName;
      //   }

      // })
    }
  ]);

});