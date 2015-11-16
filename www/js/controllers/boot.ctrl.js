/**
 * 程序入口页
 */

app.controller('BootCtrl', ['$scope', '$state', '$ionicHistory', '$ionicNavBarDelegate',
  'User', 'Http', 'ENV', 'SQLite','Cloud',
  function ($scope, $state, $ionicHistory, $ionicNavBarDelegate, User, Http, ENV, SQLite,Cloud) {

    //将下个页面作为history的root
    //$ionicHistory.nextViewOptions({
    //  disableAnimate: true,
    //  disableBack: true,
    //  historyRoot: true
    //});

    //设置restful服务器地址
    Http.setEnv(ENV.name);

    //服务器对时
    Cloud.getTimeStamp();

    //启动时,首先检查版本号
    SQLite.search('versions', '*').then(function (data) {
      //如果有存版本号,则比较版本号
      if (data.length > 0) {
        //版本号不等,删除本地数据
        if (data[0].appVer != ENV.version) {
          SQLite.deleteDb().then(function(){
            checkLogin();
          });
        }else{
          checkLogin();
        }
      } else {
        SQLite.add('versions', {
          appVer: ENV.version
        }).then(function(){
          checkLogin();
        })
      }
    }, function () {
      SQLite.deleteDb().then(function(){
        checkLogin();
      });
    })


    function checkLogin(){
      //判断用户是否登陆
      User.checkLogin().then(function () {
        $state.go('app.gamelist');
      }, function () {
        //如果没有登陆跳转至登陆也
        $state.go('login');
      })
    }

  }
]);
