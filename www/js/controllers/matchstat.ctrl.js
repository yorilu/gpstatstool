/**
 * Created by anders on 15/6/1.
 */
define(['app'], function(app) {

    return app.controller('MatchStatCtrl', ['$scope', '$state', '$stateParams',
        '$timeout', 'SQLite',
        function($scope, $state, $stateParams, $timeout, SQLite) {
            // $ionicNavBarDelegate.showBackButton(t);
            $scope.SQLite = SQLite;

            var searchMatch = 'select a.*' +
                ',b.playerName' +
                ',b.playerNumber ' +
                ',c.homeTeamID' +
                ',c.guestTeamID' +
                ',c.teamAScore' +
                ',c.teamBScore ' +
                ',d.isFirst ' +
                ',d.teamID ' +
                ',e.teamName ' +
                'from BasketballStatistics a ' +
                'left join player b on a.playerID=b.ID ' +
                'left join game c on a.gameID=c.ID ' +
                'left join gamePlayers d on a.playerID=d.playerID ' +
                'left join team e on d.teamID=e.ID ' +
                'where  a.gameID=d.gameID and a.gameID=?';

            //获取比赛列表
            SQLite.execute(searchMatch, [$stateParams.matchID]).then(function(data) {
                console.log(data);
                if (data.length > 0) {
                    $scope.match = formatData(data);
                } else {
                    $scope.match = {
                        gameID: 1,
                        teamAID: 1,
                        teamBID: 2,
                        teamAName: '勇士',
                        teamBName: '骑士',
                        teamAScore: '93',
                        teamBScore: '64',
                        teamAPlayers: [{
                            playerID: 1,
                            score: 10,
                            twoPointShotHit: 2,
                            twoPointShotMiss: 5,
                            threePointShotHit: 1,
                            threePointShotMiss: 4,
                            freeThrowShotHit: 5,
                            freeThrowShotMiss: 10,
                            backboard: 5,
                            assist: 5,
                            steal : 5,
                            turnover: 5,
                            foul: 5,
                            blocking: 5 ,
                            efficiency: 5 ,
                            playerName: '姚明',
                            playerNumber: 11,
                            isFirst: true
                        }],
                        teamBPlayers: [{
                            playerID: 1,
                            score: 15,
                            twoPointShotHit: 2,
                            twoPointShotMiss: 5,
                            threePointShotHit: 1,
                            threePointShotMiss: 4,
                            freeThrowShotHit: 5,
                            freeThrowShotMiss: 10,
                            backboard: 5,
                            assist: 5,
                            steal : 5,
                            turnover: 5,
                            foul: 5,
                            blocking: 5 ,
                            efficiency: 5 ,
                            playerName: '麦迪',
                            playerNumber: 11,
                            isFirst: true
                        }]

                    }


                }
            });


            //获取事件列表
            SQLite.execute('SELECT * FROM GAMEEVENTDESC WHERE  gameID =?  ', [$stateParams.matchID]).then(function(data) {
                $scope.evtList = data;
            });

            $scope.second2Date = function(second) {
                var now = new Date('1970-01-01 00:00:00')
                return new Date(now.getTime() + second * 1000);
            };
            //获取比赛
            $scope.showStatFlag = true;

            $scope.toggleTab = function(e) {
                var d = e.target;
                if (d.id == 'stat') {
                    $scope.showStatFlag = true;
                } else {
                    $scope.showStatFlag = false;
                }
            };

            function formatData(data) {
                var d = {
                    gameID: data[0].gameID,
                    teamAID: data[0].homeTeamID,
                    teamAID: data[0].guestTeamID,
                    teamAScore: data[0].teamAScore,
                    teamBScore: data[0].teamBScore,
                    teamAPlayers: [],
                    teamBPlayers: [],
                }
                angular.forEach(data, function(value, key) {
                    var _t = null;
                    if (value.teamID == d.teamAID) {
                        if (!d.teamAName) {
                            d.teamAName == value.teamName;
                        }
                        _t = 'A';
                    }
                    if (value.teamID == d.teamBID) {
                        if (!d.teamBName) {
                            d.teamBName == value.teamName;
                        }
                        _t = 'B';
                    }
                    if (_t === 'A' && _t === 'B') {
                        var shotHit = value.twoPointShotHit + value.threePointShotHit + value.freeThrowShotHit;
                        var allShot = value.twoPointShotHit + value.threePointShotHit + value.freeThrowShotHit + twoPointShotMiss + threePointShotMiss + freeThrowShotMiss;
                        var efficiency = value.score + value.backboard + 1.4 * value.assist + value.steal + 1.4 * value.blocking - 0.7 * value.turnover + shotHit + 0.5 *  value.threePointShotHit - 0.8 * (allShot - shotHit) + 0.25 * freeThrowShotHit-0.8*freeThrowShotMiss;
                        d['team' + _t + 'Players'].push({
                            playerID: value.playerID,
                            score: value.score,
                            twoPointShotHit: value.twoPointShotHit,
                            twoPointShotMiss: value.twoPointShotMiss,
                            threePointShotHit: value.threePointShotHit,
                            threePointShotMiss: value.threePointShotMiss,
                            freeThrowShotHit: value.freeThrowShotHit,
                            freeThrowShotMiss: value.freeThrowShotMiss,
                            backboard: value.backboard,
                            assist: value.assist,
                            steal : value.steal ,
                            turnover: value.turnover,
                            foul: value.foul,
                            blocking: value.blocking,
                            efficiency: efficiency,
                            playerName: value.playerName,
                            playerNumber: value.playerNumber,
                            isFirst: value.isFirst
                        })
                    }
                })
                return _d;
            };
        }
    ]);

});