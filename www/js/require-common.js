/* Allows to have common dependencies in "main" and "test-main" */
define([], function() {
  return {
    paths: {
      'angularAMD': 'lib/angularAMD/angularAMD',
      'require-text': 'lib/requirejs-text/text',

      'mobiscroll': 'js/libs/mobiscroll/mobiscroll.custom-2.15.1.min',
      /* I chose to declare each Controller/Service/Directive here, 
         so I don't need to use path when requiring them in app and tests. */
      // Controllers

      'MenuCtrl': 'js/controllers/menu.ctrl',
      'MatchListCtrl': 'js/controllers/matchlist.ctrl',
      'MatchStatCtrl': 'js/controllers/matchstat.ctrl',
      'AddMatchCtrl': 'js/controllers/addmatch.ctrl',
      'AddTeamCtrl': 'js/controllers/addteam.ctrl',
      'MyTeamCtrl': 'js/controllers/myteam.ctrl',
      'AddPlayerCtrl': 'js/controllers/addplayer.ctrl',
      'MyPlayerCtrl': 'js/controllers/myplayer.ctrl',
      'StarterCtrl': 'js/controllers/starter.ctrl',
      'GameCtrl': 'js/controllers/game.ctrl',

      'loginTpl': 'templates/login.html',

      // Module declaration and Bootstrap
      'app': 'js/app',
      'SQLite': 'js/services/sqlite',
      'util': 'js/services/util',
      'http': 'js/services/http',
      'network': 'js/services/network',
      'storage': 'js/services/storage',
      'geolocation': 'js/services/geolocation'
      
    },
    shim: {
      'mobiscroll': {
        exports: 'mobiscroll'
      },

      'angularAMD': {
        exports: 'angularAMD'
      }
    }
  };
});