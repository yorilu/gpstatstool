/**
 * Created by anders on 15/6/1.
 */

app.factory('Http', ['$q', 'SQLite', '$log', '$http', 'Storage', 'Mock',
  function($q, SQLite, $log, $http, storage, Mock) {

    var http = {


      env: '.test1',//test1 开发环境

      baseUrl: 'http://{{replace}}{{env}}.smartcourt.cn/',

      /**
       * 以post 方式发送http请求, 发送请求优先使用此方法
       * @param url
       * @param req
       * @returns {*}
       */
      post: function(url, req) {
        var q = $q.defer(),
          fullUrl = this.getFullUrl(url);
        $http.post(fullUrl, req).then(function(res) {
          var resBody = res.data;
          if (resBody.code > 0) {
            q.reject(resBody);
          } else {
            q.resolve(resBody);
          }
        }, function(res) {
          //var url = res.config.url;
          //var key = url.substr(url.lastIndexOf('/') + 1);
          //if (Mock[key]) {
          //  var dest = _.cloneDeep(Mock[key]);
          //  q.resolve({
          //    data: dest
          //  });
          //} else {
          //  q.reject(res);
          //}
          q.reject(res);
        })

        return q.promise;
      },

      /**
       * 根据访问
       * @param url
       * @returns {*}
       */
      getFullUrl: function(url) {
        var replace = url.split("-")[1].toLowerCase() + "." + url.split("-")[0].toLowerCase(),
          tempUrl = this.baseUrl.replace("{{replace}}", replace);
        tempUrl = tempUrl.replace("{{env}}", this.env);
        return tempUrl + url;
      },

      /**
       * 根据环境设置服务器域名
       * @param url
       */
      setEnv: function(env) {
        this.env = env;
      },

      /**
       * 上传赛事数据
       * @param {array} gameId 比赛ID
       * @return {function} promise
       */
      uploadGame: function(gameId) {
        var defer = $q.defer(),
          self = this,
          postData = {};

        SQLite.checkLogin().then(function(data) {
          angular.extend(postData, data);
          return data;
        }, function() {
          defer.reject('nologin');
        }).then(function() {
          return SQLite.exportGameData(gameId).then(function(data) {
            angular.extend(postData, {
              gameData: data
            });
          })
        }, function() {}).then(function() {
          // $log.debug(JSON.stringify(postData));
          return this.post('Cloud-Game-GameCommand/uploadGameData', postData);
        }).then(function(data) {
          var result = data.data;
          if (result.code > 0) {
            defer.reject(data);
          } else {
            return SQLite.setUploadFlag(gameId, postData);
          }
        }, function(data) {
          defer.reject(data);
        }).then(function(data) {
          defer.resolve(data);
        }, function(data) {
          defer.reject(data);
        });

        return defer.promise;
      },


      updateGameStatus: function(info) {
        return this.post('Cloud-Game-GameCommand/' + 'updateGameStatus', info)
      },
      addNodeScore: function(info) {
        return this.post('Cloud-Game-GameCommand/' + 'addNodeScore', info);
      },
      addBskScore: function(info) {
        return this.post('Cloud-Game-GameCommand/' + 'addRealTimeScore', info);
      },
      addFotScore: function(info) {
        return this.post('Cloud-Game-GameCommand/' + 'addRealTimeScore', info);
      },
      updateGameStatistics: function(info) {
        return this.post('Cloud-Game-GameCommand/' + 'updateGameStatistics', info);
      },
      searchStadium: function(keyword, type) {
        if ($.trim(keyword) == '') {
          return;
        }

        var param = {
          stadiumName: keyword,
          showAll: 'N',
          sportType: type || '',
          pageSize: 100,
          pageIndex: 1
        }
        return this.post('Cloud-MD-BaseData/searchStadium', param)
        l

      },
      searchCourt: function(stadiumID) {
        if (stadiumID == '') {
          return;
        }

        var param = {
          stadiumId: stadiumID
        }
        return this.post('Cloud-MD-BaseData/getCourtList', param);

      },
      uploadGameEvent: function(param) {
        return this.post('Cloud-Game-GameCommand/uploadGameEvents', param);
      },
      cancelGameEvent: function (param){
        return this.post('Cloud-Game-GameCommand/cancelGameEvent', param);
      },
      addPlayer: function(param) {
        return this.post('Cloud-Game-GameCommand/addPlayer', param)
      },
      addTeam: function(param) {
        return this.post('Cloud-Game-GameCommand/' + 'addTeam', param)
      },
      addGame: function(param) {
        return this.post('Cloud-Game-GameCommand/' + 'addGame', param)
      },
      addTeamPlayer: function(param) {
        return this.post('Cloud-Game-GameCommand/' + 'addTeamPlayer', param)
      },
      addGamePlayer: function(param) {
        return this.post('Cloud-Game-GameCommand/' + 'addGamePlayer', param)
      },
      getTeams: function() {
        var param = {
          versionNo: 0,
          showPlayer: 'Y',
          scorer: storage.account
        };
        return this.post('Cloud-Game-QueryGameData/' + 'getTeamsByScorer', param)
      },
      getPlayers: function() {
        var param = {
          versionNo: 0,
          scorer: storage.account
        };
        return this.post('Cloud-Game-QueryGameData/' + 'getPlayersByScorer', param)
      },
      getFootBallEventsStatistics: function(gameid) {
        var param = {
          gameId: gameid
        };
        return this.post('Cloud-Game-QueryGameData/' + 'getFootBallEventsStatistics', param)
      },
      getBasketballStatistics: function(gameid) {
        var param = {
          gameId: gameid
        };
        return this.post('Cloud-Game-QueryGameData/' + 'getBasketballStatistics', param)
      },
      getGameEventDescrips: function(gameid) {
        var param = {
          gameId: gameid,
          pageSize: 999,
          pageIndex: 1
        };
        return this.post('Cloud-Game-QueryGameData/' + 'getGameEventDescrips', param)
      },
      uploadLogo: function(imageURI, type) { //type----team/player
        var q = $q.defer(),
          url = 'Cloud-Game-GameCommand/uploadLogo';
        var fullUrl = this.getFullUrl(url);
        var options = new FileUploadOptions();
        options.fileKey = "logoData",
        options.fileName = imageURI.substr(imageURI.lastIndexOf('/') + 1);
        options.mimeType = "image/jpeg";
        options.params = {
          logoType: type
        }
        var success = function(res) {
            var response=JSON.parse(res.response);
          response.code > 0 ? q.reject(response) : q.resolve(response);
        }
        var error = function(res) {
          q.reject(res);
        }
        var ft = new FileTransfer();
        ft.upload(imageURI, fullUrl, success, error, options);
        return q.promise;
      }
    }

    return http;
  }
])