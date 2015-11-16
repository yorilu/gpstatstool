app.controller('GameCtrl', ['$rootScope', '$scope', 'Util', '$ionicActionSheet', '$ionicPopup', '$ionicPopover', 'SQLite', '$state', '$stateParams', '$ionicHistory', '$q', 'Http', '$ionicLoading',
  function ($rootScope, $scope, util, $ionicActionSheet, $ionicPopup, $ionicPopover, SQLite, $state, $stateParams, $ionicHistory, $q, http, $ionicLoading) {
    $scope.util = util;
    $scope.http = http;
    var STRING = {
      START: "开始比赛",
      PAUSE: "暂停比赛",
      CONFIRM: "确认",
      CANCEL: "取消",
      CHOOSE_OPERATE: "选择暂停原因",
      HOME_TEAM_SUBSTITUTION: '主队换人',
      VISIT_TEAM_SUBSTITUTION: '客队换人',
      SECTION_OVER: '本节结束',
      HALF_GAME_OVER: '半场结束',
      ALL_GAME_OVER: '全场结束',
      GAME_OVER: '结束比赛',
      UPLOAD_GAME_DATA: '确认结束本场比赛，上传赛事数据！',
      ADMIN_MODIFY_SCORE: "记分员xxx 17:37:37执行纠正比分操作，操作前为10：10操作后10：20"
    }

    var TEAM_MIN_HEIGHT = 300;
    $(function () {

      var init = function () {
        var wheelVal = [];
        for (var i = 0; i < 151; i++) {
          wheelVal.push(i);
        }
        //纠正比分
        $("#J_Scroller").mobiscroll().scroller({
          theme: 'mobiscroll',
          display: 'top',
          theme: 'ios', // Specify theme like: theme: 'ios' or omit setting to use default
          mode: 'scroller',
          minWidth: 100,
          closeOnOverlay: false,
          showLabel: false,
          headerText: function (info) {
            return $scope.teamData.left.teamName + " " + info.split(" ")[0] + ":" + info.split(" ")[1] + " " + $scope.teamData.right.teamName;
          },
          onClose: function (inst) {
            setTimeout(function () {
              $("#J_Scroller").val("纠正比分");
              uploadScore();
            }, 50)
          },
          onBeforeShow: function (inst) {
            inst.setArrayVal([$scope.leftScore, $scope.rightScore]);
          },
          buttons: [
            {
              text: STRING.CONFIRM,
              handler: function (event, inst) {
                $("#J_Scroller").mobiscroll('cancel');
                var v = inst.getVal().split(" ");

                var _left = $scope.leftScore;
                var _right = $scope.rightScore;
                $scope.leftScore = parseInt(v[0]);
                $scope.rightScore = parseInt(v[1]);
                //计算纠正比分的分数差，小节统计的时候也要加上。
                $scope.periodLeftScore += ($scope.leftScore - _left);
                $scope.periodRightScore += ($scope.rightScore - _right);
                //纠正比分后去掉撤销事件。
                $scope.eventStr = "";

                //如果暂停后(不是由于换人的暂停)纠正比分，则修正的比分为刚暂停前的小节;
                if (!timer.ing && !$scope.isChangePause) {
                  var promise = SQLite.update("competitionNodeScore", {
                    teamAScore: $scope.periodLeftScore,
                    teamBScore: $scope.periodRightScore,
                  }, {
                    gameId: matchID,
                    competitionNode: "B" + ($scope.section - 1),
                  })
                }

                $scope.$apply();
                updateGameTabel();
              }
            },
            {
              text: STRING.CANCEL,
              handler: function (event, inst) {
                $("#J_Scroller").mobiscroll('cancel');
              }
            }
          ],
          wheels: [[
            {
              label: "teama",
              keys: wheelVal,
              values: wheelVal
            },
            {
              label: "teamb",
              keys: wheelVal,
              values: wheelVal
            }
          ]]
        });

        $scope._mobiscroll = $("#J_Scroller").mobiscroll('getInst');
        $scope._mobiscroll.disable();
      }

      function showNoWait() {
        $ionicLoading.show({
          template: '没有可换的替补',
          duration: 1000
        });
      }

      var $timer = $(".J_Timer");
      var timer = {
        time: 0,
        intervalHandler: null,
        ing: false,
        setTime: function (ms) {
          this.time = ms;
          var time = this.formatTime(this.time);
          $timer.html(time);
        },
        getTime: function () {
          return this.time.toFixed(1);
        },
        formatTime: function (mms) {
          var hour = Math.floor(mms / 3600);
          hour = (hour + "").length == 1 ? "0" + hour : hour;
          var min = Math.floor(mms % 3600 / 60);
          min = (min + "").length == 1 ? "0" + min : min;
          var sec = Math.floor(mms % 3600 % 60);
          sec = (sec + "").length == 1 ? "0" + sec : sec;
          var ms = mms.toFixed(1).split(".")[1];
          return hour + ":" + min + ":" + sec + "." + ms;
        },
        start: function (ms) {
          $scope.pause = false;
          var that = this;
          this.ing = true;
          $scope.timerStr = STRING.PAUSE;
          if (this.intervalHandler) {
            clearInterval(this.intervalHandler);
          }
          this.intervalHandler = setInterval(function () {
            that.time += .1;
            var time = that.formatTime(that.time);
            $timer.html(time);
          }, 100)
        },
        stop: function () {
          $scope.pause = true;
          this.ing = false;
          $scope.timerStr = STRING.START;
          // $scope.$apply();
          clearInterval(this.intervalHandler);
        }
      }

      $scope.showLeftTeam = true;
      $scope.showRightTeam = true;
      $scope.showFirstSetp = false;
      $scope.showSecSetp = false;
      $scope.leftScore = 0;
      $scope.rightScore = 0;
      //每小节的队伍得分统计 zhangshubin
      $scope.periodLeftScore = 0;
      $scope.periodRightScore = 0;
      $scope.isChangePause = false;

      $scope.section = 1;

      $scope.timerStr = STRING.START;
      $scope.pause = true;

      var resumeTime = function (status, isPause, currentPauseTime, currentPauseTimeAbso) {
        var sql = "select currentPauseTime,currentPauseTimeAbso,isPause,status from game where id='" + matchID + "'";
        SQLite.execute(sql).then(function (data) {
          data = data[0];
          if (data.status == 1) {
            if (!data.isPause) {
              var time = parseFloat(data.currentPauseTime);
              var d = (new Date) - (new Date(data.currentPauseTimeAbso));

              time = time + d / 1000;
              timer.setTime(time);
              timer.start();
            } else {
              timer.setTime(parseFloat(data.currentPauseTime));
            }
          }
        });
      }

      var resume = function () {
        if (location.hash.indexOf("/game/") == -1) {
          return;
        }
        resumeTime();
      }
      $(document).off("resume", resume);
      $(document).on("resume", resume);

      /*init*/
      var matchID = $stateParams.matchID;
      var getGameSql = "select a.periodTeamAScore,a.periodTeamBScore,b.hasPlay,a.currentNodeStart,a.currentNodeStartAbso,a.isPause,a.section,a.status,a.teamAScore,a.teamBScore,a.hometeamid,a.guestteamid,a.gameType," +
        "b.gameid,b.teamid,b.playerid,b.isfirst,b.onplay," +
        "c.teamname," +
        "d.PlayerName,d.PlayerNumber " +
        "from game a,gameplayers b,Team c,Player d " +
        "where a.id = b.gameid and b.teamid = c.id and d.id = b.playerID and a.id = '" + matchID + "'";
      var teamData;
      SQLite.execute(getGameSql).then(function (data) {
        if (data.length > 0) {
          var dataZero = data[0];
          var guestTeamId = dataZero.guestTeamId;
          var homeTeamId = dataZero.homeTeamId;
          var homeTeam;
          var guestTeam;
          $scope.gameType = dataZero.gameType;
          $scope.leftScore = dataZero.teamAScore;
          $scope.rightScore = dataZero.teamBScore;
          $scope.status = dataZero.status;
          $scope.section = dataZero.section;
          $scope.currentNodeStart = dataZero.currentNodeStart; //当前小节开始相对时间
          $scope.currentNodeStartAbso = dataZero.currentNodeStartAbso //当前小节开始绝对时间
          $scope.homeTeamId = homeTeamId;
          $scope.guestTeamId = guestTeamId;
          $scope.periodLeftScore = dataZero.periodTeamAScore;
          $scope.periodRightScore = dataZero.periodTeamBScore;

          resumeTime();

          teamData = {
            left: {
              teamName: "",
              member: {},
              wait: {}
            },
            right: {
              teamName: "",
              member: {},
              wait: {}
            }
          }

          function addMember(memberNode, item) {
            memberNode[item.playerNumber] = item;
          }

          $.each(data, function (index, item) {
            if (item.teamId == homeTeamId) {
              teamData.left.teamName = item.teamName;
              if (item.onPlay) {
                addMember(teamData.left.member, item);
              } else {
                addMember(teamData.left.wait, item);
              }

            } else {
              teamData.right.teamName = item.teamName;
              if (item.onPlay) {
                addMember(teamData.right.member, item);
              } else {
                addMember(teamData.right.wait, item);
              }
            }
          })
          $scope.teamData = teamData;
          init();
          //只有比赛进行中才能使用调节比分
          if ($scope.status == 1) {
            $scope._mobiscroll.enable();
          }
        } else {
          var confirmPopup = $ionicPopup.confirm({
            title: '读取比赛数据失败',
            buttons: [
              {
                text: '返回',
                type: 'button-positive',
                onTap: function (e) {
                  $scope.backMatchList();
                }
              }
            ]
          });
        }
      })
      $scope.backMatchList = function () {
        var v = {},
          _historyView = $ionicHistory.viewHistory().views;
        for (var view in _historyView) {
          if (_historyView[view].stateName == 'app.gamelist') {
            v = _historyView[view];
            break;
          }
        }
        if (v) {
          $ionicHistory.backView(v);
        }
        $ionicHistory.goBack();
      }
      $scope.toggleTimer = function () {
        if (timer.ing) {
          //timer.stop();
          var btns = [{
            text: STRING.HOME_TEAM_SUBSTITUTION
          }, {
            text: STRING.VISIT_TEAM_SUBSTITUTION
          }, {
            text: STRING.SECTION_OVER
          }]

          var hideHandler = $ionicActionSheet.show({
            buttons: btns,
            titleText: STRING.CHOOSE_OPERATE,
            cancelText: STRING.CANCEL,
            destructiveText: STRING.ALL_GAME_OVER,
            destructiveButtonClicked: function () {
              var showPopup = function () {
                var confirmPopup = $ionicPopup.confirm({
                  title: STRING.GAME_OVER,
                  template: STRING.UPLOAD_GAME_DATA,
                  buttons: [
                    {
                      text: STRING.CONFIRM,
                      type: 'button-positive',
                      onTap: function (e) {
                        timer.stop();
                        $ionicLoading.show({
                          template: '赛事数据上传中....'
                        });
                        addDesc({
                          tid: 22,
                          p1: $scope.section + "",
                          p2: "",
                          desc: "第" + $scope.section + "节结束"
                        }, true)

                        uploadNodeScore();
                        var p = updateGameTabel(true);
                        p.then(function () {
                          var ps = statistics(function (pros) {
                            pros.then(function () {

                              SQLite.checkLogin().then(function () {
                                var date = $scope.util.dateFormat((new Date()), "yyyy-MM-dd hh:mm:ss");
                                /*
                                 http.updateGameStatus({
                                 id:matchID,
                                 status:2,
                                 startTime: date
                                 })
                                 */
                                //上传比赛数据
                                http.uploadGame(matchID).then(function (data) {
                                  confirmPopup.close();
                                  $ionicLoading.hide();
                                  $scope.backMatchList();
                                }, function () {
                                  $ionicPopup.confirm({
                                    title: "上传失败",
                                    template: "请稍后重试！",
                                    buttons: [
                                      {
                                        text: STRING.CONFIRM,
                                        type: 'button-positive',
                                        onTap: function (e) {
                                          $scope.backMatchList();
                                        }
                                      }
                                    ]
                                  })
                                  $ionicLoading.hide();
                                });
                              }, function () {
                                $ionicLoading.hide();
                                $rootScope.noLogin = false;
                                $scope.backMatchList();
                              });
                            })
                          });
                        })
                      }
                    },
                    {
                      text: STRING.CANCEL
                    }
                  ]
                });
              }

              hideHandler();
              showPopup();
            },
            buttonClicked: function (index) {
              showNormal();
              hideHandler();
              var end = "";
              timer.stop();
              switch (index) {
                case 0:
                  //home team substitution
                  $scope.isChangePause = true;
                  if ($.isEmptyObject(teamData.left.wait)) {
                    showNoWait();
                    return;
                  }
                  $scope.cStep = 'change';
                  showSideTeam(true, null, true);
                  break;
                case 1:
                  //guest team substitution
                  $scope.isChangePause = true;
                  if ($.isEmptyObject(teamData.right.wait)) {
                    showNoWait();
                    return;
                  }
                  $scope.cStep = 'change';
                  showSideTeam(false, null, true);
                  break;
                case 2:
                  //section over
                  addDesc({
                    tid: 22,
                    p1: $scope.section + "",
                    p2: "",
                    desc: "第" + $scope.section + "节结束"
                  }, true)
                  $scope.isChangePause = false;

                  //先上传当前小节比分，小节再自加，再更新至game表为下一小节.
                  uploadNodeScore();
                  $scope.section++;
                  $scope.eventStr = "";
                  updateGameTabel();
                  break;
              }
              updateGameStatus();
            }
          });
        } else {
          timer.start();
          showNormal();
          var date = $scope.util.dateFormat((new Date()), "yyyy-MM-dd hh:mm:ss");
          /*
           if($scope.status ==0){
           http.updateGameStatus({
           id:matchID,
           status:1,
           startTime: date
           })
           }
           */
          if ($scope.status == 0) {
            $scope._mobiscroll.enable();
          }

          if ($scope.isChangePause) {
            //如果是换人的暂停，则一下操作都不做
            return;
          }

          updateGameStatus(true);

          //重置小节得分 zhansgshubin
          $scope.periodLeftScore = $scope.periodRightScore = 0;

          addDesc({
            tid: 21,
            p1: $scope.section + "",
            p2: "",
            desc: "第" + $scope.section + "节开始"
          })
        }
      }

      var getPlayerIsdFromTeamData = function () {
        var palyerId = [];

        function g(tar) {
          $.each(tar, function (index, item) {
            if (item.hasPlay) {
              palyerId.push(item);
            }
          })
        }

        g(teamData.left.member);
        g(teamData.left.wait);
        g(teamData.right.member);
        g(teamData.right.wait);

        return palyerId;
      }

      var is11 = function () {
        return $scope.gameType == '1v1';
      }

      var uploadScore = function () {
        var date = $scope.util.dateFormat((new Date()), "yyyy-MM-dd hh:mm:ss");
        var promise = http.addBskScore({
          gameId: matchID,
          eventTime: timer.getTime(),
          eventAbsoluteTime: date,
          teamAScore: $scope.leftScore,
          teamBScore: $scope.rightScore
        })
      }

      var updateGameStatus = function (isStart) {
        var date = $scope.util.dateFormat((new Date()), "yyyy-MM-dd hh:mm:ss");
        var param = {
          isPause: $scope.pause ? 1 : 0,
          currentPauseTime: timer.getTime(),//最后一次记录相对比赛时间 毫秒数
          currentPauseTimeAbso: (new Date).getTime()//最后一次绝对比赛时间 时间戳
        }

        if ($scope.status == 0) {
          param.startTime = date,
            param.status = 1;
          $scope.status = 1;
        }

        if (isStart) {
          param.currentNodeStart = $scope.currentNodeStart = timer.getTime();//当前小节开始相对时间
          param.currentNodeStartAbso = $scope.currentNodeStartAbso = date;//当前小节开始绝对时间
        }

        var promise = SQLite.update("game", param, {
          id: matchID
        })
        return promise;
      }

      var uploadNodeScore = function () {
        var date = $scope.util.dateFormat((new Date()), "yyyy-MM-dd hh:mm:ss");

        var obj = {
          id: matchID,
          gameId: matchID,
          competitionNode: "B" + $scope.section,
          startTime: $scope.currentNodeStart,
          endTime: timer.getTime(),
          startAbsoluteTime: $scope.currentNodeStartAbso,
          endAbsoluteTime: date,
          teamAScore: $scope.periodLeftScore,
          teamBScore: $scope.periodRightScore
        }

        var promise = SQLite.add("competitionNodeScore", obj);

        http.addNodeScore(obj)
      }

      var updateGameTabel = function (isOver) {
        var date = $scope.util.dateFormat((new Date()), "yyyy-MM-dd hh:mm:ss");
        var promise = SQLite.update("game", {
          endTime: date,
          teamAScore: $scope.leftScore,
          teamBScore: $scope.rightScore,
          periodTeamAScore: $scope.periodLeftScore,
          periodTeamBScore: $scope.periodRightScore,
          status: isOver ? 2 : 1,
          section: $scope.section
        }, {
          id: matchID
        })

        return promise;
      }

      var updatePlayer = function (info, memberInfo) {
        memberInfo.hasPlay = info.hasPlay;
        var promise = SQLite.update("gamePlayers", {
          hasPlay: info.hasPlay
        }, {
          gameId: matchID,
          teamId: info.teamId,
          playerId: info.playerId
        })
      }

      var statistics = function (callback) {
        //统计
        var ids = getPlayerIsdFromTeamData();
        var firPors = [];
        var secPors = [];
        $.each(ids, function (id, item) {
          var promise = SQLite.search("gameEvent", "*", {
            gameId: matchID,
            playerA: item.playerId
          })
          firPors.push(promise);
          promise.then(function (data) {

            var ret = {
              gameId: "",
              playerId: "",
              teamId: "",
              playerNumber: "",
              score: 0,
              twoPointShotHit: 0,
              twoPointShotMiss: 0,
              threePointShotHit: 0,
              threePointShotMiss: 0,
              freeThrowHit: 0,
              freeThrowMiss: 0,
              backboard: 0,
              assist: 0,
              steal: 0,
              turnover: 0,
              foul: 0,
              blocking: 0,
              efficiency: 0,
              freeThrowPercentage: 0,
              fieldGoalPercentage: 0,
              threePointShotPercentage: 0
            }

            //2分球；3分球；罚球；篮板；助攻；抢断；失误；犯规；盖帽
            $.each(data, function (index, item) {
              ret.score += item.score;
              switch (item.eventType) {
                case 0:
                  if (item.score > 0) {
                    ret.twoPointShotHit++;
                  } else {
                    ret.twoPointShotMiss++;
                  }
                  break;
                case 1:
                  if (item.score > 0) {
                    ret.threePointShotHit++;
                  } else {
                    ret.threePointShotMiss++;
                  }
                  break;
                case 2:
                  if (item.score > 0) {
                    ret.freeThrowHit++;
                  } else {
                    ret.freeThrowMiss++;
                  }
                  break;
                case 3:
                  ret.backboard++;
                  break;
                case 4:
                  ret.assist++;
                  break;
                case 5:
                  ret.steal++
                  break;
                case 6:
                  ret.turnover++;
                  break;
                case 7:
                  ret.foul++;
                  break;
                case 8:
                  ret.blocking++;
                  break;
              }
            })

            if ((ret.freeThrowHit + ret.freeThrowMiss) != 0) {
              ret.freeThrowPercentage = ret.freeThrowHit / (ret.freeThrowHit + ret.freeThrowMiss);
              ret.freeThrowPercentage = formatNumber(ret.freeThrowPercentage);
            }


            if ((ret.threePointShotHit + ret.threePointShotMiss) != 0) {
              ret.threePointShotPercentage = ret.threePointShotHit / (ret.threePointShotHit + ret.threePointShotMiss);
              ret.threePointShotPercentage = formatNumber(ret.threePointShotPercentage);
            }


            var shotHit = ret.twoPointShotHit + ret.threePointShotHit + ret.freeThrowHit;
            var allShot = ret.twoPointShotHit + ret.threePointShotHit + ret.freeThrowHit + ret.twoPointShotMiss + ret.threePointShotMiss + ret.freeThrowMiss;

            if (allShot != 0) {
              ret.fieldGoalPercentage = shotHit / allShot;
              ret.fieldGoalPercentage = formatNumber(ret.fieldGoalPercentage);
            }

            ret.efficiency = ret.score + ret.backboard + 1.4 * ret.assist + ret.steal + 1.4 * ret.blocking - 0.7 * ret.turnover + shotHit + 0.5 * ret.threePointShotHit - 0.8 * (allShot - shotHit) + 0.25 * ret.freeThrowHit - 0.8 * ret.freeThrowMiss;
            ret.efficiency = formatNumber(ret.efficiency);

            ret.gameId = matchID;
            ret.playerId = item.playerId;
            ret.teamId = item.teamId;
            ret.playerNumber = item.playerNumber + "";
            var pro = SQLite.add("basketballStatistics", ret);
            secPors.push(pro);
          })
        })
        var pp = $q.all(firPors);
        pp.then(function (a) {
          callback($q.all(secPors));
        })
      }

      var formatNumber = function (num) {
        return Math.round(num * 10000) / 10000
      }

      /*
       * $scope.cStep=0 没有操作
       * $scope.cStep=1 一级菜单
       * $scope.cStep=2 二级菜单
       * $scope.cStep='select'
       */
      $scope.stepOneClicked = function (event) {
        var t = event.target;
        var $t = $(t);
        if ($t.hasClass("J_Event")) {
          var ev = $t.attr("data-event");
          ev = isNaN(ev) ? ev : parseInt(ev);

          eventObject.event = ev;

          var ret = eventMgr(ev, eventObject, teamData);
          if (ret.stepTwo) {
            $scope.stepTwoData = ret.stepTwo;
            $scope.showSecSetp = true;
            $scope.showFirstSetp = false;
          }
        }
      }

      $scope.stepTwoClicked = function (event) {
        var t = event.target;
        var $t = $(t);
        if ($t.hasClass("J_Event")) {
          var ev = $t.attr("data-event");
          ev = isNaN(ev) ? ev : parseInt(ev);

          eventObject.tEvent = ev;
          eventMgr(ev, eventObject, teamData);
        }
      }


      function addDesc(obj, noHistory) {
        //事件描述
        var eventTime = timer.getTime();
        var date = $scope.util.dateFormat((new Date()), "yyyy-MM-dd hh:mm:ss");
        var promise = SQLite.add("gameEventDesc", {
          gameId: matchID,
          desc: obj.desc + " (" + $scope.leftScore + "-" + $scope.rightScore + ")",
          eventTime: eventTime
        })

        promise.then(function (eventId) {
          if (noHistory) {
            return;
          }
          $scope.cDescEventId && $scope.cDescEventId.push(eventId);
        })

        var promise1 = SQLite.add("gameEventDescription", {
          playerATeamId: obj.playerATeamId || '',
          playerAId: obj.playerA || "",//palyera id
          playerBTeamId: obj.playerBTeamId || '',
          playerBId: obj.playerB || "",

          gameId: matchID,
          competitionNode: 'B' + $scope.section,
          eventAbsoluteTime: date,
          eventTime: eventTime,
          descriptionTemplateId: obj.tid,
          para1: obj.p1,
          para2: obj.p2,
          teamScores: $scope.leftScore + "-" + $scope.rightScore
        })

        promise1.then(function (eventId) {
          if (noHistory) {
            return;
          }
          $scope.cDescriptEventId && $scope.cDescriptEventId.push(eventId);
        })
      }

      /*
       type:
       0: 罚球命中
       1: 2分命中
       2: 3分命中
       3: 抢断
       4: 失误
       5: 罚球不中
       6: 2分不中
       7: 3分不中
       8: 犯规
       9: 进攻篮板
       10: 防守篮板
       11: 球队篮板

       var eventObject = {
       time: '发生时间',
       event: '起始事件',
       tEvent: '目标事件',
       sIsLeft: '发起事件者是否是左边的队伍',
       tIsLeft: '被动事件者是否是左边的队伍',
       sMember: '事件发起者',
       tMember: '事件被动者',
       sTeam: '事件发起者队伍名',
       tTeam: '事件被动者队伍名',
       sDom: '事件发起者的dom节点',
       finished: '事件流是否结束',
       }
       */
      var eventMgr = function (event, eventObject, teamData) {
        var u = $scope.util;
        var ret = {};
        var eo = eventObject;
        //事件触发者
        var si = getMemInfo({
          isLeft: eo.sIsLeft,
          no: eo.sMember
        }, teamData);
        //事件被动者
        var ti = getMemInfo({
          isLeft: eo.tIsLeft,
          no: eo.tMember
        }, teamData);

        if (eo.finished) {
          finishEvent();
          return;
        }

        /*
         GameID
         EventID
         CompetitionNode
         EventType 0:2分球 1:3分球 2:罚球 3:篮板 4:助攻 5:抢断 6:失误 7:犯规 8:盖帽
         PlayerA
         PlayerB
         Score
         EventTime 
         EventAbsoluteTime

         GameEventDesc
         gameID: 'int',
         desc:'text',
         eventTime: 'text'
         */


        /*
         1	罚球命中	{0}罚球命中
         2	罚球不中  篮板	{0}罚球未命中，{1}抢到篮板
         3	2分命中无助攻	{0}2分命中
         4	3分命中无助攻	{0}3分命中
         5	2分命中有助攻	{0}2分命中，{1}助攻
         6	3分命中有助攻	{0}3分命中，{1}助攻
         7	2分不中有篮板	{0}2分未命中，{1}抢到篮板
         8	3分不中有篮板	{0}3分未命中，{1}抢到篮板
         9	2分不中出界	{0}2分未命中，球出界
         10	3分不中出界	{0}3分未命中，球出界
         11	抢断	{0}进攻中被{1}抢断
         12	犯规	{0}犯规
         13	失误	{0}出现失误
         14	换人	{0}换下{1}姚明
         15	小节开始	{0}第{1}节开始
         16	小节结束	{0}第{1}节结束，场上比分{1}
         17	上半场开始	{0}上半场开始
         18	上半场结束	{0}上半场结束，场上比分{1}
         19	下半场开始	{0}下半场开始
         20	下半场结束	{0}下半场结束，场上比分{1}
         */
        function finishEvent() {
          $scope.cEventId = [];
          $scope.cDescEventId = [];
          $scope.cDescriptEventId = [];
          var e = typeof eo.event != 'undefined' ? eo.event : "";
          var te = typeof eo.tEvent != 'undefined' ? eo.tEvent : "";
          var _case = e + "" + te + "";
          var str = "";
          var pa = si.playerId;
          var pb = ti.playerId;
          var paName = si.playerName;
          var pbName = ti.playerName;
          var eDesc = {
            tid: 0,//template id,
            p1: "",
            p2: "",
            same: false, //如果是同队的，则不显示队名
            needSec: true //需要第二个参数。
          };

          function sqAddEvent(eventType, playerA, playerB, score) {
            var eventTime = timer.getTime();
            var promise = SQLite.add("gameEvent", {
              gameId: matchID,
              competitionNode: "B" + $scope.section,
              eventType: eventType,
              playerA: playerA,
              playerB: playerB,
              score: score,
              eventTime: eventTime
            })

            promise.then(function (eventId) {
              $scope.cEventId.push(eventId);
            })
            //当投篮命中并且有助攻时，不要刷新undo，不然撤销事件后没法回滚比分--danny zou
            if (eventType != 4) {
              //因为有助攻是2次事件，第二次助攻会把第一次undo 的分数给冲掉！ 所以不要清空
              undo = {
                isLeft: eo.sIsLeft == "1",
                score: score
              }
            }

            if (score != 0) {
              if (eo.sIsLeft == "1") {
                $scope.leftScore += score;
                $scope.periodLeftScore += score;
              } else {
                $scope.rightScore += score;
                $scope.periodRightScore += score;
              }
              uploadScore();
            }
          }

          //str = $scope.util.formatStr(str,si.teamName,eo.sMember,si.playerName,ti.teamName,eo.tMember,ti.playerName);
          switch (_case) {
            case '0':
              //罚球命中
              str = "{0}{1}号{2}罚球命中";
              sqAddEvent(2, pa, "", 1);
              eDesc.tid = 1;
              eDesc.needSec = false;
              break;
            case '59':
              //罚球不中，进攻篮板
              str = "{0}{1}号{2}罚球未命中，{4}号{5}抢到篮板";
              sqAddEvent(2, pa, "", 0);
              sqAddEvent(3, pb, "", 0);
              eDesc.tid = 2;
              eDesc.same = true;
              break;
            case '5a':
              //罚球不中，防守篮板
              str = "{0}{1}号{2}罚球未命中，{3}{4}号{5}抢到篮板";
              sqAddEvent(2, pa, "", 0);
              sqAddEvent(3, pb, "", 0);
              eDesc.tid = 2;
              break;
            case '5b':
              //罚球不中球队篮板
              str = "{0}{1}号{2}罚球未命中，球队篮板";
              sqAddEvent(2, pa, "", 0);
              eDesc.tid = 3;
              eDesc.needSec = false;
              break;
            case '5c':
              //罚球不中无篮板
              str = "{0}{1}号{2}罚球未命中，无篮板";
              sqAddEvent(2, pa, "", 0);
              eDesc.tid = 4;
              eDesc.needSec = false;
              break;
            case '1d':
              //2分命中有助攻
              str = "{0}{1}号{2}2分命中，{4}号{5}助攻";
              sqAddEvent(0, pa, "", 2);
              sqAddEvent(4, pb, pa, 0);
              eDesc.tid = 7;
              eDesc.same = true;
              break;
            case '1e':
              //2分命中无助攻
              str = "{0}{1}号{2}2分命中";
              sqAddEvent(0, pa, "", 2);
              eDesc.tid = 5;
              eDesc.needSec = false;
              break;
            case '69':
              //2分不中进攻篮板
              str = "{0}{1}号{2}2分未命中，{4}号{5}抢到篮板";
              sqAddEvent(0, pa, "", 0);
              sqAddEvent(3, pb, "", 0);
              eDesc.tid = 9;
              eDesc.same = true;
              break;
            case '6a':
              //2分不中进攻篮板
              str = "{0}{1}号{2}2分未命中，{3}{4}号{5}抢到篮板";
              sqAddEvent(0, pa, "", 0);
              sqAddEvent(3, pb, "", 0);
              eDesc.tid = 9;
              break;
            case '6b':
              //2分不中球队篮板
              str = "{0}{1}号{2}2分未命中，球队篮板";
              sqAddEvent(0, pa, "", 0);
              eDesc.tid = 3;
              eDesc.needSec = false;
              break;
            case '6f':
              //2分不中出界
              str = "{0}{1}号{2}2分未命中，球出界";
              sqAddEvent(0, pa, "", 0);
              eDesc.tid = 11;
              eDesc.needSec = false;
              break;
            case '6g':
              //2分不中盖帽
              str = "{0}{1}号{2}2分未命中，被{3}{4}号{5}盖帽";
              sqAddEvent(0, pa, "", 0);
              sqAddEvent(8, pb, pa, 0);
              eDesc.tid = 14;
              break;
            case '2d':
              //3分命中有助攻
              str = "{0}{1}号{2}3分命中，{4}号{5}助攻";
              sqAddEvent(1, pa, "", 3);
              sqAddEvent(4, pb, pa, 0);
              eDesc.tid = 8;
              eDesc.same = true;
              break;
            case '2e':
              //3分命中无助攻
              str = "{0}{1}号{2}3分命中";
              sqAddEvent(1, pa, "", 3);
              eDesc.tid = 6;
              eDesc.needSec = false;
              break;
            case '79':
              //3分不中进攻篮板
              str = "{0}{1}号{2}3分未命中，{4}号{5}抢到篮板";
              sqAddEvent(1, pa, "", 0);
              sqAddEvent(3, pb, "", 0);
              eDesc.tid = 10;
              eDesc.same = true;
              break;
            case '7a':
              //3分不中进攻篮板
              str = "{0}{1}号{2}3分未命中，{3}{4}号{5}抢到篮板";
              sqAddEvent(1, pa, "", 0);
              sqAddEvent(3, pb, "", 0);
              eDesc.tid = 10;
              break;
            case '7b':
              //3分不中球队篮板
              str = "{0}{1}号{2}3分未命中，球队篮板";
              sqAddEvent(1, pa, "", 0);
              eDesc.tid = 15;
              eDesc.needSec = false;
              break;
            case '7f':
              //3分不中出界
              str = "{0}{1}号{2}3分未命中，球出界";
              sqAddEvent(1, pa, "", 0);
              eDesc.tid = 12;
              eDesc.needSec = false;
              break;
            case '7g':
              //3分不中盖帽
              str = "{0}{1}号{2}3分未命中，被{3}{4}号{5}盖帽";
              sqAddEvent(1, pa, "", 0);
              sqAddEvent(8, pb, pa, 0);
              eDesc.tid = 16;
              break;
            case '3':
              //抢断
              str = "{3}{4}号{5}进攻中被{0}{1}号{2}抢断";
              sqAddEvent(5, pa, pb, 0);
              eDesc.tid = 17;
              break;
            case '4':
              //失误
              str = "{0}{1}号{2}出现失误";
              sqAddEvent(6, pa, "", 0);
              eDesc.tid = 19;
              eDesc.needSec = false;
              break;
            case '8':
              //犯规
              str = "{0}{1}号{2}对{3}{4}号{5}犯规";
              sqAddEvent(7, pa, pb, 0);
              eDesc.tid = 18;
              break;
          }
          ;

          /*
           {0} 左边队名
           {1} 发起者号码
           {2} 发起者名字
           {3} 被动者队名
           {4} 被动者号码
           {5} 被动者名字
           */
          eDesc.p1 = si.teamName + eo.sMember + "号" + si.playerName;
          if (eDesc.needSec) {
            if (eDesc.same) {
              eDesc.p2 = eo.tMember + "号" + ti.playerName;
            } else {
              eDesc.p2 = ti.teamName + eo.tMember + "号" + ti.playerName;
            }
          }

          str = $scope.util.formatStr(str, si.teamName, eo.sMember, si.playerName, ti.teamName, eo.tMember, ti.playerName);
          eDesc.desc = str;
          eDesc.playerA = si.playerId;
          eDesc.playerB = ti.playerId;
          eDesc.playerATeamId = si.teamId || "";
          eDesc.playerBTeamId = ti.teamId || "";
          addDesc(eDesc);
          $scope.eventStr = str;
          showNormal();
          updateGameTabel();
        }

        switch (event) {
          case 0:
            //罚球命中
            finishEvent();
            break;
          case 1:
            //2分命中
            ret = {
              stepTwo: {
                left: {
                  name: '2分命中'
                },
                right: [
                  {name: '有助攻', event: 'd'},
                  {name: '无助攻', event: 'e'}
                ]
              }
            }

            if (is11()) {
              //如果是1v1 没有助攻
              ret.stepTwo.right.splice(0, 1);
            }

            break;
          case 2:
            //3分命中
            ret = {
              stepTwo: {
                left: {
                  name: '3分命中'
                },
                right: [
                  {name: '有助攻', event: 'd'},
                  {name: '无助攻', event: 'e'}
                ]
              }
            }

            if (is11()) {
              ret.stepTwo.right.splice(0, 1);
            }
            break;
          case 3:
            //抢断
            showSideTeam(!eo.sIsLeft);
            break;
          case 4:
            //失误
            finishEvent();
            break;
            break;
          case 5:
            //罚球不中
            ret = {
              stepTwo: {
                left: {
                  name: '罚球不中'
                },
                right: [
                  {name: '进攻篮板', event: 9},
                  {name: '防守篮板', event: 'a'},
                  // {name: '球队篮板',event: 'b'},
                  {name: '无篮板', event: 'c'},
                ]
              }
            }
            break;
          case 6:
            //2分不中
            ret = {
              stepTwo: {
                left: {
                  name: '2分不中'
                },
                right: [
                  {name: '进攻篮板', event: 9},
                  {name: '防守篮板', event: 'a'},
                  //  {name: '球队篮板',event: 'b'},
                  {name: '出界', event: 'f'},
                  {name: '盖帽', event: 'g'}
                ]
              }
            }
            break;
          case 7:
            //3分不中
            ret = {
              stepTwo: {
                left: {
                  name: '3分不中'
                },
                right: [
                  {name: '进攻篮板', event: 9},
                  {name: '防守篮板', event: 'a'},
                  // {name: '球队篮板',event: 'b'},
                  {name: '出界', event: 'f'},
                  {name: '盖帽', event: 'g'}
                ]
              }
            }
            break;
          case 8:
            //犯规
            showSideTeam(!eo.sIsLeft, eo.sDom);
            break;
          case 9:
            //进攻篮板
            showSideTeam(eo.sIsLeft);
            break;
          case 'a':
            //防守篮板
            showSideTeam(!eo.sIsLeft);
            break;
          case 'b':
            //球队篮板
            finishEvent();
            break;
          case 'c':
            //无篮板
            finishEvent();
            break;
          case 'd':
            //有助攻
            showSideTeam(eo.sIsLeft, eo.sDom);
            break;
          case 'e':
            //无助攻
            finishEvent();
            break;
          case 'f':
            //出界
            finishEvent();
            break;
          case 'g':
            //盖帽
            showSideTeam(!eo.sIsLeft, eo.sDom);
            break;
          case 10:
            var isLeft = eo.sIsLeft == "1";
            var wait;

            if (isLeft) {
              wait = teamData.left.wait;
            } else {
              wait = teamData.right.wait;
            }

            if ($.isEmptyObject(wait)) {
              showNoWait();
              showNormal();
            } else {
              showWait(isLeft, eo.sMember);
              $scope.showWaitStep = false;
              showSideTeam(isLeft, null, true);
              $scope.cStep = 'change2';
            }

            break;
        }

        return ret;
      }


      /*
       * member.isLeft;
       * member.no
       *
       */
      var getMemInfo = function (member, teamData, isWait) {
        var team;
        if (member.isLeft) {
          team = teamData.left;
        } else {
          team = teamData.right;
        }
        var teamName = team.teamName;
        var memberName;
        var id;
        if (isWait) {
          if (typeof member.no != 'undefined') {
            return team.wait[member.no]
          } else {
            return {};
          }
        } else {
          if (typeof member.no != 'undefined') {
            return team.member[member.no]
          } else {
            return {};
          }
        }

      }

      $scope.cStep = 0;
      $scope.tempMemberData = null;
      $scope.recoverIsLeft = null;
      function showWait(isLeft, memberNo) {
        var eventObject = {};
        eventObject.sIsLeft = isLeft;
        eventObject.sMember = memberNo;

        var num = 0;
        if (isLeft) {
          $scope.tempMemberData = teamData.left.member;
          teamData.left.member = teamData.left.wait;
          $scope.teamData = teamData;
          num = $scope.util.getObjectLength(teamData.left.wait);
        } else {
          $scope.tempMemberData = teamData.right.member;
          teamData.right.member = teamData.right.wait;
          $scope.teamData = teamData;
          num = $scope.util.getObjectLength(teamData.right.wait);
        }


        var height = 60 * num;
        height = height < TEAM_MIN_HEIGHT ? TEAM_MIN_HEIGHT : height;//调整球员个数高度，如果比较多的话，会超出一屏
        $(".J_Team").css({"min-height": height + "px"});
        return eventObject;
      }

      var eventObject;
      $scope.playerClicked = function ($event) {
        var t = $event.target;
        var $t = $(t);
        var isLeft = $scope.recoverIsLeft = $t.attr('data-left');
        var memberNo = $t.attr("data-no");

        if ($scope.cStep == 0) {
          $scope.cStep = 1;
          eventObject = {};
          eventObject.sIsLeft = isLeft;
          eventObject.sMember = memberNo;
          eventObject.sDom = $t;
          hideOtherPlayer($t);
          if (isLeft) {
            if (!timer.ing) {
              $scope.showWaitStep = true;
            } else {
              $scope.showFirstSetp = true;
            }
            $scope.showRightTeam = false;
          } else {
            if (!timer.ing) {
              $scope.showWaitStep = true;
            } else {
              $scope.showFirstSetp = true;
            }
            $scope.showLeftTeam = false;
          }
        } else if ($scope.cStep == "selectMember") {
          eventObject.tIsLeft = isLeft;
          eventObject.tMember = memberNo;
          eventObject.tDom = $t;
          eventObject.finished = true;
          eventMgr(undefined, eventObject, teamData);
        } else if ($scope.cStep == "change") {
          eventObject = {};
          $scope.cStep = "change2";
          eventObject = showWait(isLeft, memberNo);

        } else if ($scope.cStep == "change2") {
          eventObject.tIsLeft = isLeft;
          eventObject.tMember = memberNo;

          if (isLeft) {
            teamData.left.member = $scope.tempMemberData;
            changeTwoPerson(eventObject.sMember, eventObject.tMember, teamData.left);
            $scope.teamData = teamData;
          } else {
            teamData.right.member = $scope.tempMemberData;
            changeTwoPerson(eventObject.sMember, eventObject.tMember, teamData.right);
            $scope.teamData = teamData;
          }

          $scope.tempMemberData = null;

          var si = getMemInfo({
            isLeft: isLeft,
            no: eventObject.sMember
          }, teamData, true);
          var ti = getMemInfo({
            isLeft: isLeft,
            no: eventObject.tMember
          }, teamData);
          addDesc({
            playerATeamId: si.teamId || '',
            playerBTeamId: ti.teamId || '',
            playerA: si.playerId,
            playerB: ti.playerId,
            tid: 20,
            p1: si.teamName + si.playerNumber + "号",
            p2: ti.playerNumber + "号",
            desc: $scope.util.formatStr("{0}号换下{1}号", si.teamName + si.playerNumber, ti.playerNumber)
          }, true);

          updatePlayer({
            hasPlay: 1,
            teamId: ti.teamId,
            playerId: ti.playerId,
          }, ti)

          showNormal();
        } else {
          $scope.cStep = 0;
          showNormal();
        }
      }

      var recoverWaitData = function () {
        if ($scope.tempMemberData && $scope.cStep == "change2") {
          if ($scope.recoverIsLeft) {
            teamData.left.member = $scope.tempMemberData;
          } else {
            teamData.right.member = $scope.tempMemberData;
          }
          $scope.teamData = teamData;
        }
      }

      var undo = {
        isLeft: null,
        score: 0
      }
      $scope.cancelEvent = function () {
        //撤销
        if (undo.score) {
          if (undo.isLeft) {
            $scope.leftScore -= undo.score;
            $scope.periodLeftScore -= undo.score;
          } else {
            $scope.rightScore -= undo.score;
            $scope.periodRightScore -= undo.score;
          }
        }

        //有可能调整比分后，再撤销导致分数变成0，最小为0
        $scope.leftScore = $scope.leftScore < 0 ? 0 : $scope.leftScore;
        $scope.periodLeftScore = $scope.periodLeftScore < 0 ? 0 : $scope.periodLeftScore;
        $scope.rightScore = $scope.rightScore < 0 ? 0 : $scope.rightScore;
        $scope.periodRightScore = $scope.periodRightScore < 0 ? 0 : $scope.periodRightScore;

        uploadScore();
        updateGameTabel();
        $scope.eventStr = "";
        $.each($scope.cEventId, function (index, id) {
          SQLite.delete("GameEvent", {
            id: id
          })
        })

        $.each($scope.cDescEventId, function (index, id) {
          SQLite.delete("GameEventDesc", {
            eventId: id
          })
        })
        $.each($scope.cDescriptEventId, function (index, id) {
          SQLite.delete("gameEventDescription", {
            id: id
          })
        })
      }

      var changeTwoPerson = function (memberNo, waitNo, node) {
        var temp = node.member[memberNo];
        node.member[waitNo] = node.wait[waitNo];
        node.wait[memberNo] = temp;
        delete node.member[memberNo];
        delete node.wait[waitNo];
      }

      var showNormal = function () {
        recoverWaitData();
        $scope.cStep = 0;
        $scope.showLeftTeam = true;
        $scope.showRightTeam = true;
        $scope.showFirstSetp = false;
        $scope.showSecSetp = false;
        $scope.showWaitStep = false;
        showAllPlayer();
        $(".J_Team").css({"min-height": TEAM_MIN_HEIGHT + "px"});//调整为最低高度
      }

      var hidePlayer = function (dom) {
        $(dom).hide();
      }

      var hideOtherPlayer = function (dom) {
        $(".J_Player").not(dom).hide();
      }
      var showAllPlayer = function () {
        $(".J_Player").show();
      }

      var showSideTeam = function (isLeft, hideDom, isChange) {
        if (isChange) {
          $scope.cStep = 'change';
        } else {
          $scope.cStep = 'selectMember';
        }

        showAllPlayer();
        $scope.showFirstSetp = false;
        $scope.showSecSetp = false;
        if (isLeft) {
          $scope.showLeftTeam = true;
          $scope.showRightTeam = false;
        } else {
          $scope.showRightTeam = true;
          $scope.showLeftTeam = false;
        }
        hideDom && hidePlayer(hideDom);
      }
      $scope.$on('$stateChangeStart', function (event, toState, toParams, fromState, fromParams) {
        //点安卓自带back按钮时，如果纠正比分浮层show着的话，先隐藏----add by danny zou
        if ($scope._mobiscroll.isVisible()) {
          event.preventDefault();
          $scope._mobiscroll.hide();
        }
      })
    })
  }]);
