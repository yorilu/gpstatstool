/**
 * Created by anders on 15/6/1.
 */
define(['app'], function (app) {

    return app.controller('StarterCtrl', ['$scope', '$state', '$stateParams','SQLite',
        function ($scope, $state, $stateParams, SQLite) {
            // $ionicNavBarDelegate.showBackButton(t);


            var searchMatch = "select g.id, g.teamAScore,g.teamBScore,g.status," +
                "t1.teamname hometeam,t2.teamname guestteam" +
                " FROM game g, team t1,team t2" +
                " where g.hometeam = t1.id" +
                " and g.guestteam = t2.id and g.id=?";


            //获取比赛列表
            SQLite.execute(searchMatch, [$stateParams.matchID]).then(function (data) {

            });


            $scope.goGame = function (){
                $state.go('app.game', {matchID: $stateParams.matchID});
            }


        }
    ]);

});