// Ionic Starter App
define(['angularAMD'], function (angularAMD) {

    // angular.module is a global place for creating, registering and retrieving Angular modules
    // 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
    // the 2nd parameter is an array of 'requires'
    var app = angular.module('scGpStats', ['ionic']);

    app.config(function ($stateProvider, $urlRouterProvider, $ionicConfigProvider,$httpProvider) {
        $stateProvider
            .state('app', angularAMD.route({
                url: "",
                abstract: true,
                templateUrl: "templates/menu.html",
                controller: 'MenuCtrl'
            }))
            .state('app.matchlist', angularAMD.route({
                url: "/matchlist",
                views: {
                    'menuContent': angularAMD.route({
                        templateUrl: "templates/matchlist.html",
                        controller: 'MatchListCtrl'
                    })
                }
            }))
            .state('app.matchstat', angularAMD.route({
                url: "/matchstat/{matchID:[1-9]}",
                views: {
                    'menuContent': angularAMD.route({
                        templateUrl: "templates/matchstat.html",
                        controller: 'MatchStatCtrl'
                    })
                }
            }))
            .state('app.addmatch', angularAMD.route({
                url: "/addmatch/{type}",
                views: {
                    'menuContent': angularAMD.route({
                        templateUrl: "templates/addmatch.html",
                        controller: 'AddMatchCtrl'
                    })
                }
            }))
            .state('app.addteam', angularAMD.route({
                url: "/addteam/{number}/{type}/{team}/{frommyteam}",
                views: {
                    'menuContent': angularAMD.route({
                        templateUrl: "templates/addteam.html",
                        controller: 'AddTeamCtrl'
                    })
                }
            }))
            .state('app.myteam', angularAMD.route({
                url: "/myteam/{number}/{type}/{team}",
                views: {
                    'menuContent': angularAMD.route({
                        templateUrl: "templates/myteam.html",
                        controller: 'MyTeamCtrl'
                    })
                }
            }))
            .state('app.addplayer', angularAMD.route({
                url: "/addplayer/{index}",
                views: {
                    'menuContent': angularAMD.route({
                        templateUrl: "templates/addplayer.html",
                        controller: 'AddPlayerCtrl'
                    })
                }
            }))
            .state('app.myplayer', angularAMD.route({
                url: "/myplayer/{type}/{index}",
                views: {
                    'menuContent': angularAMD.route({
                        templateUrl: "templates/myplayer.html",
                        controller: 'MyPlayerCtrl'
                    })
                }
            }))
            .state('app.starter', angularAMD.route({
                url: "/starter/{type}/{index}",
                views: {
                    'menuContent': angularAMD.route({
                        templateUrl: "templates/starter.html",
                        controller: 'StarterCtrl'
                    })
                }
            }))
            .state('app.game', angularAMD.route({
                url: "/game/{matchID}",
                views: {
                    'menuContent': angularAMD.route({
                        templateUrl: "templates/game.html",
                        controller: 'GameCtrl'
                    })
                }
            }))
        // if none of the above states are matched, use this as the fallback
        $urlRouterProvider.otherwise('/matchlist');

        $httpProvider.defaults.headers.post['Content-Type'] = 'text/plain; charset=UTF-8';

        //将title统一设置在中间
        $ionicConfigProvider.navBar.alignTitle('center');
        $ionicConfigProvider.backButton.previousTitleText(false);
        $ionicConfigProvider.backButton.text('');
    })

    return angularAMD.bootstrap(app);
});