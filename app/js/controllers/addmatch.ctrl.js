app.controller('AddMatchCtrl', ['$scope', '$q', '$state', '$stateParams', '$ionicHistory', '$ionicActionSheet', 'SQLite', 'Storage', 'Http', 'Network', 'Util',
      function($scope, $q, $state, $stateParams, $ionicHistory, $ionicActionSheet, SQLite, storage, http, network, util) {
        storage.areaDetail = {
          id: '',
          name: '',
          cityId:'',
          courtlist: []
        };
        storage.courtDetail = {
          id: '',
          name: ''
        };
        // Date & Time demo initialization
        $scope.storage = storage;

        $scope.storage.formatMatch();

        var matchType = {
          'football': [{
            text: '5v5'
          }, {
            text: '6v6'
          }, {
            text: '7v7'
          }, {
            text: '8v8'
          }, {
            text: '9v9'
          }, {
            text: '10v10'
          }, {
            text: '11v11'
          }],
          'basketball': [{
            text: '1v1'
          }, {
            text: '2v2'
          }, {
            text: '3v3'
          }, {
            text: '4v4'
          }, {
            text: '5v5'
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
        $('#txt_datetime').val(util.dateFormat((new Date()), "yyyy-MM-dd hh:mm"))
        $scope.dateInput = $('#txt_datetime').mobiscroll('getInst');

        $scope.clickStadium = function() {
          if (network.isOnline()) {
            $state.go('app.searcharea', {
              type: $stateParams.type
            });
          } else {
            util.UI.showLoading('网络错误，请检查网络后重试', 1000);
          }
        }

        $scope.showTeamSheet = function(e) {
          if (!$scope.number) {
            util.UI.showLoading('必须先选择赛事类型', 1000);
            return;
          }
          $scope.$dom = $(e.currentTarget);
          // 显示操作表
          $ionicActionSheet.show({
            buttons: [{
              text: '从我的球队中选'
            }, {
              text: '添加球队'
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
                default:
                  return true;
              }
            }
          });
        };
        $scope.showCourtSheet = function() {
          if ($scope.storage.areaDetail.courtList && $scope.storage.areaDetail.courtList.length > 0) {
            var _data = [];
            angular.forEach($scope.storage.areaDetail.courtList, function(value, key) {
              if (value.sportType.indexOf($stateParams.type) > -1) {
                _data.push({
                  text: value.name,
                  id: value.id
                })
              }
            })
            $ionicActionSheet.show({
              buttons: _data,
              titleText: '选择场地',
              cancelText: '取消',
              buttonClicked: function(index, obj) {
                $scope.storage.courtDetail = {
                  id: obj.id,
                  name: obj.text
                }
                return true;
              }
            });
          }
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
              $scope.number = obj.text.split('v')[0];
              $scope.storage.formatMatch();
              return true;
            }
          });

        };

        $scope.create = function() {
          if (!validate()) {
            return;
          }
          game_Insert();
        };

         function game_Insert() {
           util.UI.showLoading();
           $scope.gameid = util.creatGUID();
           var param1 = {
             id: $scope.gameid,
             startTime: $.trim($('#txt_datetime').val()),
             gameType: $scope.number + 'v' + $scope.number,
             gameName: $scope.storage.masterTeam.teamName + ' vs ' + $scope.storage.guestTeam.teamName,
             homeTeamId: $scope.storage.masterTeam.players[0].teamId,
             guestTeamId: $scope.storage.guestTeam.players[0].teamId,
             cityId:$scope.storage.areaDetail.cityId,
             stadiumName: $scope.storage.areaDetail.name,
             stadiumId: $scope.storage.areaDetail.id,
             courtName: $scope.storage.courtDetail.name,
             courtId: $scope.storage.courtDetail.id,
             remark: $.trim($('#txt_remark').val()),
             sportType: $stateParams.type,
             status: 0,
             scoreKeeperAccount: $scope.storage.account,
             teamAScore: 0,
             teamBScore: 0
           }
           http.addGame(param1).then(function(results) {
             game_Insert_Local()
           }, function(results) {
             util.UI.hideLoading();
             util.UI.showLoading('网络错误，请检查网络后重试', 1000);
           });
         }

         function game_Insert_Local() {
           var param1 = {
             id: $scope.gameid,
             startTime: $.trim($('#txt_datetime').val()),
             gameType: $scope.number + 'v' + $scope.number,
             gameName: $scope.storage.masterTeam.teamName + ' vs ' + $scope.storage.guestTeam.teamName,
             homeTeamId: $scope.storage.masterTeam.players[0].teamId,
             guestTeamId: $scope.storage.guestTeam.players[0].teamId,
             stadiumName: $scope.storage.areaDetail.name,
             stadiumId: $scope.storage.areaDetail.id,
             courtName: $scope.storage.courtDetail.name,
             courtId: $scope.storage.courtDetail.id,
             remark: $.trim($('#txt_remark').val()),
             sportType: $stateParams.type,
             status: 0,
            // scoreKeeperAccount: $scope.storage.account,
             teamAScore: 0,
             teamBScore: 0,
             homeTeamOver: $scope.storage.masterTeam.players.length > $scope.number ? 1 : 0,
             guestTeamOver: $scope.storage.guestTeam.players.length > $scope.number ? 1 : 0
           }
           var param2 = [];
           angular.forEach($scope.storage.masterTeam.players, function(value, key) {
             param2.push({
               gameId: $scope.gameid,
               teamId: value.teamId,
               playerId: value.playerId,
               isFirst: $scope.storage.masterTeam.players.length > $scope.number ? 0 : (key < $scope.number ? 1 : 0),
               onPlay: $scope.storage.masterTeam.players.length > $scope.number ? 0 : (key < $scope.number ? 1 : 0),
               hasPlay: $scope.storage.masterTeam.players.length > $scope.number ? 0 : (key < $scope.number ? 1 : 0)
             })
           })
           angular.forEach($scope.storage.guestTeam.players, function(value, key) {
             param2.push({
               gameId: $scope.gameid,
               teamId: value.teamId,
               playerId: value.playerId,
               isFirst: $scope.storage.guestTeam.players.length > $scope.number ? 0 : (key < $scope.number ? 1 : 0),
               onPlay: $scope.storage.guestTeam.players.length > $scope.number ? 0 : (key < $scope.number ? 1 : 0),
               hasPlay: $scope.storage.guestTeam.players.length > $scope.number ? 0 : (key < $scope.number ? 1 : 0)
             })
           })

           $q.all([SQLite.add('game', param1), SQLite.add('gamePlayers', param2)]).then(function(results) {
               util.UI.hideLoading();
               $ionicHistory.goBack();
             }, function(results) {
               util.UI.hideLoading();
               util.UI.showLoading('网络错误，请检查网络后重试', 1000);
             });
           }

          function validate() {
            if (!$scope.number) {
              util.UI.showLoading('必须先选择赛事类型', 1000);
              return false;
            }
            if ($.trim($('#txt_datetime').val()) == '') {
              util.UI.showLoading('必须先选择比赛时间', 1000);
              return false;
            }

            if (!$scope.storage.masterTeam || !$scope.storage.masterTeam.teamName || !$scope.storage.guestTeam || !$scope.storage.guestTeam.teamName) {
              util.UI.showLoading('参赛球队不能为空', 1000);
              return false;
            }
            if ($.trim($scope.storage.areaDetail.name) == '' || $.trim($scope.storage.courtDetail.name) == '') {
              util.UI.showLoading('场馆和场地不能为空', 1000);
              return false;
            }
            return true;
          }

          $scope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {
            //点安卓自带back按钮时，如果比赛时间浮层show着的话，先隐藏----add by danny zou
            if ($scope.dateInput.isVisible()) {
              $scope.dateInput.hide();
              event.preventDefault();
            }
          })
        }
      ]);