/**
 * Created by danny zou on 15/7/16
 */
app.controller('FootballStatCtrl', ['$scope', '$q', '$state', '$ionicHistory', '$stateParams', 'SQLite', 'Http', 'Util',
    function($scope, $q, $state, $ionicHistory, $stateParams, SQLite, http, util) {
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

        util.UI.showLoading();
        var homeTeamSql = 'select a.teamName,b.teamAScore,b.teamBScore from team a , game b where a.id = b.homeTeamID and b.id=?';
        var guestTeamSql = 'select a.teamName,b.teamAScore,b.teamBScore from team a , game b where a.id = b.guestTeamID and b.id=?';
        $q.all([SQLite.execute(homeTeamSql, [$stateParams.matchID]), SQLite.execute(guestTeamSql, [$stateParams.matchID])]).then(function(results) {
            $scope.gameInfo = {
                teamAName: results[0][0].teamName,
                teamBName: results[1][0].teamName,
                teamAScore: results[0][0].teamAScore,
                teamBScore: results[1][0].teamBScore
            };
            doRequest();
        }, function(results) {
            util.UI.hideLoading();
            util.UI.showLoading('网络错误，请检查网络后重试');
            setTimeout(function() {
                util.UI.hideLoading();
                $ionicHistory.goBack();
            }, 1500)
        });

        function doRequest() {
            $q.all([http.getFootBallEventsStatistics($stateParams.matchID), http.getGameEventDescrips($stateParams.matchID)]).then(function(results) {
                util.UI.hideLoading();
                $scope.statsList = results[0].data.footBallEventsStatistics;
                $scope.eventList = results[1].data;
            }, function(results) {
                util.UI.hideLoading();
                util.UI.showLoading('网络错误，请检查网络后重试');
                setTimeout(function() {
                    util.UI.hideLoading();
                    $ionicHistory.goBack();
                }, 1500)
            });
        }
    }
]);