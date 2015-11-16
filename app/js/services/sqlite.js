/**
 * @ngdoc service
 * @name sqlite
 * @description
 * _Please update the description and dependencies._
 *
 * */


app.factory('SQLite', ['$q', '$window', '$log', 'Util', 'Storage', function ($q, $window, $log, util, storage) {

  var SQLite = {

    DB_NAME: 'SC_GP',

    TABLES: {

      //记录版本号
      versions: {
        appVer: 'text default 0',
        ruleVer: 'text default 0'
      },

      //赛事表
      game: {
        id: 'text primary key',
        gameGroupId: 'int default 0',
        expectedStartTime: "datetime default (datetime('now', 'localtime'))",
        startTime: "datetime default (datetime('now', 'localtime'))",//比赛开始时间
        endTime: 'text',//比赛结束时间，如果比赛没结束，则是最后暂停时间
        gameName: "text",
        gameType: 'text',
        homeTeamId: 'text',
        guestTeamId: 'text',
        stadiumId: 'text', //测试阶段值
        stadiumName: 'text',
        courtId: 'text',
        courtName: 'text',
        remark: 'text',
        sportType: 'text',
        createTime: "datetime default (datetime('now', 'localtime'))",
        status: 'int', //0 未开始, 1正在进行, 2已结束
        teamAScore: 'int default 0',
        teamBScore: 'int default 0',
        gameEventRulesId: 'int', //事件规则Id
        liveMode: 'text',       //直播方式
        isDel: 'int',           //是否删除 0未删除,1已删除
        periodTeamAScore: 'int default 0',//小节比分 记录一下，防止重启App 导致比分错误
        periodTeamBScore: 'int default 0',
        currentPauseSec: 'text default 0',//毫秒数 最后暂停时间/小节开始结束时间
        currentPauseTimestamp: 'int',//时间戳 //最后暂停的毫秒数
        currentNodeSec: 'text default 0',//毫秒数 最近小节开始时间
        currentNodeStartAbso: 'text',//标准时间 最近小节开始绝对时间
        isPause: "int default 1",//0进行中 1暂停
        section: "int default 1", //当前第几节
        homeTeamOver: 'int default 0',
        guestTeamOver: 'int default 0'
      },

      //队伍表
      team: {
        id: 'text primary key',
        teamName: 'text',
        teamType: 'text default normal', //球队类型 普通球队normal；充数球队temp
        sportType: 'text',
        logoId: 'text',
        logoUrl: 'text',
        createTime: "datetime default (datetime('now', 'localtime'))"
      },

      //团队成员
      teamMember: {
        teamId: 'text',
        playerId: 'text',
        createTime: "datetime default (datetime('now', 'localtime'))"
      },

      //运动员表
      player: {
        id: 'text primary key',
        playerType: 'text default normal', //球队类型 普通球队normal；充数球队temp
        playerName: 'text',
        playerNumber: 'int',
        createTime: "datetime default (datetime('now', 'localtime'))",
        logoUrl: 'text'
      },

      //参赛队员表
      gamePlayers: {
        gameId: 'text',
        teamId: 'text',
        playerId: 'text',
        isFirst: 'int',
        hasPlay: 'int', //0 没有场过,1,上过场
        onPlay: 'int', //0不在场,1在场
        leave: 'int default 0' //1表示被罚下 离场
      },

      //比赛事件表 存放单次事件信息 最后用此表统计再存放到basketballStatistics
      gameEvent: {
        gameId: 'int',
        id: 'text primary key',
        competitionNode: 'text',
        eventType: 'int',
        score: 'int default 0',
        playerA: 'text',
        playerB: 'text',
        eventTime: "text",
        eventAbsoluteTime: "datetime default (datetime('now', 'localtime'))"
      },

      //存放事件描述信息.
      gameEventDesc: {
        gameId: 'int',
        eventId: 'text primary key',
        desc: 'text',
        eventTime: 'text',
        eventAbsoluteTime: "datetime default (datetime('now', 'localtime'))"
      },

      //篮球赛事统计
      basketballStatistics: {
        gameId: 'text',
        playerNumber: 'text',
        playerId: 'text',
        teamId: 'text',
        score: 'int default 0',
        twoPointShotHit: "int default 0",
        twoPointShotMiss: 'int default 0',
        threePointShotHit: "int default 0",
        threePointShotMiss: 'int default 0',
        freeThrowHit: 'int default 0',
        freeThrowMiss: 'int default 0',
        backboard: 'int default 0',
        assist: 'int default 0',
        steal: 'int default 0',
        turnover: 'int ',
        foul: 'int default 0',
        blocking: 'int default 0',
        efficiency: 'int default 0',
        freeThrowPercentage: 'int default 0',
        fieldGoalPercentage: 'int default 0',
        threePointShotPercentage: 'int default 0'
      },

      //事件描述
      gameEventDescription: {
        id: 'text primary key',
        gameId: 'text',
        competitionNode: 'text',
        eventId: 'text',

        teamAId: 'text',
        playerAId: 'text',
        playerAScore: 'text',
        homeTeamScore: 'text',

        teamBId: 'text',
        playerBId: 'text',
        playerBScore: 'text',
        guestTeamScore: 'text',

        eventTime: "text",
        eventAbsoluteTime: 'text',
        eventTimeNode: 'text',
        para1: "text",
        para2: "text",
        para3: "text"
      },
      //小节比分
      competitionNodeScore: {
        id: 'text',
        gameId: 'text',
        competitionNode: 'text',
        startTime: 'text',
        endTime: 'text',
        startAbsoluteTime: 'text',
        endAbsoluteTime: 'text',
        teamAScore: 'int',
        teamBScore: 'int'
      },

      //积分员
      scoreKeeper: {
        accountId: "text",
        password: "text",
        isLogin: 'int default 0' //0 未登陆, 1已登陆
      },

      logoLib: {
        id: "text"
      },

      //事件规则表
      eventRules: {
        ruleId: 'text',
        ruleName: 'text',
        sportType: 'text'
      },
      //事件规则关联表
      eventRulesRel: {
        ruleId: 'text',
        templateId: 'text'
      },
      //事件规则项表
      eventRulesItems: {
        templateId: "text",
        templateName: "text",
        templateContent: "text",
        secondEventTarget: "text",
        score: "int",
        parentId: "text",
        level: "int",
        orderNo: 'int'
      }
    },

    db: null,

    /**
     * 打开websql
     * @returns {null}
     */
    openDB: function () {
      if (this.db) {
        return;
      }
      try {
        if ($window.cordova) {
          this.db = $window.sqlitePlugin.openDatabase({
            name: this.DB_NAME,
            bgType: 0
          })
        } else {
          var dbSize = 10 * 1024 * 1024; //10M
          this.db = $window.openDatabase(this.DB_NAME, '1.0', this.DB_NAME, dbSize);
        }

        var sqls = [],bindings =[];
        for (var table in this.TABLES) {
            var sql = this.createTableSql(table);
            sqls.push(sql);
            bindings.push([]);
        }

        this.batchExecute(sqls,bindings).then(function(){
          SQLite.execute('select count(*) as count from logoLib').then(function (res) {
            if (res[0].count == 0) {
              var id = [];
              for (var i = 1; i <= 27; i++) {
                id.push({
                  id: i.toString()
                });
              }
              SQLite.add('logoLib', id)
            }
          });
        });
      } catch (e) {
        $log.error('openDB error');
      }
      return this.db;
    },

    /**
     * 删除数据库
     */
    deleteDb: function () {
      var q = $q.defer();
      if ($window.cordova) {
        this.db = null;
        $window.sqlitePlugin.deleteDatabase({
          name: this.DB_NAME
        })
      }
      setTimeout(function(){
        q.resolve();
      },300)
      return q.promise;
    },

    /**
     * 执行SQL语句
     * @param query
     * @param binding
     * @returns {*}
     */
    execute: function (query, binding, useGUID) {
      if (!this.db) {
        this.openDB();
      }
      var operate = query.substr(0, query.indexOf(' ')).toLowerCase();
      var q = $q.defer();
      $log.debug(query + " " + binding);

      this.db.transaction(function (tx) {
        tx.executeSql(query, binding, function (tx, result) {
            var data = 0;
            if (operate == 'select') {
              data = [];
              for (var i = 0; i < result.rows.length; i++) {
                data.push(result.rows.item(i));
              }
            } else if (operate == 'insert') {
              if (useGUID) {
                data = binding.pop();
              } else {
                data = result.insertId;
              }
            }
            q.resolve(data);
          },
          function (transaction, error) {
            $log.error(error);
            q.reject(error);
          });
      });
      return q.promise;
    },


    /**
     * 批处理执行语句
     * @param querys
     * @param bindings
     * @returns {*}
     */
    batchExecute: function (querys, bindings) {
      if (!this.db) {
        this.openDB();
      }
      var q = $q.defer();
      var finishNum = 0;

      this.db.transaction(function (tx) {
        var len = querys.length;
        for (var i =0;i<len;i++) {
          var query=querys[i];
          var binding= (bindings && bindings.length > i) ? bindings[i] :[];
          $log.debug(query + " " + binding);
          //执行每条语句
          tx.executeSql(query, binding, function (tx, result) {
              finishNum ++;
              if(finishNum == len){
                q.resolve();
              }
            },
            function (transaction, error) {
              $log.error(error);
              q.reject(error);
            });
        }
       // q.resolve();
      });

      return q.promise;
    },

    /**
     * 添加数据,允许添加多条记录
     * @param {string} table 表名
     * @param {object} data 要插入的数据
     * @returns {number} id 插入数据的索引
     * @example
     * //单条记录添加
     * SQLite.add('TEAM',{
             *   TeamName: 'text',
             *   SportType: 'text'
             *   })
     *
     * //多条记录添加
     * SQLite.add('team',[
     * {
             *    TeamName: 'hello3',
             *    SportType: 'text'
             * },{
             *       TeamName: 'world',
             *       SportType: 'text'
             *   }
     * ]);
     */
    add2: function (table, data) {
      var q = $q.defer(),
        self = this,
        insertIds = [],
        data = angular.copy(data);
      if (!data || ($.isArray(data) && data.length == 0)) {
        q.resolve('insert null');
        return q.promise;
      }
      if ($.isArray(data)) {
        (function insertOne() {
          var obj = data.splice(0, 1)[0];
          self.addOne(table, obj).then(function (insertId) {
            insertIds.push(insertId)
            if (data.length == 0) {
              q.resolve(insertIds);
            } else {
              insertOne();
            }
          }, function (transaction, error) {
            q.reject(error);
            return;
          })
        })();
        return q.promise;
      } else {
        return self.addOne(table, data);
      }
    },
    /**
     * 添加一条数据
     * @param {string} tableName 表名
     * @param {object} data 要插入的数据
     * @returns {number} id 插入数据的索引
     * @example
     * SQLite.add('TEAM',{
             *   TeamName: 'text',
             *   SportType: 'text'
             *   })
     */
    addOne: function (tableName, data) {
      var insertSql = 'INSERT INTO ' + tableName;
      var tableMeta = this.TABLES[tableName];
      var insertData = {};
      _.each(tableMeta, function (col, colName) {
        if (!_.isUndefined(data[colName])) {
          insertData[colName] = data[colName];
        }
      })

      if (!_.isUndefined(data['uploadFlag'])) {
        insertData['uploadFlag'] = data['uploadFlag'];
      }

      var cols = _.keys(insertData),
        values = _.values(insertData),
        fillArray = util.fillArray(cols.length, '?'),
        useGUID = false;
      var key = this._getTableKey(tableName);
      //只有不传主键的情况,才自动生成主键
      if (key && !data[key]) {
        cols.push(key);
        values.push(util.creatGUID());
        fillArray.push('?');
        useGUID = true;
      }

      insertSql += " ( " + cols.join(',') + ") VALUES (" + fillArray.join(',') + ")"

      return this.execute(insertSql, values, useGUID);
    },


    add:function(tableName, data) {
      var self = this,
        data = angular.copy(data),
        sqls = [],bindings = [];
      //如果为数组,生成每条记录的SQL语句
      if ($.isArray(data)) {
        _.each(data,function(item,idx){
          var stat = SQLite.createAddStatment(tableName,item);
          sqls.push(stat.sql);
          bindings.push(stat.values);
        })
      } else {
        var stat = SQLite.createAddStatment(tableName,data);
        sqls.push(stat.sql);
        bindings.push(stat.values);
      }
      return this.batchExecute(sqls,bindings);
    },

    /**
     * 生成插入语句
     * @param tableName
     * @param data
     * @returns {{sql: string, values: Array}}
     */
    createAddStatment: function(tableName, data){
      var insertSql = 'INSERT INTO ' + tableName;
      var tableMeta = this.TABLES[tableName];
      var insertData = {};
      _.each(tableMeta, function (col, colName) {
        if (!_.isUndefined(data[colName])) {
          insertData[colName] = data[colName];
        }
      })

      if (!_.isUndefined(data['uploadFlag'])) {
        insertData['uploadFlag'] = data['uploadFlag'];
      }

      var cols = [],
        values = [];
      _.each(insertData,function(value,k){
        cols.push(k);
        values.push(value+"")
      })
      var fillArray = util.fillArray(cols.length, '?');

      var key = this._getTableKey(tableName);
      //只有不传主键的情况,才自动生成主键
      if (key && !data[key]) {
        cols.push(key);
        values.push(util.creatGUID());
        fillArray.push('?');
      }

      insertSql += " ( " + cols.join(',') + ") VALUES (" + fillArray.join(',') + ")"

      return {
        sql : insertSql,
        values: values
      };
    },
    /**
     * 查询数据方法
     * @param {string} table 查询的表名
     * @param {string|array}selectData 查询数据
     * @param limiteData
     * @returns {array} result
     * @example
     *  SQLite.search('TEAM','*',{
             *      ID:3
             *      }).then(function(res){
             *      console.log(res)
             *   });
     */
    search: function (table, selectData, limiteData) {
      var sql = 'SELECT ';
      if (!selectData || selectData == '*') {
        sql += ' * ';
      } else {
        sql += selectData.join(',')
      }
      sql += ' FROM ' + table;

      var whereObj = this.createWhereSql(limiteData);
      sql += whereObj.sql;

      return this.execute(sql, whereObj.params);
    },

    /**
     * 更新数据表
     * @param table
     * @param updateData
     * @param limitData
     * @returns {*}
     * @exmple
     * SQLite.update('TEAM',{
             *   TeamName:'hello'
             * },{
             *   ID:21
             * }).then(function(res){
             *   console.log(res)
             * });
     */
    update: function (table, data, limitData) {
      var sql = 'UPDATE ' + table + ' SET ',
        params = [];

      var tableMeta = this.TABLES[table];
      var updateData = {};
      //只复制表结构有的字段
      _.each(tableMeta, function (col, colName) {
        if (!_.isUndefined(data[colName])) {
          updateData[colName] = data[colName];
        }
      })
      if (!_.isUndefined(data['uploadFlag'])) {
        updateData['uploadFlag'] = data['uploadFlag'];
      }
      for (var i in updateData) {
        sql += i + "= ? ,"
      }
      sql = sql.substring(0, sql.length - 1);

      var whereObj = this.createWhereSql(limitData);
      sql += whereObj.sql;

      params = util.values(updateData).concat(whereObj.params);


      return this.execute(sql, params);
    },

    /**
     * 删除表数据
     * @param table
     * @param limitObj
     * @returns {*}
     * @example
     *  SQLite.delete('TEAM', {
             *   ID:20
             *  }).then(function(res){
             *   console.log(res)
             *  });
     */
    delete: function (table, limitObj) {
      var sql = 'DELETE FROM ' + table,
        whereObj = this.createWhereSql(limitObj);
      sql += whereObj.sql;

      return this.execute(sql, whereObj.params);
    }

    ,


    //删除表结构
    dropTable: function () {

    },
    /**
     *
     * @param tableName
     */
    createTableSql: function (tableName) {
      var table = this.TABLES[tableName],
        sql = "";
      if (table) {
        sql = "CREATE TABLE IF NOT EXISTS " + tableName + "(";

        for (var col in table) {
          sql += col + " " + table[col] + ",";
        }
        //增加上传时间
        sql += "uploadFlag int default 0)";

      }

      //  console.log(sql);
      return sql;
    },

    /**
     * 生成Sql 语句的where 条件
     * @param limitObj
     */
    createWhereSql: function (limiteData) {
      var sql = "", index = 0,
        params = [];
      if (limiteData) {
        sql = " WHERE ";
        var keys = util.keys(limiteData),
          len = keys.length;
        for (var i in limiteData) {
          //转为字符串,做正则匹配
          var value = '' + limiteData[i],
            reg = /(^[=><]*)(\w*)/;
          var array = value.match(reg);
          var opr = array[1] ? array[1] : '=',
            data = array[2];
          params.push(data);
          sql += i + opr + "? ";
          if (index + 1 < len) {
            sql += " AND "
          }
          index++;
        }
      }

      return {
        sql: sql,
        params: params
      };

    },


    /**
     * JSON导出表中所有数据数据格式为JSON格式
     */
    exportDBtoJSON: function (exportTables, limitObj) {
      var tables = this.TABLES,
        JSON = {},
        defer = $q.defer(),
        tableKeys = exportTables ? angular.copy(exportTables) : util.keys(tables),
        self = this;
      (function selectOneTable() {
        var table = tableKeys.pop();
        self.search(table, '*', limitObj).then(function (data) {
          JSON[table] = data;
          if (tableKeys.length == 0) {
            defer.resolve(JSON);
          } else {
            selectOneTable();
          }
        }, function (transaction, error) {
          defer.reject(error);
          return;
        })
      })();

      return defer.promise;
    },

    /**
     *
     * @param gameId
     * @returns {*}
     */
    exportGameData: function (gameId) {
      var defer = $q.defer(),
        uploadData = {};
      var tables = ['gamePlayers', 'gameEvent', 'basketballStatistics',
          'gameEventDescription', 'competitionNodeScore'],
        limitObj = {
          gameId: gameId,
          uploadFlag: 0
        };

      var selTeamSql = 'select  t.* from game g ,team t ' +
        ' where (g.homeTeamId = t.id or g.guestTeamId = t.id) and g.id = ? and t.uploadFlag=0';

      var selTeamMemberSql = 'select  tm.* from game g ,team t, teamMember tm ' +
        ' where (g.homeTeamId = t.id or g.guestTeamId = t.id) and t.id= tm.teamid ' +
        ' and g.id = ?  and tm.uploadFlag=0';

      var selPlayerSql = 'select  p.* from game g ,team t, teamMember tm, player p ' +
        ' where (g.homeTeamId = t.id or g.guestTeamId = t.id)' +
        ' and t.id= tm.teamid and tm.playerId= p.id and g.id = ?  and p.uploadFlag=0';


      SQLite.exportDBtoJSON(tables, limitObj).then(function (data) {
        angular.extend(uploadData, data);
        //return data;
      }).then(function (data) {
        return SQLite.exportDBtoJSON(['game'], {
          id: gameId
        }).then(function (data) {
          angular.extend(uploadData, data);
        });
      }).then(function () {
        return SQLite.execute(selTeamSql, [gameId]).then(function (data) {
          angular.extend(uploadData, {
            team: data
          });
        });
      }).then(function () {
        return SQLite.execute(selTeamMemberSql, [gameId]).then(function (data) {
          angular.extend(uploadData, {
            teamMember: data
          });
        });
      }).then(function () {
        return SQLite.execute(selPlayerSql, [gameId]).then(function (data) {
          angular.extend(uploadData, {
            player: data
          });
        });
      }).then(function () {
        //console.log(uploadData);
        defer.resolve(uploadData)
      }, function () {
        defer.reject();
      })

      return defer.promise;
    },


    /**
     * 更新表数据的上传状态
     * @returns {*}
     */
    setUploadFlag: function (gameId, postData) {

      var tableKeys = ['gamePlayers',
          'gameEvent',
          'basketballStatistics',
          'gameEventDescription',
          'competitionNodeScore',
          'game'
        ],
        updateData = {
          uploadFlag: 1
        },
        limitData,

        defer = $q.defer(),
      //tableKeys = util.keys(tables),
        self = this;


      var data = postData.gameData,
        sqlArray = [];
      var tableArray = ['team', 'teamMember', 'player'];
      for (var i in tableArray) {
        var tableName = tableArray[i];
        var rows = data[tableName];
        for (var j in rows) {
          var row = rows[j];
          if (tableName != 'teamMember') {
            sqlArray.push({
              sql: 'update ' + tableName + ' set uploadFlag = 1 where id = ?',
              binding: [row.id]
            })
          } else {
            sqlArray.push({
              sql: 'update ' + tableName + ' set uploadFlag = 1 where teamId = ? and playerId = ?',
              binding: [row.teamId, row.playerId]
            })
          }
        }
      }


      tableKeys = tableKeys.concat(sqlArray);

      (function updateOneTable() {
        var table = tableKeys.pop();
        if (angular.isString(table)) {
          if (table == 'game') {
            limitData = {
              id: gameId
            }
          } else {
            limitData = {
              gameId: gameId
            }
          }
          self.update(table, updateData, limitData).then(function (data) {
            if (tableKeys.length == 0) {
              defer.resolve(JSON);
            } else {
              updateOneTable();
            }
          }, function (transaction, error) {
            defer.reject(error);
          })
        } else {
          SQLite.execute(table.sql, table.binding).then(function () {
            if (tableKeys.length == 0) {
              defer.resolve(JSON);
            } else {
              updateOneTable();
            }
          }, function (transaction, error) {
            defer.reject(error);
          })
        }
      })();

      return defer.promise;
    },


    _getTableKey: function (tableName) {
      var table = this.TABLES[tableName];
      for (var i in table) {
        if (table[i].indexOf('key') > 0) {
          return i;
        }
      }
      return;
    },

    getTeamLogo: function (id) {
      var q = $q.defer();
      SQLite.execute('select id from logoLib where ((select count(1) as num from team where team.logoId = logoLib.id) = 0) and id<>' + id)
        .then(function (res) {
          if (res.length > 0) {
            q.resolve(res[parseInt(Math.random() * res.length)].id);
          } else {
            SQLite.execute('select id from logoLib where id<>' + id)
              .then(function (res) {
                if (res.length > 0) {
                  q.resolve(res[parseInt(Math.random() * res.length)].id);
                } else {
                  q.resolve('1');
                }
              }, function () {
                q.resolve('1');
              })
          }
        }, function () {
          q.resolve('1');
        })
      return q.promise;
    },

    /**
     *  根据gameId 返回 事件规则
     * @param gameId
     */
    getEventRules: function () {
      return SQLite.search('eventRules', '*');
    },
    /**
     * 根据gameId 返回 事件模板
     * @param gameId
     * @returns {*|array}
     */
    getEventTemplateByGameId: function (gameId) {
      var defer = $q.defer();
      var sql1 = "select ei.* from game g, eventRulesRel er, eventRulesItems ei" +
        " where g.gameEventRulesId = er.ruleId and er.templateId = ei.templateId and g.id=?";

      var sql2 = "select ei.* from eventRulesItems ei where ei.level = 0";
      var q1 = SQLite.execute(sql1, [gameId]);
      var q2 = SQLite.execute(sql2);
      $q.all([q1, q2]).then(function (results) {
        var data = results[0].concat(results[1])
        defer.resolve(data);
      }, function () {
        defer.reject();
      })
      return defer.promise;
    },

    /**
     * 检查参加比赛的球队人数,是否满足比赛需要
     * @param game
     */
    getGamePlayerNum: function (game) {
      var q = $q.defer(), result = {
        home: 0,
        guest: 0
      };
      var getTeamPlayerNumSql = "select count(playerId) as num from gamePlayers " +
        "where gameId = ? and teamId = ? and isFirst = 1";

      SQLite.execute(getTeamPlayerNumSql, [game['id'], game.homeTeamId]).then(function (data) {
        result.home = data[0].num;
      }).then(function () {
        SQLite.execute(getTeamPlayerNumSql, [game['id'], game.guestTeamId]).then(function (data) {
          result.guest = data[0].num;
          q.resolve(result);
        })
      })

      return q.promise;
    },

    /**
     * 返回未上传的事件描述
     * @param gameId
     */
    getUnuploadEventDescription: function (gameId) {
      var sql = "select * from gameEventDescription where  gameId =? and uploadFlag = 0";
      return SQLite.execute(sql, [gameId]);
    }

  };

  return SQLite;

}])


