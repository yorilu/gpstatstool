/**
 * Created by anders on 15/6/1.
 */
define(['app', 'util'], function (app, util) {
    return app.factory('http', ['$q', 'SQLite', '$log', '$http','storage', function ($q, SQLite, $log, $http,storage) {

        serverUrl = 'http://md.cloud.dev.smartcourt.cn/Cloud-Game-GameData/';

        var http = {

            /**
             * 用户登陆
             * @param userName
             * @param password
             */
            login: function (data) {
                var q = $q.defer(), self = this;
                if(!data){
                    q.reject();
                }else{
                    storage.userInfo = data;
                    SQLite.delete('scoreKeeper').then(function(data){
                        SQLite.add('scoreKeeper', storage.userInfo).then(function(data){
                            q.resolve(storage.userInfo);
                        },function(){
                            q.reject();
                        })
                    });
                }
                return q.promise;
            },


            /**
             * 上传赛事数据
             * @param {array} gameId 比赛ID
             * @return {function} promise
             */
            uploadGame: function (gameId) {
                var defer = $q.defer(),
                    self = this,
                    postData = {};

                SQLite.checkLogin().then(function (data) {
                    angular.extend(postData,data);
                    return data;
                }, function () {
                    defer.reject('nologin');
                }).then(function () {
                    return SQLite.exportGameData(gameId).then(function(data){
                        angular.extend(postData,{gameData:data});
                    })
                    },function(){

                }).then(function(){
                    $log.debug(JSON.stringify(postData));
                    $http.post(serverUrl+'/UploadGameData',postData);
                });

                return defer.promise;
            }


        }

        return http;
    }])
})