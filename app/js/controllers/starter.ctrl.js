app.controller('StarterCtrl', ['$scope', '$state', '$stateParams', 'SQLite', 'Util', 'Http',
    function($scope, $state, $stateParams, SQLite, util, http) {

        $scope.selectCount = 0;
        $scope.max = $stateParams.number;
        $scope.hostTeam = {
            teamName: '',
            teamId: '',
            players: [],
            need: false
        };
        $scope.guestTeam = {
            teamName: '',
            teamId: '',
            players: [],
            need: false
        };
        $scope.nowTeam = {
            type: '',
            teamName: '',
            teamId: '',
            players: []
        };
        //You can swap it with ".watch"
        $scope.countCheck = function(player) {
            player.isFirst ? $scope.selectCount++ : $scope.selectCount--;
        }

        var teamid = $stateParams.teamgroup.split(',');

        var sql = "select distinct a.teamId,a.playerId,b.teamName,c.playerNumber from gamePlayers a " +
            "left join team b on a.teamid=b.id " +
            "left join player c on a.playerid=c.id " +
            "where a.teamid in ('" + teamid[0] + "','" + teamid[1] + "') and a.gameid='" + $stateParams.matchId + "' order by c.playerNumber";

        //获取比赛列表
        SQLite.execute(sql).then(function(data) {
            angular.forEach(data, function(value, key) {
                if (value.teamId == teamid[0]) {
                    if (!$scope.hostTeam.need) {
                        $scope.hostTeam.need = true;
                        $scope.hostTeam.teamName = value.teamName;
                        $scope.hostTeam.teamId = value.teamId;
                        $scope.hostTeam.players = [];
                    }
                    $scope.hostTeam.players.push(value);
                } else if (value.teamId == teamid[1]) {
                    if (!$scope.guestTeam.need) {
                        $scope.guestTeam.need = true;
                        $scope.guestTeam.teamName = value.teamName;
                        $scope.guestTeam.teamId = value.teamId;
                        $scope.guestTeam.players = [];
                    }
                    $scope.guestTeam.players.push(value);
                }
                if ($scope.hostTeam.need) {
                    $scope.nowTeam = $scope.hostTeam;
                    $scope.nowTeam.type = 'host';
                } else if ($scope.guestTeam.need) {
                    $scope.nowTeam = $scope.guestTeam;
                    $scope.nowTeam.type = 'guest';
                }
            })
        });


        $scope.goGame = function() {
            if (($scope.nowTeam.type == 'host' && $scope.max != $scope.selectCount) || ($scope.nowTeam.type == 'guest' && $scope.max != $scope.selectCount)) {
                util.UI.showLoading('首发球员不足', 1000);
                return;
            }
            if ($scope.nowTeam.type == 'host' && $scope.max == $scope.selectCount && $scope.guestTeam.need) {
                $scope.hostTeam == $scope.nowTeam;
                $scope.selectCount = 0;
                $scope.nowTeam = $scope.guestTeam;
                $scope.nowTeam.type = 'guest';
                return;
            } else if ($scope.nowTeam.type == 'guest' && $scope.max == $scope.selectCount) {
                $scope.guestTeam == $scope.nowTeam;
            }
            var playerid = [];
            var serverParams = [];
            angular.forEach($scope.hostTeam.players, function(value, key) {
                if (value.isFirst) {
                    playerid.push("'" + value.playerId + "'");
                    serverParams.push({
                        playerId: value.playerId,
                        teamId: $scope.hostTeam.teamId,
                        gameId: $stateParams.matchId,
                        setFirst: 1
                    })
                }
            })
            angular.forEach($scope.guestTeam.players, function(value, key) {
                if (value.isFirst) {
                    playerid.push("'" + value.playerId + "'");
                    serverParams.push({
                        playerId: value.playerId,
                        teamId: $scope.guestTeam.teamId,
                        gameId: $stateParams.matchId,
                        setFirst: 1
                    })
                }
            })
            if (playerid.length > 0) {
                playerid.join(',');
            } else {
                return;
            }
            util.UI.showLoading();
            var sql = "update gamePlayers set isFirst=?,onPlay=?,hasPlay=?,uploadFlag=0 " +
                "where gameid='" + $stateParams.matchId + "' and teamid in ('" + teamid[0] + "','" + teamid[1] + "') ";

            var optionSql = " and playerid in (" + playerid + ")";

            //首先将所有首发阵容都清空,才允许设置新首发
            SQLite.execute(sql, [0, 0, 0]).then(function(data) {
                //设置首发
                return SQLite.execute(sql + optionSql, [1, 1, 1]);
            }).then(function(data) {
                http.addGamePlayer({gamePlayers:serverParams}).then(function() {
                    var setUploadFlag = "update gamePlayers set uploadFlag=1 " +
                        "where gameid='" + $stateParams.matchId + "' and teamid in ('" + teamid[0] + "','" + teamid[1] + "') ";
                    SQLite.execute(setUploadFlag).then(function() {
                        util.UI.hideLoading();
                        if ($stateParams.type == 'football') {
                            $state.go('app.gamefot', {
                                matchId: $stateParams.matchId
                            });
                        } else {
                            $state.go('app.game', {
                                matchId: $stateParams.matchId
                            });
                        }
                    })
                }, function() {
                    util.UI.hideLoading();
                    if ($stateParams.type == 'football') {
                        $state.go('app.gamefot', {
                            matchId: $stateParams.matchId
                        });
                    } else {
                        $state.go('app.game', {
                            matchId: $stateParams.matchId
                        });
                    }

                })
            })

        }


    }
]);