/**
 * Created by danny zou on 15/7/16
 */
app.controller('BasketballStatCtrl', ['$scope', '$q', '$state', '$ionicHistory', '$stateParams', 'SQLite', 'Http', 'Util',
    function($scope, $q, $state, $ionicHistory, $stateParams, SQLite, http, Util) {
        $scope.gameInfo = {};
        $scope.showStatFlag = true;
        $scope.toggleTab = function(e) {
            var d = e.target;
            if (d.id == 'stat'&&!$scope.showStatFlag) {
                $scope.showStatFlag = true;
            } else if(d.id == 'event'&&$scope.showStatFlag){
                $scope.showStatFlag = false;
            }
        };
        $scope.second2Date = function(second) {
            var now = new Date('1970/01/01 00:00:00')
            return new Date(now.getTime() + second * 1000);
        };
        Util.UI.showLoading();
        var homeTeamSql = 'select a.id, a.teamName,b.teamAScore,b.teamBScore from team a , game b where a.id = b.homeTeamID and b.id=?';
        var guestTeamSql = 'select a.id, a.teamName,b.teamAScore,b.teamBScore from team a , game b where a.id = b.guestTeamID and b.id=?';
        $q.all([SQLite.execute(homeTeamSql, [$stateParams.matchID]), SQLite.execute(guestTeamSql, [$stateParams.matchID])]).then(function(results) {
            console.log('SQLITE gameInfo success')
            $scope.gameInfo = {
                teamAId: results[0][0].id,
                teamBId: results[1][0].id,
                teamAName: results[0][0].teamName,
                teamBName: results[1][0].teamName,
                teamAScore: results[0][0].teamAScore,
                teamBScore: results[1][0].teamBScore
            };
            doRequest($scope.gameInfo);
        }, function(results) {
            util.UI.hideLoading();
            util.UI.showLoading('网络错误，请检查网络后重试');
            setTimeout(function() {
                util.UI.hideLoading();
                $ionicHistory.goBack();
            }, 1500)
        });

        function doRequest(gameInfo) {
            $q.all([http.getBasketballStatistics($stateParams.matchID), http.getGameEventDescrips($stateParams.matchID)]).then(function(results) {
                Util.UI.hideLoading();
                $scope.eventList = results[1].data;
                $scope.statsInfo = formatStatsData(gameInfo, results[0].data);
            }, function(results) {
                Util.UI.hideLoading();
                Util.UI.showLoading('数据统计稍后就到,请等待!',1000);
                //setTimeout(function() {
                //    Util.UI.hideLoading();
                //    $ionicHistory.goBack();
                //}, 1500)
            });
        }

        function formatStatsData(gameInfo, data) {
            var ret = {
                Aplayers: [],
                Bplayers: []
            };
            if (data && data.length > 0) {
                angular.forEach(data, function(value, key) {
                    if (value.teamId == gameInfo.teamAId) {
                        ret.Aplayers.push(value);
                    } else if (value.teamId == gameInfo.teamBId) {
                        ret.Bplayers.push(value);
                    }
                })
            }
            return ret;
        }
    }
]);