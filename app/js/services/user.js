/**
 * Created by anders on 15/7/8.
 * 用户登陆类
 */

app.factory('User', ['$q', 'SQLite', 'Storage', 'Http', function ($q, SQLite, Storage, Http) {

    var user = {

      /**
       * 检查用户是否登陆
       * @returns {*}
       */
      checkLogin: function () {
        var q = $q.defer(),
          self = this;
        if (Storage.account) {
          q.resolve(Storage.account);
        }
        //检查是否登陆
        SQLite.search('scoreKeeper', '*', {isLogin: 1}).then(function (data) {
          if (data.length > 0) {
            Storage.account = data[0].accountId;
            q.resolve(Storage.accountId);
          } else {
            q.reject();
          }
        }, function () {
          q.reject();
        })
        return q.promise;
      },

      /**
       * 用户登陆
       */
      login: function (data) {
        var q = $q.defer();
        var userInfo = {
          accountId: data.account,
          password: md5(data.password)
        }

        Http.post('Cloud-User-Authentication/login', userInfo)
          .then(function (res) {
            Storage.account = data.account;
            return SQLite.search('scoreKeeper', '*', {isLogin: 0});
          }, function () {
            q.reject();
          }).then(function (result) {
            if (result && result.length > 0) {
              if (result[0].accountId != Storage.account) {
                return SQLite.deleteDb();
              } else {
                return SQLite.delete('scoreKeeper',{accountId:Storage.account});
              }
            }
          }, function () {
            q.reject();
          }).then(function () {
            userInfo.isLogin = 1;
            return SQLite.add('scoreKeeper', userInfo);
          }).then(function(){
            q.resolve(Storage.account)
          },function(){
            q.reject();
          });

        return q.promise;
      },

      /**
       * 用户注销
       */
      logout: function () {
        //SQLite.delete('scoreKeeper')
        SQLite.update('scoreKeeper', {
          isLogin: 0
        })
      }
    };

    return user;
  }]
)
