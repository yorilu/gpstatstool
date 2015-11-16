/**
 * Created by anders on 15/7/8.
 * 登陆controller
 */

app.controller('LoginCtrl', ['$scope', '$state', '$ionicNavBarDelegate', '$ionicHistory',
  '$ionicLoading', 'User', 'Util','Network',
  function ($scope, $state, $ionicNavBarDelegate, $ionicHistory, $ionicLoading, User, Util,Network) {

    $scope.loginData = {};

    //执行登陆操作
    $scope.login = function () {

      //如果离线, 提示用户
      if(Network.isOffline()){
        Util.UI.showLoading('未连接网络,请连接网络后重试.', 1000);
        return;
      }
      var userInfo = $scope.loginData,
        msg = "",
        self = this;

      if (!userInfo.account) {
        msg = "请输入账号";
      } else if (!userInfo.password) {
        msg = "请输入密码";
      }

      if (msg != "") {
        Util.UI.showLoading(msg, 1000);
      } else {
        Util.UI.showLoading();
        User.login(userInfo).then(function () {
          Util.UI.hideLoading();
          //将下个页面作为history的root--danny
          //$ionicHistory.nextViewOptions({
          //  disableBack: true,
          //  historyRoot: true
          //});
          $state.go('app.gamelist');
        }, function () {
           Util.UI.hideLoading();
          Util.UI.showLoading('账号或密码不正确', 1000);
        })
      }
    };


    /**
     * 每次进入登陆页,都需要隐藏header
     */
    $scope.$on('$ionicView.beforeEnter', function () {
      $scope.loginData = {};
    })
  }
]);
