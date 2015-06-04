/**
 * @ngdoc service
 * @name sqlite
 * @description
 * _Please update the description and dependencies._
 *
 * */

define(['app', 'util','storage'], function (app, util) {
    return app.factory('SQLite', ['$q', '$window', '$log', 'util','storage', function ($q, $window, $log, util,storage) {

        var SQLite = {

            DB_NAME: 'SC_GP',

            TABLES: {
                //赛事表
                game: {
                    id: 'text primary key',
                    gameGroupId: 'int',
                    startTime: 'int',
                    endTime: 'int',
                    gameName: 'text',
                    gameType: 'text',
                    homeTeamId: 'text',
                    guestTeamId: 'text',
                    stadiumId: 'int',
                    stadiumName: 'text',
                    courtId: 'int',
                    courtName: 'text',
                    remark: 'text',
                    sportType: 'text',
                    createTime: "datetime default (datetime('now', 'localtime'))",
                    status: 'int',  //0 未开始, 1正在进行, 2已结束
                    teamAScore: 'int',
                    teamBScore: 'int'
                },

                //队伍表
                team: {
                    id: 'text primary key',
                    teamName: 'text',
                    teamType: 'text default normal' ,  //球队类型 普通球队normal；充数球队temp
                    sportType: 'text',
                    logoId: 'text default "03" ',
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
                    playerType: 'text default normal' ,  //球队类型 普通球队normal；充数球队temp
                    playerName: 'text',
                    playerNumber: 'int',
                    createTime: "datetime default (datetime('now', 'localtime'))",
                    headPhotoUrl: 'text'
                },

                //参赛队员表
                gamePlayers: {
                    gameId: 'text',
                    teamId: 'text',
                    playerId: 'text',
                    isFirst: 'int',
                    onPlay: 'int' //0不在场,1在场
                },

                //比赛事件表
                gameEvent: {
                    gameId: 'int',
                    eventId: 'text primary key',
                    competitionNode: 'text',
                    eventType: 'int',
                    score: 'int default 0',
                    playerA: 'text',
                    playerB: 'text',
                    eventTime: "datetime default (datetime('now', 'localtime'))",
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
                    playerId: 'text',
                    score:'int default 0',
                    twoPointShotHit: "int",
                    twoPointShotMiss: 'int',
                    threePointShotHit: "int",
                    threePointShotMiss: 'int',
                    threePointShotHit: "int",
                    backboard: 'int',
                    freeThrowShotHit: 'int',
                    freeThrowShotMiss: 'int',
                    assist:'int',
                    steal:'int',
                    turnover:'int',
                    foul:'int',
                    blocking:'int',
                    efficiency:'int',
                    freeThrowPercentage:'int',
                    fieldGoalPercentage:'int',
                    threePointShotPercentage:'int'
                },

                //事件描述
                gameEventDescription:{
                    id:'text primary key',
                    gameId: 'int',
                    eventId: 'text',
                    competitionNode: 'text',
                    eventTime: "datetime default (datetime('now', 'localtime'))",
                    ventAbsoluteTime:'text',
                    descriptionTemplateId:"int default 0",
                    para1:"text",
                    param2:"text"
                },
                //模板表
                eventDescriptionTemplate:{
                    templateId:"int",
                    templateName:"text",
                    templateContent:"text"
                },

                //积分员
                scoreKeeper: {
                    account: "text",
                    password: "text"
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
                        var dbSize = 10 * 1024 * 1024;//10M
                        this.db = $window.openDatabase(this.DB_NAME, '1.0', this.DB_NAME, dbSize);
                    }

                    for (var table in this.TABLES) {
                        var sql = this.createTableSql(table);
                        this.execute(sql);
                    }

                } catch (e) {
                    $log.error('openDB error');
                }
                return this.db;
            },

            /**
             * 执行SQL语句
             * @param query
             * @param binding
             * @returns {*}
             */
            execute: function (query, binding,useGUID) {
                if (!this.db) {
                    this.openDB();
                }
                var operate = query.substr(0, query.indexOf(' ')).toLowerCase();
                var q = $q.defer();
                this.db.transaction(function (tx) {
                    tx.executeSql(query, binding, function (tx, result) {
                            var data = 0;
                            if (operate == 'select') {
                                data = [];
                                for (var i = 0; i < result.rows.length; i++) {
                                    data.push(result.rows.item(i));
                                }
                            } else if (operate == 'insert') {
                                if(useGUID){
                                    data = binding.pop();
                                }else{
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
            add: function (table, data) {
                var q = $q.defer(),
                    self = this,
                    insertIds = [],
                    data = angular.copy(data);
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
            }
            ,
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
                var cols = util.keys(data),
                    values = util.values(data),
                    fillArray = util.fillArray(cols.length, '?'),
                    useGUID = false;
                var key = this._getTableKey(tableName);
                if (key) {
                    cols.push(key);
                    values.push(util.creatGUID());
                    fillArray.push('?');
                    useGUID = true;
                }

                insertSql += " ( " + cols.join(',') + ") VALUES (" + fillArray.join(',') + ")"
                console.log(insertSql + " " + values);
                return this.execute(insertSql, values, useGUID);
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
                $log.log(sql);
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
            update: function (table, updateData, limitData) {
                var sql = 'UPDATE ' + table + ' SET ', params = [];

                for (var i in updateData) {
                    sql += i + "= ? ,"
                }
                sql = sql.substring(0, sql.length - 1);

                var whereObj = this.createWhereSql(limitData);
                sql += whereObj.sql;

                params = util.values(updateData).concat(whereObj.params);

                $log.log(sql + " " + params);
                return this.execute(sql, params);
            }
            ,

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
                $log.debug(sql + " " + whereObj.params);
                return this.execute(sql, whereObj.params);
            }

            ,


            //删除表结构
            drop: function () {

            }
            ,
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
                var sql = "", params = [];
                if (limiteData) {
                    sql = " WHERE ",index = 0;
                    var keys = util.keys(limiteData),
                        len = keys.length;
                    for (var i in limiteData) {
                        //转为字符串,做正则匹配
                        var value = '' + limiteData[i],
                            reg = /(^[=><]*)(\w*)/;
                        var array = value.match(reg);
                        var opr = array[1] ? array[1] : '=', data = array[2];
                        params.push(data);
                        sql += i + opr + "? ";
                        if (index + 1 < len) {
                            sql += " AND "
                        }
                        index ++;
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
             * 更新表数据的上传状态
             * @returns {*}
             */
            setUploadFlag: function (exportTables) {
                var tables = this.TABLES,
                    updateData = {
                        uploadFlag: 1
                    },
                    defer = $q.defer(),
                    tableKeys = exportTables ? angular.copy(exportTables) : util.keys(tables),
                    self = this;

                (function updateOneTable() {
                    var table = tableKeys.pop();
                    var obj = {};
                    //JSON[table] ={};
                    self.update(table, updateData).then(function (data) {
                        if (tableKeys.length == 0) {
                            defer.resolve(JSON);
                        } else {
                            updateOneTable();
                        }
                    }, function (transaction, error) {
                        defer.reject(error);
                        return;
                    })
                })();

                return defer.promise;
            },

            checkLogin: function () {
                var q = $q.defer(), self = this;
                if (storage.userInfo) {
                    q.resolve(storage.userInfo);
                }
                SQLite.search('scoreKeeper', '*').then(function (data) {
                    if (data.length > 0) {
                        storage.userInfo = {
                            account: data[0].account,
                            password: data[0].password
                        };
                        q.resolve(storage.userInfo);
                    } else {
                        q.reject();
                    }
                }, function () {
                    q.reject();
                })
                return q.promise;
            },

            exportGameData: function (gameId) {
                var defer = $q.defer(), uploadData = {};
                var tables = ['gamePlayers', 'gameEvent', 'basketballStatistics'],
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
                        angular.extend(uploadData, {team: data});
                    });
                }).then(function () {
                    return SQLite.execute(selTeamMemberSql, [gameId]).then(function (data) {
                        angular.extend(uploadData, {teamMember: data});
                    });
                }).then(function () {
                    return SQLite.execute(selPlayerSql, [gameId]).then(function (data) {
                        angular.extend(uploadData, {player: data});
                    });
                }).then(function () {
                    console.log(uploadData);
                    defer.resolve(uploadData)
                }, function () {
                    defer.reject();
                })

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
            }

        };

        return SQLite;

    }])

});




