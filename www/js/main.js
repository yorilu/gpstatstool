require(['require-common'], function(common) {
  require.config({
    baseUrl: '',
    paths: common.paths,
    shim: common.shim
  });


  require( [
    'cordova',
    'angularAMD'], function(cordova, angularAMD) {
    'use strict';

    var start = function() {
        /* Requires the app, bootstraping Angular in AMD mode */
        require(['app','SQLite','network','storage','geolocation'], function(app,sqlite) {
           // sqlite.init();
        });
    };

    document.addEventListener("deviceready", start, false);

    if (typeof cordova === 'undefined') {
        angular.element().ready(function () {
            try {
                start()
            } catch (e) {
                console.error(e.stack || e.message || e);
            }
        });
    }

    });
});