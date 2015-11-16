/**
 * Created by anders on 15/7/8.
 * 与云端交互类
 */

app.factory('Cloud', ['$q', 'SQLite', 'Http', 'Storage', 'Util',
    function ($q, SQLite, Http, Storage, Util) {

      var SDate = Util.Date;

      var Cloud = {

        /**
         * 根据积分员获取赛事信息
         * @param param
         */
        getGamesByScorer: function () {
          var param = {
              scorer: Storage.account,
              status: 100
            }, q = $q.defer(),
          //云端取回的比赛数据
            games = [],
            localGameMap = {},
          //本地数据GameId
            localGameIds = [[], []],
          //新增和更新的Gameid
            addAndUploadGameIds = [],
          //删除的比赛Id
            delGameIds = [];
          Http.post('Cloud-Game-QueryGameData/getGamesByScorer', param).then(function (res) {
            games = res.data;
            //将获取的比赛,分为删除的比赛和非删除的比赛, gameParts是一个数组,
            // [0]为未删除,[1]为已删除
            var gameParts = _.partition(games, function (item) {
              return item.isDel == 0;
            });
            //针对非删除的比赛,需要从数据库查一下,
            addAndUploadGameIds = _.pluck(gameParts[0], 'id');
            delGameIds = _.pluck(gameParts[1], 'id');
            //在本地查询非删除类型的比赛,如果有,则只更新比赛开始时间字段, 如果没有新增
            var searchSql = "select id,status from game where id in ('" + addAndUploadGameIds.join("','") + "')"
            return SQLite.execute(searchSql).then(function (data) {
              //localGameIds = _.pluck(data, 'id');
              _.each(data,function(item,idx){
                localGameMap[item.id] = item;
              })

              localGameIds = _.keys(localGameMap);
            })
          }, function () {
            q.reject();
          }).then(function (data) {
            //对比本地数据库和云端数据库新增/更新的记录的Id,识别出那些是新增,那些是更新
            var addGameIds = _.difference(addAndUploadGameIds, localGameIds);
            var addGames = _.filter(games, function (item) {
              return _.contains(addGameIds, item['id']);
            })
            //新增的比赛,默认都认为未开始比赛
            var newGames = [];
            _.each(addGames,function(game,idx){
              game.status = 0;
              newGames.push(game);
            })

            if (newGames.length > 0) {
              return SQLite.add('game', newGames)
            }
          }).then(function () {
            //取云端数据和本地数据交集,级更新的部分
            var updateGameIds = _.intersection(addAndUploadGameIds, localGameIds);
            var updateGames = _.filter(games, function (item) {
              return _.contains(updateGameIds, item['id']);
            })
            if (updateGames.length > 0) {
              _.each(updateGames, function (item, key) {
                var localGame = localGameMap[item.id];
                //只要本地的比赛不是已开始, 从云端同步来的比赛都认为未开始
                if(!localGame.status == '1'){
                  //delete item.status;
                  item.status = '0';
                  SQLite.update('game', item, {id: item.id});
                  SQLite.delete('gamePlayers', {'gameId': item.id});
                }
              })
            }
            // q.resolve(addAndUploadGameIds);
          }).then(function () {
            _.each(delGameIds, function (gameId, idx) {
              SQLite.delete('GAME', {'id': gameId});
            })
            q.resolve(addAndUploadGameIds);
          }, function () {
            q.reject();
          })

          return q.promise;
        },

        /**
         * 获取赛事相关的球队球员信息
         */
        getGameTeams: function (gameIds) {
          var q = $q.defer(),
            teamList = [],
            playerList = [],
            teamIds = [],
            playerIds = [],
            gamePlayers = [],
            teamMemberList = [];
          Http.post('Cloud-Game-QueryGameData/getGameTeams', gameIds).then(function (res) {
            var games = res.data;
            var teamMap = {}, playerMap = {}, teamPlayerMap = {};
            //遍历出比赛/球员关系
            _.each(games, function (game, idxg) {
              teamMap[game.homeTeam.teamId] = game.homeTeam;
              teamMap[game.guestTeam.teamId] = game.guestTeam;

              var teams = [game.homeTeam, game.guestTeam];
              _.each(teams, function (team, team_idx) {
                var players = team.players;
                _.each(players, function (player, player_idx) {

                  teamPlayerMap[team.teamId + "_" + player.id] = {
                    teamId: team.teamId,
                    playerId: player.id
                  }
                  var gamePlayer = {
                    gameId: game.gameId,
                    teamId: team.teamId,
                    playerId: player.id,
                    isFirst: player.isFirst,
                    hasPlay: player.isFirst,
                    onPlay: player.isFirst
                  };
                  gamePlayers.push(gamePlayer);

                  playerMap[player.id] = player;
                })
              })
            })


            //去除重复的球队
            var allTeamList = _.values(teamMap);
            _.each(allTeamList, function (team, index) {
              delete team.players
              team['id'] = team.teamId;
              teamList.push(team);
            })
            teamIds = _.keys(teamMap);

            //所有球员
            playerList = _.values(playerMap);
            playerIds = _.keys(playerMap);

            //球队球员关系
            teamMemberList = _.values(teamPlayerMap);
            //删除球队
            if (teamIds.length > 0) {
              var delTeamSql = "Delete from team where id in('" + teamIds.join("','") + "')";
              return SQLite.execute(delTeamSql);
            }
          }, function () {
            q.reject();
          }).then(function () {
            //删除球队/球员关系
            if (teamIds.length > 0) {
              var delTeamPlayerSql = "Delete from teamMember where teamId in('" + teamIds.join("','") + "')";
              return SQLite.execute(delTeamPlayerSql)
            }
          }).then(function () {
            //删除球员数据
            if (playerIds.length > 0) {
              var delPlayerSql = "Delete from player where id in('" + playerIds.join("','") + "')";
              return SQLite.execute(delPlayerSql);
            }
          }).then(function () {
            //删除场上球员数据
            if (gameIds.length > 0) {
              var delGamePlayerSql = "Delete from gamePlayers where gameId in ('" + gameIds.join("','") + "')";
              return SQLite.execute(delGamePlayerSql);
            }
          }).then(function () {
            return SQLite.add('team', teamList);
          }).then(function () {
            //添加球员表

            return SQLite.add('player', playerList);
          }).then(function () {
            //添加球员关系
            return SQLite.add('teamMember', teamMemberList);
          }).then(function () {
            SQLite.add('gamePlayers', gamePlayers).then(function () {
              q.resolve();
            });
          })
          return q.promise;
        },

        /**
         * 获取时间戳
         */
        getTimeStamp: function () {
          var postDate = Util.Date.now();
          var param = {
            appId: 'h5',
            clientTime: SDate.dateFormat(new Date(), 'yyyy-MM-dd hh:mm:ss')
          }
          return Http.post('Cloud-Game-QueryGameData/getTimeStamp', param).then(function (res) {
            var serverDate = res.data.serverTime;
            Util.Date.timeInterval = Util.Date.str2mm(serverDate) - postDate;
          }, function () {

          })
        },

        /**
         * 获取事件描述模板
         */
        getGameRules: function () {
          var q = $q.defer(),
            gameEventRules = [],
            rules = [],
            ruleRel = [],
          ruleItems = [];
          var param = {
            versionNo: 0
          }
          SQLite.search('versions', '*').then(function (data) {
            if (data.length > 0) {
              param.versionNo = data[0].ruleVer;
            }
          }).then(function () {
            return Http.post('Cloud-Game-QueryGameData/getGameRules', param).then(function (res) {
              var resBody = res.data,
                ruleItemMap ={};
              gameEventRules  = resBody.gameEventRules;
              //解析公共模板
              _.each(resBody.publicRulesItems,function(publicItem,pIdx){
                //ruleItems.push(publicItem);
                ruleItemMap[publicItem.templateId] = publicItem;
              });
              //解析赛事规则模板
              _.each(gameEventRules, function (item, key) {
                item.ruleId = item.ruleId + "";
                var rule = {
                  ruleId: item.ruleId,
                  ruleName: item.ruleName,
                  sportType: item.sportType
                }
                _.each(item.rulesItems, function (obj, key) {
                  ruleRel.push({
                    ruleId: item.ruleId,
                    templateId: obj.templateId
                  })
                  ruleItemMap[obj.templateId] = obj
                  //ruleItems.push(obj);
                })
                rules.push(rule);
              })

              //更新ruleItems
              ruleItems = _.values(ruleItemMap);
            })
          }).then(function () {
            if (gameEventRules.length > 0) {
              return SQLite.delete('eventRules');
            }
          }).then(function () {
            if (gameEventRules.length > 0) {
              return SQLite.delete('eventRulesRel')
            }
          }).then(function () {
            if (gameEventRules.length > 0) {
              return SQLite.delete('eventRulesItems')
            }
          }).then(function () {
            if (rules.length > 0) {
              return SQLite.add('eventRules', rules)
            }
          }).then(function () {
            if (ruleRel.length > 0) {
              return SQLite.add('eventRulesRel', ruleRel)
            }
          }).then(function () {
            if (ruleItems.length > 0) {
              return SQLite.add('eventRulesItems', ruleItems)
            }
          }).then(function () {
            q.resolve();
          },function(){
            q.reject();
          })

          return q.promise;
        },

        /**
         * 比赛结束后,将失败的事件重新上传
         * @param gameId
         */
        againUpload: function (gameId) {
          var q = $q.defer();
          SQLite.getUnuploadEventDescription(gameId)
            .then(function (data) {
              if (data.length > 0) {
                 Http.uploadGameEvent({
                  gameEvents: data
                }).then(function () {
                  SQLite.update('game', {
                    uploadFlag: 1
                  }, {
                    'id': gameId
                  }).then(function(){
                    q.resolve();
                  },function(){
                    q.reject();
                  })
                },function(){
                   q.reject();
                 })
              }else{
                q.resolve();
              }
            })

          return q.promise;
        },

        firstSync: true

      };


      return Cloud;
    }]
)
