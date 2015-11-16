/**
 * 程序路由及启动配置
 * @type {module}
 */

var app = angular.module('GPGame', ['ionic', 'config']);

app.run(['$ionicPlatform','$state',function($ionicPlatform,$state) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      //StatusBar.styleLightContent();
    }

    document.addEventListener("backbutton", function(){
      var viewName = $state.current.name;
      if(viewName == 'app.gamelist' || viewName == 'login'){
        if(!window.actionSheetIsShow){
          window.localStorage.setItem('isResume','true');
          ionic.Platform.exitApp();
        }
        window.actionSheetIsShow = false;
      }
    }, true);
  });
}]).config(function($stateProvider, $urlRouterProvider, $ionicConfigProvider, $httpProvider, $logProvider) {
  $stateProvider
    .state('boot', {
      url: "",
      views: {
        bootView: {
          template: "",
          controller: 'BootCtrl'
        }
      }
    })
    .state('app', {
      url: "/app",
      abstract: true,
      views: {
        mainView: {
          templateUrl: "templates/main.html"
        }
      }
    })
    .state('login', {
      url: "/login",
      views: {
        'mainView': {
          templateUrl: "templates/login.html",
          controller: 'LoginCtrl'
        }
      }
    })
    .state('app.gamelist', {
      url: "/gamelist",
      cache: false,
      views: {
        'menuContent': {
          templateUrl: "templates/gamelist.html",
          controller: 'GameListCtrl'
        }
      }
    })
    .state('app.addmatch', {
      url: "/addmatch/{type}",
      views: {
        'menuContent': {
          templateUrl: "templates/addmatch.html",
          controller: 'AddMatchCtrl'
        }
      }
    })
    .state('app.addteam', {
      url: "/addteam/{number}/{type}/{team}/{frommyteam}",
      views: {
        'menuContent': {
          templateUrl: "templates/addteam.html",
          controller: 'AddTeamCtrl'
        }
      }
    })
    .state('app.myteam', {
      url: "/myteam/{number}/{type}/{team}",
      views: {
        'menuContent': {
          templateUrl: "templates/myteam.html",
          controller: 'MyTeamCtrl'
        }
      }
    })
    .state('app.addplayer', {
      url: "/addplayer/{index}",
      views: {
        'menuContent': {
          templateUrl: "templates/addplayer.html",
          controller: 'AddPlayerCtrl'
        }
      }
    })
    .state('app.myplayer', {
      url: "/myplayer/{type}/{index}",
      views: {
        'menuContent': {
          templateUrl: "templates/myplayer.html",
          controller: 'MyPlayerCtrl'
        }
      }
    })
    .state('app.starter', {
      url: "/starter/{matchId}/{number}/{teamgroup}/{type}",
      views: {
        'menuContent': {
          templateUrl: "templates/starter.html",
          controller: 'StarterCtrl'
        }
      }
    })
    .state('app.game', {
      url: "/game/{matchId}",
      cache: false,
      views: {
        'menuContent': {
          templateUrl: "templates/game.html",
          controller: 'CommonGameCtrl'
        }
      }
    })
    .state('app.gamefot', {
      url: "/gamefot/{matchId}",
      cache: false,
      views: {
        'menuContent': {
          templateUrl: "templates/gamefot.html",
          controller: 'CommonGameCtrl'
        }
      }
    })
    .state('app.searcharea', {
      url: "/searcharea/{type}",
      views: {
        'menuContent': {
          templateUrl: "templates/searcharea.html",
          controller: 'SearchAreaCtrl'
        }
      }
    })
    .state('app.logo', {
      url: "/logo",
      views: {
        'menuContent': {
          templateUrl: "templates/logo.html",
          controller: 'LogoCtrl'
        }
      }
    })
    .state('app.footballstat', {
      url: "/footballstat/{matchID}",
      views: {
        'menuContent': {
          templateUrl: "templates/footballstat.html",
          controller: 'FootballStatCtrl'
        }
      }
    })
    .state('app.basketballstat', {
      url: "/basketballstat/{matchID}",
      views: {
        'menuContent': {
          templateUrl: "templates/basketballstat.html",
          controller: 'BasketballStatCtrl'
        }
      }
    })
    .state('app.changeplayer', {
      url: "/changeplayer/{matchID}/{teamID}/{playerID}",
      views: {
        'menuContent': {
          templateUrl: "templates/changeplayer.html",
          controller: 'ChangePlayerCtrl'
        }
      }
    })

  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('boot');

  $httpProvider.defaults.headers.post['Content-Type'] = 'text/plain; charset=UTF-8';

  $logProvider.debugEnabled(false);

  //将title统一设置在中间
  $ionicConfigProvider.navBar.alignTitle('center');
  $ionicConfigProvider.backButton.previousTitleText(false);
  $ionicConfigProvider.backButton.text('');

  //关闭IOS 7 下的手势回退
  $ionicConfigProvider.views.swipeBackEnabled(false);

})