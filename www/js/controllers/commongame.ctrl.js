app.controller('CommonGameCtrl', ['$rootScope','$scope', 'Util', '$ionicActionSheet','$ionicPopup', '$ionicPopover', 'SQLite','$state','$stateParams', '$ionicHistory', '$q','Http', '$ionicLoading', 'Cloud', 'Storage',
  function($rootScope,$scope, util, $ionicActionSheet, $ionicPopup, $ionicPopover, SQLite, $state, $stateParams, $ionicHistory,  $q,http,$ionicLoading, cloud, Storage) {
    //貌似会引用不到，附在scope上了。
    $scope.util = util;
    $scope.http = http;

    var udf;
    var STRING = {
      START: "开始",
      PAUSE: "暂停",
      CONFIRM: "确认",
      CANCEL: "取消",
      CHOOSE_OPERATE: "选择暂停原因",
      HOME_TEAM_SUBSTITUTION: '主队换人',
      VISIT_TEAM_SUBSTITUTION: '客队换人',
      SECTION_OVER: '本节结束',
      HALF_GAME_OVER: '半场结束',
      ALL_GAME_OVER: '全场结束',
      GAME_OVER: '结束比赛',
      GAME_OVER_DESC: '确认结束本场比赛！',
      PLEASE_START_GAME: '请开始比赛'
    }

    //本地模拟足球数据
    var footMenu= {
      data:[
        {templateId:50,templateName:"射门",secondEventTarget:"",templateContent:"{0}射门",eventLevel:1,parentId:0,score:0},
        {templateId:51,templateName:"射正不进",secondEventTarget:"",templateContent:"{0}射门不进",eventLevel:2,parentId:50,score:0},
        {templateId:52,templateName:"未射正",secondEventTarget:"",templateContent:"{0}未射正",eventLevel:2,parentId:50,score:0},
        {templateId:53,templateName:"进球",secondEventTarget:"",templateContent:"{0}进球",eventLevel:2,parentId:50,score:1},
        {templateId:54,templateName:"角球",secondEventTarget:"",templateContent:"{0}角球",eventLevel:1,parentId:0,score:0},
        {templateId:55,templateName:"进球",secondEventTarget:"",templateContent:"{0}角球进球",eventLevel:2,parentId:54,score:1},
        {templateId:56,templateName:"未进",secondEventTarget:"",templateContent:"{0}角球未进",eventLevel:2,parentId:54,score:0},
        {templateId:57,templateName:"传球",secondEventTarget:"",templateContent:"{0}传球",eventLevel:1,parentId:0,score:0},
        {templateId:58,templateName:"乌龙球",secondEventTarget:"",templateContent:"{0}乌龙球",eventLevel:1,parentId:0,score:-1},
        {templateId:59,templateName:"犯规",secondEventTarget:"1",templateContent:"{0}对{1}犯规",eventLevel:1,parentId:0,score:0},
        {templateId:60,templateName:"警告",secondEventTarget:"1",templateContent:"{0}对{1}犯规,警告",eventLevel:2,parentId:59,score:0},
        {templateId:61,templateName:"黄牌",secondEventTarget:"1",templateContent:"{0}对{1}犯规，黄牌",eventLevel:2,parentId:59,score:0},
        {templateId:62,templateName:"红牌",secondEventTarget:"1",templateContent:"{0}对{1}犯规，红牌",eventLevel:2,parentId:59,score:0},
        {templateId:63,templateName:"无",secondEventTarget:"1",templateContent:"{0}对{1}犯规",eventLevel:2,parentId:59,score:0},
        {templateId:64,templateName:"越位",secondEventTarget:"",templateContent:"{0}越位",eventLevel:1,parentId:0,score:0},
        {templateId:65,templateName:"点球",secondEventTarget:"",templateContent:"{0}点球",eventLevel:1,parentId:0,score:0},
        {templateId:66,templateName:"进球",secondEventTarget:"",templateContent:"{0}点球进球",eventLevel:2,parentId:65,score:1},
        {templateId:67,templateName:"未进",secondEventTarget:"",templateContent:"{0}点球未进",eventLevel:2,parentId:65,score:0},
        {templateId:68,templateName:"抢断",secondEventTarget:"",templateContent:"{0}越位",eventLevel:-1,parentId:-1,score:0},
        {templateId:69,templateName:"拦截",secondEventTarget:"1",templateContent:"{0}拦截{1}",eventLevel:1,parentId:0,score:0},
        {templateId:70,templateName:"换人",secondEventTarget:"0",templateContent:"{0}换{1}",eventLevel:1,parentId:0,score:0},
        {templateId:71,templateName:"成功",secondEventTarget:"1",templateContent:"{0}拦截{1}，SUCCESS",eventLevel:2,parentId:69,score:0},
        {templateId:72,templateName:"失败",secondEventTarget:"1",templateContent:"{0}拦截{1},FAILE",eventLevel:2,parentId:69,score:0},
        {templateId:73,templateName:"任意球",secondEventTarget:"",templateContent:"{0}任意球",eventLevel:1,parentId:0,score:0}
      ]
    }

    //本地模拟篮球数据
    var baskMenu= {
      data:[
        {templateId:1,templateName:"罚球命中",secondEventTarget:"",templateContent:"{0}罚球命中",eventLevel:1,parentId:0,score:1},

        {templateId:31,templateName:"罚球不中",secondEventTarget:"",templateContent:"",eventLevel:1,parentId:0,score:0},
        {templateId:32,templateName:"进攻篮板",secondEventTarget:"",templateContent:"{0}罚球未命中，{1}抢到篮板",eventLevel:2,parentId:31,score:0},
        {templateId:2,templateName:"防守篮板",secondEventTarget:"",templateContent:"{0}罚球未命中，{1}抢到篮板",eventLevel:2,parentId:31,score:0},

        {templateId:33,templateName:"2分命中",secondEventTarget:"",templateContent:"",eventLevel:1,parentId:0,score:2},
        {templateId:5,templateName:"无助攻",secondEventTarget:"",templateContent:"{0}2分命中",eventLevel:2,parentId:33,score:2},
        {templateId:7,templateName:"有助攻",secondEventTarget:"0",templateContent:"{0}2分命中，{1}助攻",eventLevel:2,parentId:33,score:2},

        {templateId:34,templateName:"3分命中",templateContent:"",eventLevel:1,parentId:0,score:3},
        {templateId:6,templateName:"无助攻",templateContent:"{0}3分命中",eventLevel:2,parentId:34,score:3},
        {templateId:8,templateName:"有助攻",secondEventTarget:"0",templateContent:"{0}3分命中，{1}助攻",eventLevel:2,parentId:34,score:3},

        {templateId:35,templateName:"2分不中",templateContent:"",eventLevel:1,parentId:0,score:0},
        {templateId:9,templateName:"进攻篮板",secondEventTarget:"1",templateContent:"{0}1分未命中,{1}抢到篮板",eventLevel:2,parentId:43,score:0},
        {templateId:11,templateName:"出界",secondEventTarget:"",templateContent:"{0}1分未命中,球出界",eventLevel:2,parentId:43,score:0},
        {templateId:14,templateName:"盖帽",secondEventTarget:"1",templateContent:"{0}1分未命中,被{1}盖帽",eventLevel:2,parentId:43,score:0},
        {templateId:37,templateName:"防守篮板",secondEventTarget:"0",templateContent:"{0}1分未命中,{1}抢到篮板",eventLevel:2,parentId:43,score:0},

        {templateId:36,templateName:"3分不中",secondEventTarget:"",templateContent:"",eventLevel:1,parentId:0,score:0},
        {templateId:10,templateName:"进攻篮板",secondEventTarget:"0",templateContent:"{0}2分未命中,{1}抢到篮板",eventLevel:2,parentId:35,score:0},
        {templateId:12,templateName:"出界",templateContent:"{0}2分未命中,球出界",eventLevel:2,parentId:35,score:0},
        {templateId:16,templateName:"盖帽",secondEventTarget:"1",templateContent:"{0}2分未命中,被{1}盖帽",eventLevel:2,parentId:35,score:0},
        {templateId:38,templateName:"防守篮板",secondEventTarget:"1",templateContent:"{0}2分未命中,{1}抢到篮板",eventLevel:2,parentId:35,score:0},

        {templateId:17,templateName:"抢断",secondEventTarget:"1",templateContent:"{1}进攻中被{0}抢断",eventLevel:1,parentId:0,score:0},
        {templateId:18,templateName:"犯规",secondEventTarget:"",templateContent:"{0}犯规",eventLevel:1,parentId:0,score:0},
        {templateId:19,templateName:"失误",secondEventTarget:"",templateContent:"{0}失误",eventLevel:1,parentId:0,score:0},
      ]
    }

    //如果为助攻等，事件第二目标不是自己，则不能显示自己
    var secondTargetNotMe = [57,42,7,8];
    //如果是1v1需要删掉有助攻，不然会出问题。
    var noAssist = [7,8,42];
    //如果是点球，只显示点球相关的。
    var penaltyKick = [65,66,67];
    //暂停只显示换人
    var changeArr = [20,70];

    // 最后的红牌罚下队员,供撤销红牌事件用 zhangshub
    var lastRedPlayer = null;

    $(function (){
      var initScore = function (){
        var wheelVal = [];
        for(var i=0;i<50;i++){
          wheelVal.push(i);
        }
        //纠正比分
        $("#J_Scroller").mobiscroll().scroller({
          theme: 'mobiscroll',
          display: 'top',
          theme: 'ios', // Specify theme like: theme: 'ios' or omit setting to use default
          mode: 'scroller',
          minWidth:100,
          closeOnOverlay: false,
          showLabel: false,
          headerText: function (info){
            return $scope.teamData.left.teamName + " " + info.split(" ")[0] + ":" + info.split(" ")[1] + " " + $scope.teamData.right.teamName;
          },
          onClose: function (inst) {
            setTimeout(function (){
              $("#J_Scroller").val("纠正比分");
            },50)
          },
          onBeforeShow: function (inst){
            inst.setArrayVal([$scope.leftScore,$scope.rightScore]);
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

                $scope.$apply();
                saveGameScore();
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
              keys: wheelVal,
              values: wheelVal
            },
            {
              keys: wheelVal,
              values: wheelVal
            }
          ]]
        });
        $scope._mobiscroll = $("#J_Scroller").mobiscroll('getInst');
        $scope._mobiscroll.disable();
      }

      //定义timer.
      var $timer = $(".J_Timer");
      var timer = {
        time:0,
        intervalHandler: null,
        ing: false,
        setTime: function (ms){
          this.time = ms;
          var time = this.formatTime(this.time);
          $timer.html(time);
        },
        getTime: function (){
          return this.time.toFixed(1);
        },
        formatTime: function (mms){
          var hour = Math.floor(mms/3600);
          hour = (hour+"").length ==1?"0"+hour:hour;
          var min = Math.floor(mms%3600/60);
          min = (min+"").length ==1?"0"+min:min;
          var sec = Math.floor(mms%3600%60);
          sec = (sec+"").length ==1?"0"+sec:sec;
          var ms = mms.toFixed(1).split(".")[1];
          return hour + ":" + min + ":" + sec + "." + ms;
        },
        start: function (ms){
          $scope.pause = false;
          var that = this;
          this.ing = true;
          $scope.timerStr = STRING.PAUSE;
          if(this.intervalHandler){
            clearInterval(this.intervalHandler);
          }
          this.intervalHandler = setInterval(function (){
            that.time += .1;
            var time = that.formatTime(that.time);
            $timer.html(time);
          },100)
        },
        stop: function (){
          $scope.pause = true;
          this.ing = false;
          $scope.timerStr = STRING.START;
          clearInterval(this.intervalHandler);
        }
      }

      //所有初始化数据在这里做
      $scope.leftScore = 0;//左边队的比分
      $scope.rightScore = 0;//右边队的比分
      $scope.section = 1;//当前第几节
      $scope.timerStr = STRING.START;//计时的字符串
      $scope.pause = true;//当前是否暂停
      $scope.showLeftTeam = true;//是否show左边队伍
      $scope.showAllTeam = true;//是否show两边队伍 因为篮球，足球显示方式不同，所以需要此标示，并且可以与showLeftTeam与操作，来显示哪边队伍
      $scope.l1PlayerNo = "";//一层菜单球员号显示
      $scope.hasNoWaitMember = false;//如果无替补，则天使无替补的字样
      $scope.isNormalPause = false;// 普通暂停
      //二层目录，这层是动态的。
      $scope.l2Menu = [];
      /*
        step
        默认 0: 表示正常状态
             1: 一级菜单
             2: 二级菜单
             3: 选择事件起始人（非换人）
             4：选择要换下的人
             5: 选择替补
      */
      $scope.step = 0;
      /*
        flowEvent.sMember   事件发起球员
        flowEvent.tMember   事件被动球员
      */
      $scope.flowEvent = {
        sMember: null,
        tMember: null,
        time: null, //发生时间
        sEvent: null, //起始事件
        tEvent: null,//目标事件
        sDom: null, //发起人dom
        sLeft: null //发起者是否是左边队伍 
      };

      $scope.clearFlow = function (){
        $scope.flowEvent = {};
      };

      //恢复时间，比如app重启后，从数据库重新拉数据
      var resumeTime = function (status,isPause, currentPauseSec, currentPauseTimestamp){
        var sql = "select currentPauseSec,currentPauseTimestamp,isPause,status from game where id='"+$scope.gameId+"'";
        SQLite.execute(sql).then(function(data) {
          data = data[0];
          if (data.status == 1) {
            if (!data.isPause) {
              var time = parseFloat(data.currentPauseSec);
              var d = $scope.getSysTimestamp() - (new Date(data.currentPauseTimestamp));
              time = time + d / 1000;
              timer.setTime(time);
              timer.start();
            } else {
              timer.setTime(parseFloat(data.currentPauseSec));
            }
          }
        });
      }

      //绑定resume事件，比如ios app resume后，需要重新计算比赛时间
      var resumeHandler =  function (){
        if(location.hash.indexOf("/game/") == -1){
          return;
        }
        resumeTime();
      }
      $(document).off("resume", resumeHandler).on("resume", resumeHandler);

      //获取事件模板
      SQLite.getEventTemplateByGameId($stateParams.matchId).then(function (data){
        $scope.menu = data;
        gameData();
      })

      var getL1Menu = function (){
        //获取一层目录
          var l1Data = getMenu({
            level:1
          });
          //获取一层目录 左边
          $scope.l1LeftMenu = filterArrLength(l1Data,0,5);
          //获取一层目录 右边
          $scope.l1RightMenu = filterArrLength(l1Data,5,5);
      }

      //初始化比赛数据，球员，球队等
      var gameData = function (){
        $scope.gameId =  $stateParams.matchId;
        var getGameInfoSql = "select gameEventRulesId,periodTeamAScore,periodTeamBScore,currentNodeSec,currentNodeStartAbso,sportType,liveMode,isPause,section,status,teamAScore,teamBScore,hometeamid,guestteamid,gameType "+
          "from game "+
          "where id = '"+$scope.gameId+"'";
        SQLite.execute(getGameInfoSql).then(function (data) {
          if (data.length > 0) {
            var data = data[0];
            $scope.guestTeamId = data.guestTeamId;
            $scope.homeTeamId = data.homeTeamId;
            $scope.gameType = data.gameType;
            $scope.leftScore = data.teamAScore;
            $scope.rightScore = data.teamBScore;
            $scope.status = data.status;
            $scope.section = data.section;
            $scope.liveMode = data.liveMode;
            $scope.sportType = data.sportType;
            $scope.pause = data.isPause;
            $scope.gameEventRulesId = data.gameEventRulesId;

            $scope.currentNodeSec = data.currentNodeSec; //当前小节开始相对时间
            $scope.currentNodeStartAbso = data.currentNodeStartAbso //当前小节开始绝对时间
            $scope.periodLeftScore = data.periodTeamAScore;//当前小节分数
            $scope.periodRightScore = data.periodTeamBScore;

            
            getL1Menu();
            resumeTime();
            getTeamInfo();
            //初始化比分数据
            initScore();
            if ($scope.status == 1) {
              $scope._mobiscroll.enable();
            }
          }else{
            showError();
          }
        });
      }

      function getTeamInfo(){
        var getTeamInfo = "select "+
        "b.gameid,b.teamid,b.playerid,b.isfirst,b.onplay,b.leave,b.hasplay, "+
        "c.teamname,"+
        "d.PlayerName,d.PlayerNumber "+
        "from gameplayers b,Team c,Player d "+
        "where b.teamid = c.id and d.id = b.playerID and b.gameId = '"+$scope.gameId+"'";
      //获取队伍信息
        SQLite.execute(getTeamInfo).then(function (data) {
          if (data.length > 0) {
            //初始化两队数据
            var teamData = {
              left:{
                teamName: "",
                member:{},
                wait:{}
              },
              right:{
                teamName: "",
                member:{},
                wait:{}
              }
            }

            function addMember(memberNode, item){
              memberNode[item.playerNumber] = item;
            }

            $.each(data,function(index, item){
              if(item.teamId == $scope.homeTeamId){
                teamData.left.teamName = item.teamName;
                if(item.onPlay){
                  addMember(teamData.left.member,item);
                }else{
                  addMember(teamData.left.wait,item);
                }

              }else{
                teamData.right.teamName = item.teamName;
                if(item.onPlay){
                  addMember(teamData.right.member,item);
                }else{
                  addMember(teamData.right.wait,item);
                }
              }
            })

            $scope.teamData = teamData;
            checkChangeEvent();
          } else {
            showError();
          }
        })
      }

      //获取数据失败后的error dialog
      function showError(){
        var confirmPopup = $ionicPopup.confirm({
          title: '读取比赛数据失败',
          buttons: [
            {
              text: '返回',
              type: 'button-positive',
              onTap: function(e) {
                $scope.backMatchList();
              }
            }
          ]
        });
      }

      //结束事件
      var finishEvent = function (){
        eventManger.addEvent();
      }
      //显示事件
      var showEvent = function (desc, noCancel){
        $scope.eventStr = desc;
        //noCancel为true，则不能撤销
        if(noCancel){
          $scope.noEventCancel = true;
        }else{
          $scope.noEventCancel = false;
        }
      }

      //事件管理
      var eventManger = (function (){

        var undo;

        var eventHistory = [];

        return {
          addEvent: function (eventId, option){
            undo = {
              score: 0,
              eventId: '',
              isLeft: null
            }

            eventHistory = [];

            option = option || {};
            var eventDesc;
            var param;
            var guid = $scope.util.creatGUID();
            //如果evendId 未定义，则表示是正常流程事件，
            //如果evendId 有ID有定义，则直接显示该模板事件，比如比赛开始什么的。
            if(_.isUndefined(eventId)){
              var obj = $scope.flowEvent;
              var event = getMenu({templateId:$scope.flowEvent.eventId})[0];
              var templateContent = event.templateContent;
              var score = event.score;
              
              var para1 = obj.sMember.teamName + obj.sMember.playerNumber + "号"+obj.sMember.playerName;
              var para2 = "";
              if(obj.tMember){
                if(obj.sMember.teamId != obj.tMember.teamId){
                  //如果队号不相等，则显示队名
                  para2 += obj.tMember.teamName;
                }
                para2 += obj.tMember.playerNumber + "号"+obj.tMember.playerName
              }

              eventDesc = $scope.util.formatStr(templateContent, para1, para2);

              eventHistory.push({
                id:guid,
                eventId : obj.eventId
              });

              if(score != 0){
                undo.score = score;
                if(obj.sMember.teamId == $scope.homeTeamId){
                  undo.isLeft = true;
                  if(event.score >0){
                    $scope.leftScore += event.score;
                    $scope.periodLeftScore += event.score;
                  }else{
                    //如果是乌龙，给对面加分
                    $scope.rightScore -= event.score;
                    $scope.periodRightScore -= event.score;
                  }
                }else{
                  undo.isLeft = false;
                  if(event.score >0){
                    $scope.rightScore += event.score;
                    $scope.periodRightScore += event.score;
                  }else{
                    //如果是乌龙，给对面加分
                    $scope.leftScore -= event.score;
                    $scope.periodLeftScore -= event.score;
                  }
                }
              }

              param = {
                id:guid,
                gameId: $scope.gameId + "",
                competitionNode: getCompetitionNode(),
                eventId:obj.eventId + "",

                playerATeamId:obj.sMember && obj.sMember.teamId || '',
                playerAId:obj.sMember && obj.sMember.playerId || '',
                playerAScore:score || 0,
                homeTeamScore:$scope.leftScore,

                playerBTeamId:obj.tMember && obj.tMember.teamId || '',
                playerBId:obj.tMember && obj.tMember.playerId || '',
                playerBScore:'',
                guestTeamScore:$scope.rightScore,
                descriptionTemplateId: event.templateId,

                eventTime:timer.getTime(),//相对整场比赛时间
                eventAbsoluteTime: $scope.getSysDate(),//绝对时间
                eventTimeNode:Math.round((timer.getTime() - $scope.currentNodeSec)*10)/10,//事件发生相对小节开始时间
                para1:para1,
                para2:para2,
                para3:''
              }

              showEvent(eventDesc);
            }else{
              var event = getMenu({templateId:eventId})[0];
              var para1 = option.para1 || '';
              var para2 = option.para2 || '';

              param = {
                id:guid,
                gameId: $scope.gameId + "",
                competitionNode: getCompetitionNode(),
                eventId:eventId + "",
                homeTeamScore:$scope.leftScore,
                guestTeamScore:$scope.rightScore,

                eventTime:timer.getTime(),//相对整场比赛时间
                eventAbsoluteTime: $scope.getSysDate(),//绝对时间
                eventTimeNode:Math.round((timer.getTime() - $scope.currentNodeSec)*10)/10,//事件发生相对小节开始时间
                para1:para1,
                para2:para2
              }

              var templateContent = event && event.templateContent || "";
              eventDesc = $scope.util.formatStr(templateContent, para1, para2);
              showEvent(eventDesc, true);
            }

            uploadEvent(param);
            saveGameScore();
            showNormal();
          },
          cancel: function (){
            if(undo.score){
              if(undo.isLeft){
                if(undo.score>0){
                  $scope.leftScore -= undo.score;
                  $scope.periodLeftScore -= undo.score;
                }else{
                  //乌龙撤销加分
                  $scope.rightScore += undo.score;
                  $scope.periodRightScore += undo.score;
                }
              }else{
                if(undo.score>0){
                  $scope.rightScore -= undo.score;
                  $scope.periodRightScore -= undo.score;
                }else{
                  //乌龙撤销加分
                  $scope.leftScore += undo.score;
                  $scope.periodLeftScore += undo.score;
                }
              }
            }

            $.each(eventHistory, function (index, evt){
              SQLite.delete("gameEventDescription", {
                id: evt.id
              })
              uploadCancelEvent(evt.id);
              //如果是撤销红牌事件, 将人员重新还上场,shbzhang
              if(evt.eventId == '62'){
                lastRedPlayer.leave = 0;
                setTimeout(function(){
                  $("[data-id='"+ lastRedPlayer.playerId +"']").css('display','');
                },100);
              }
            })

            $scope.eventStr = "";
            showNormal();
          }
        }
      })();

      //上传比赛事件，成功失败都要存本地一份，但是uploadFlag不一样
      var uploadEvent = function (param){
        var uploadPromise = http.uploadGameEvent({gameEvents:[param]});
        uploadPromise.then(function (data){
          //标记事件为已上传
          saveEvent(param,1);
        },function(){
          saveEvent(param,0);
        })
      }

      //上传取消比赛事件
      var uploadCancelEvent = function (eventId){
        var uploadPromise = http.cancelGameEvent({gameEventsId:eventId});
        uploadPromise.then(function (data){
        },function(){
        })
      }

      //本地存储事件，以防没有网络，结束比赛后再可上传
      var saveEvent = function (param, uploadSuccess){
        if(uploadSuccess){
          param.uploadFlag = 1;
        }else{
          param.uploadFlag = 0;
        }
        var savePromise = SQLite.add("gameEventDescription", param);

        savePromise.then(function (eventId) {

        })
      }

      //Toast dialog.
      var toast = function (text) {
        $ionicLoading.show({
          template: text,
          duration: 1000
        });
      }

      //球员点击事件
      $scope.playerClicked = function (event){
        if($scope.status == 0){
          toast(STRING.PLEASE_START_GAME);
          return;
        }

        var $target = $(event.target);
        var playerNo = $target.attr('data-no');
        var isLeft = $target.attr('data-left') == 1;
        var teamData = $scope.teamData;

        if(playerNo == null){
          return;
        }

        if($scope.step == 0){
          //清楚事件流
          $scope.clearFlow();
          //一层菜单显示触发人员
          $scope.l1PlayerNo = playerNo;
          //开始事件流
          $scope.flowEvent = {
            sMember: getMemInfo(playerNo,isLeft),
            sDom: event.target,
            sLeft: isLeft
          }
          showEventAnime(1);
        }else if($scope.step == 3){
          //选择目标
          $scope.step = 0;
          var tMember = $scope.flowEvent.tMember = getMemInfo(playerNo,isLeft);
          //红牌罚下事件
          if($scope.flowEvent.eventId == 62){
            $scope.flowEvent.sMember.leave = 1;
            //保存红牌队员 shbzhang
            lastRedPlayer = $scope.flowEvent.sMember;
            savePlayer($scope.flowEvent.sMember);
          }
          finishEvent();
        }else if ($scope.step == 5) {
          //选择换人对象
          if ($scope.flowEvent.sLeft) {
            teamData.left.member = $scope.tempMemberData;
            changeTwoPerson($scope.flowEvent.sMember.playerNumber, playerNo, teamData.left);
          } else {
            teamData.right.member = $scope.tempMemberData;
            changeTwoPerson($scope.flowEvent.sMember.playerNumber, playerNo, teamData.right);
          }
          $scope.teamData = teamData;

          $scope.tempMemberData = null;

          showNormal();
        }

        $scope.showLeftTeam = $scope.flowEvent.sLeft;
      }

      //一层事件
      $scope.step1Clicked = function (event){
        var $target = $(event.target);
        var fe = $scope.flowEvent;
        $scope.flowEvent.eventId = $target.attr('data-event-id');
        $scope.l1EventName = $target.attr('data-event-name');
        $scope.eventScore = $target.attr('data-score');
        var secondEventTarget = $target.attr("data-target");
        var l2Mune = getMenu({parentId:$scope.flowEvent.eventId});

        //如果是换人事件，则触发换人
        if($scope.flowEvent.eventId == 20 || $scope.flowEvent.eventId == 70){
          showWait(fe.sLeft, fe.sMember.playerNumber);
          showEventAnime(0);
          return;
        }

        if(l2Mune.length != 0){
          showEventAnime(2);
          $scope.l2Menu = l2Mune;
        }else{
          if(secondEventTarget == ""){
            finishEvent();
          }else{
            $scope.step = 3;
            var hideDom = "";
            if(secondTargetNotMe.indexOf(parseInt($scope.flowEvent.eventId)) != -1){
              hideDom = $scope.flowEvent.sDom;
            }
            if($scope.flowEvent.sLeft){
              showSideTeam($scope.flowEvent.sLeft && !parseInt(secondEventTarget), hideDom);
            }else{
              showSideTeam($scope.flowEvent.sLeft || !!parseInt(secondEventTarget), hideDom);
            }
          }
          showEventAnime(0);
        }
      }

      //正常显示界面
      var showNormal = $scope.showNormal = function () {
        recoverWaitData();
        $scope.step = 0;
        $scope.showAllTeam = true;
        showEventAnime(0);
        showAllPlayer();
      }

      //显示一边队伍
      var showSideTeam = function (isLeft, hideDom, isChange) {
        showAllPlayer();
        if (isLeft) {
          $scope.showLeftTeam = true;
          $scope.showAllTeam = false;
        } else {
          $scope.showLeftTeam = false;
          $scope.showAllTeam = false;
        }
        hideDom && hidePlayer(hideDom);
      }

      //二层事件
      $scope.step2Clicked = function (event){
        var $target = $(event.target);
        $scope.flowEvent.eventId = $target.attr('data-event-id');
        $scope.eventScore = $target.attr('data-score');
        var secondEventTarget = $target.attr("data-target");
        if(secondEventTarget == ""){
          finishEvent();
        }else{
          $scope.step = 3;
          var hideDom = "";
          //如果第二对象能为自己，则隐藏自己
          if(secondTargetNotMe.indexOf(parseInt($scope.flowEvent.eventId)) != -1){
            hideDom = $scope.flowEvent.sDom;
          }
          if($scope.flowEvent.sLeft){
            showSideTeam($scope.flowEvent.sLeft && !parseInt(secondEventTarget), hideDom);
          }else{
            showSideTeam($scope.flowEvent.sLeft || !!parseInt(secondEventTarget), hideDom);
          }
        }

        showEventAnime(0); 
      }

      //取消选择事件流
      $scope.cancelFlow = function (){
        showEventAnime(0);
      }

      //获取系统时间
      $scope.getSysDate = function (){
        return $scope.util.dateFormat($scope.util.Date.getServerDate(), "yyyy-MM-dd hh:mm:ss");
      }

      //获得系统时间戳
      $scope.getSysTimestamp = function (){
        return $scope.util.Date.getServerDate().getTime();
      }

      //获取事件模板信息{level:0,parentId:0，templateId：0}
      function getMenu(param){
        var data
        //测试数据
        // if($scope.sportType == "basketball"){
        //   data = baskMenu.data;
        // }else{
        //   data = footMenu.data;
        // }

        data = $scope.menu;

        var ret = [];
        //按等级来获取模板
        if(!util.isUdf(param.level)){
          $.each(data, function (index, item){
            if(item.level == param.level){
              ret.push(item);
            }
          })
        }
        //按父节点获取模板
        if(!util.isUdf(param.parentId)){
          $.each(data, function (index, item){
            if(item.parentId == param.parentId){
              ret.push(item);
            }
          })
        }
        //按模板id来获取模板
        if(!util.isUdf(param.templateId)){
          $.each(data, function (index, item){
            if(item.templateId == param.templateId){
              ret.push(item);
            }
          })
          return ret;
        }

        //过滤部分菜单，比如点球只显示点球，1v1没有助攻选项
        for(var i = ret.length;i--;){
          var item = ret[i];
          //1v1没有助攻
          if($scope.gameType == '1v1' && noAssist.indexOf(parseInt(item.templateId)) != -1){
            ret.splice(i,1);
          }

          //点球只显示点球相关
          if($scope.sportType == "football" && $scope.section == 4 && penaltyKick.indexOf(parseInt(item.templateId)) == -1){
            ret.splice(i,1);
          }

          if($scope.pause && changeArr.indexOf(parseInt(item.templateId)) == -1){
            ret.splice(i,1);
          }
        }
        return ret;
      }

      //获取球员信息
      var getMemInfo = function (memberNo,isLeft,isWait){
        var team;
        if(isLeft){
          team = $scope.teamData.left;
        }else{
          team = $scope.teamData.right;
        }
        var memberName;
        var id;
        if(isWait){
          return team.wait[memberNo];
        }else{
          return team.member[memberNo];
        }
      }

      //回退事件
      $scope.backMatchList = function() {
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

      //暂停按钮事件
      $scope.toggleTimer = function (){
        if(timer.ing){
          if($scope.sportType == "basketball"){
            showBasketBallActionSheet();
          }else if ($scope.sportType == "football"){
            showFootBallActionSheet();
          }
        }else{
          timer.start();
          if($scope.isNormalPause){
            saveGameStatus();
          }else{
            saveGameStatus({
              isNodeStart: true
            });
          }
          
          $scope._mobiscroll.enable();
        }
      }

      //显示篮球菜单
      var showBasketBallActionSheet = function (){
        var btns = [{
           text: STRING.SECTION_OVER
        },{
          text: "主队暂停"
        },{
          text: "客队暂停"
        }]

        var hideHandler = $scope.hideHandler = $ionicActionSheet.show({
          buttons: btns,
          titleText: STRING.CHOOSE_OPERATE,
          cancelText: STRING.CANCEL,
          destructiveText: STRING.ALL_GAME_OVER,
          //结束比赛
          destructiveButtonClicked: destructiveButtonClicked,
          buttonClicked: function(index) {
            //比赛暂停，换人等。
            hideHandler();
            $scope.eventStr = "";
            timer.stop();
            switch(index){
              case 0:
              saveGameScore();
              saveGameStatus({
                isNodeOver: true
              });
                break;
              case 1:
                saveGameStatus({
                  isNormalPause: true
                });
                break;
              case 2:
                saveGameStatus({
                  isNormalPause: true
                });
                break;
            }
            
          }
        });
      };

      //显示足球菜单
      var showFootBallActionSheet = function (){
        var btns = [];
        if($scope.section == 1){
          btns = [{
             text: STRING.HALF_GAME_OVER //半场结束
          }]
        }

        var hideHandler = $scope.hideHandler = $ionicActionSheet.show({
          buttons: btns,
          titleText: STRING.CHOOSE_OPERATE,
          cancelText: STRING.CANCEL,
          destructiveText: STRING.ALL_GAME_OVER,
          //结束比赛
          destructiveButtonClicked: destructiveButtonClicked,
          buttonClicked: function(index) {
           //比赛暂停，换人等。
            hideHandler();
            $scope.eventStr = "";
            saveGameScore();
            timer.stop();
            saveGameStatus({
              isNodeOver: true
            });
          }
        });
      };

      //全场结束事件
      var destructiveButtonClicked = function (){
        var showPopup = function (){
          var confirmBtn = {
            text: "确认",
            type: 'button-positive',
            onTap: function(e) {
              timer.stop();
              $ionicLoading.show({
               template: '赛事数据上传中....'
              });
              saveGameStatus({
                isGameOver: true
              });

              //如果有未上传的数据则同步到云端
              SQLite.search("gameEventDescription",["1"],{
                uploadFlag: 0,
                gameId: $scope.gameId
              }).then(function (data) {
                if(data.length>0){
                  //如果有数据未上传，则重启上传
                  cloud.againUpload($scope.gameId).then(function (){
                    updateGameStatistics();
                  });
                  //设置本地game表，需要上传标示
                  updateGame(0);
                }else{
                  updateGameStatistics();
                  //设置本地game表，不需要上传标示
                  updateGame(1);
                }
              })

              function updateGameStatistics(){
                //比赛结束都发起统计
                http.updateGameStatistics({
                  gameId : $scope.gameId,
                  ruleId: $scope.gameEventRulesId
                });
              }
              
              function updateGame(uploadFlag){
                SQLite.update("game",{
                  uploadFlag:uploadFlag
                },{
                  id:$scope.gameId
                }).then(function(){
                  confirmPopup.close();
                  $ionicLoading.hide();
                  $scope.backMatchList();
                })
              }
            }
          }

          var btns = [];
          if($scope.sportType == 'football'){
            //如果是足球，则有加时，点球概念。
            if($scope.section == 2){
              //全场结束 有加时
              btns = [confirmBtn,{
                text: STRING.CANCEL
              },{
                text: "加时",
                onTap: function(e) {
                  timer.stop();
                  saveGameStatus({
                    isNodeOver: true
                  });
                }
              }];
            }else if($scope.section == 3){
              //全场结束 有点球
              btns = [confirmBtn,{
                text: STRING.CANCEL
              },{
                text: "点球",
                onTap: function(e) {
                  timer.stop();
                  saveGameStatus({
                    isNodeOver: true
                  });
                }
              }];
            }else{
              //点球结束
              btns = [confirmBtn,{
                text: STRING.CANCEL
              }];
            }
          }else if($scope.sportType == 'basketball'){
            btns = [confirmBtn,{
              text: STRING.CANCEL
            }];
          }

          var confirmPopup = $ionicPopup.confirm({
            title: STRING.GAME_OVER,
            template: STRING.GAME_OVER_DESC,
            buttons: btns
          });
        }

        $scope.hideHandler && $scope.hideHandler();
        showPopup();
      }

      //show事件动画
      function showEventAnime(index){
        var ev1 = $(".J_Event");
        var of = 100;

        ev1.css({
          "margin-left":"-"+index*of+"%"
        },500,'ease-out')
      }


      //show左边或者右边team。
      $scope.showTeam = function (isLeft){
        if(!$scope.showAllTeam){
          return;
        }

        if(isLeft){
          $scope.showLeftTeam = true;
        }else{
          $scope.showLeftTeam = false;
        }
      }

      //过滤目录长度，为了展示在界面上
      function filterArrLength(arr,start, length){
        var ret = [];
        for(var i =start;i<start+length;i++){
          if(!arr[i]){
            break;
          }
          ret.push(arr[i]);
        }
        return ret;
      }
      //更新比赛状态，开始结束暂停等。
      /*
        option
              isGameStart 比赛开始 
              isGameOver 比赛结束
              isNodeStart 小节开始
              isNodeOver 小节结束
              isNormalPause

      */
      function saveGameStatus(option){
        option = option || {};
        //调用此方法肯定是暂停状态，所以会记录暂停时间

        //任何状态改变都后重置1级目录，1级目录会变，比如暂停，点球什么的。
        showNormal();
        getL1Menu();
        //普通暂停
        if(option.isNormalPause){
          $scope.isNormalPause = true;
        }else{
          $scope.isNormalPause = false;
        }
        if($scope.status ==0){
          option.isGameStart = true;
        }
        var param = {
          isPause: $scope.pause?1:0,
          currentPauseSec: timer.getTime(),//最后暂停 相对时间
          currentPauseTimestamp: $scope.getSysTimestamp()//最后暂停 时间戳
        }

        //如果导播工具是自拍机，则上传比赛状态
        if($scope.liveMode == "snapeee"){
          var _param = {};
          //如果是开始比赛，则通知云端开始
          if(option.isGameStart){
            _param.gameId = $scope.gameId;
            _param.startTime = $scope.getSysDate();
            _param.status = 1;//1为开始
          }
          //如果是结束比赛，则通知云端结束
          if(option.isGameOver){
            _param.gameId = $scope.gameId;
            _param.status = 2;//2为结束
          }
         //更新云端比赛状态
          http.updateGameStatus(_param);
        }

        if(option.isGameOver){
          //更新本地结束标志位
          param.status = 2;
        }
       // }

        if(option.isGameStart){
          //更新本地比赛起始时间
          param.startTime = $scope.getSysDate(),
          //更新比赛状态为进行中
          $scope.status = param.status = 1;
        }

        var score = $scope.leftScore + ":" + $scope.rightScore;
        //小节开始/比赛开始
        if(option.isNodeStart || option.isGameStart){
          if($scope.sportType == "football"){
            switch($scope.section){
              case 1:
                //足球上半场开始
                eventManger.addEvent(23,{para1:score});
                break;
              case 2:
                //足球下半场开始
                eventManger.addEvent(25,{para1:score});
                break;
              case 3:
                //加时开始
                eventManger.addEvent(80);
                break;
              case 4:
                //点球开始
                eventManger.addEvent(82);
                break;
            }
            
          }else if ($scope.sportType == "basketball"){
            //第X小节开始
            eventManger.addEvent(21,{para1:$scope.section});
          }

          //更新game 里面的数据
          $scope.periodLeftScore = $scope.periodRightScore = 0;
          param.currentNodeSec = $scope.currentNodeSec = timer.getTime();//当前小节 开始相对时间
          param.currentNodeStartAbso = $scope.currentNodeStartAbso = $scope.getSysDate();//当前小节开 始绝对时间
        }
        //小节结束/比赛结束， 比赛结束叶要记下当节部分
        if(option.isNodeOver || option.isGameOver){
          if($scope.sportType == "football"){
            switch($scope.section){
              case 1:
                //足球上半场结束
                eventManger.addEvent(24,{para1:score});
                break;
              case 2:
                //足球下半场结束
                eventManger.addEvent(26,{para1:score});
                break;
              case 3:
                //加时结束
                eventManger.addEvent(81);
                break;
              case 4:
                //点球结束
                eventManger.addEvent(83);
                break;
            }
          }else if ($scope.sportType == "basketball"){
            eventManger.addEvent(22,{para1:$scope.section,para2:score});
          }
          //更新缓存数据
          saveAndUploadNodeScore();
          //小节数自加
          param.section = ++$scope.section;
        }

        var promise = SQLite.update("game",param,{
          id:$scope.gameId
        })

        return promise;
      }

      //更新本地game表比分 不上传
      function saveGameScore(){
        var promise = SQLite.update("game", {
          endTime: $scope.getSysDate(),//比赛结束时间，如果比赛没结束，则是最后暂停时间
          teamAScore: parseInt($scope.leftScore),
          teamBScore: parseInt($scope.rightScore),
          periodTeamAScore: parseInt($scope.periodLeftScore),
          periodTeamBScore: parseInt($scope.periodRightScore),
          section: $scope.section
        },{
          id:$scope.gameId
        })
        return promise;
      }

      //获取比赛小节名称
      function getCompetitionNode(){
        var competitionNode = "";
        if($scope.sportType == "football"){
          switch($scope.section){
            case 1:
              competitionNode = "FF";
              break;
            case 2:
              competitionNode = "FS";
              break;
            case 3:
              competitionNode = "FA";
              break;
            case 4:
              competitionNode = "FD";
              break;
          }
        }else{
          competitionNode = "B" + $scope.section;
        }
        
        return competitionNode;
      }

      //小节结束后 存储并上传小节比分
      function saveAndUploadNodeScore() {
        var obj = {
          id: $scope.gameId,
          gameId: $scope.gameId,
          competitionNode: getCompetitionNode(),
          startTime: $scope.currentNodeSec,
          endTime: timer.getTime(),
          startAbsoluteTime: $scope.currentNodeStartAbso,
          endAbsoluteTime: $scope.getSysDate(),
          teamAScore: $scope.periodLeftScore,
          teamBScore: $scope.periodRightScore
        }

        var promise = SQLite.add("competitionNodeScore", obj);

        http.addNodeScore(obj)
      }

      //撤销事件
      $scope.cancelEvent = function (){
        eventManger.cancel();
        saveGameScore();
      }

      //添加球员
      $scope.addPlayer = function (){
        $state.go("app.changeplayer",{
          matchID: $scope.gameId,
          teamID: $scope.flowEvent.sMember.teamId,
          playerID: $scope.flowEvent.sMember.playerId
        })
      }

      //隐藏某个player节点
      var hidePlayer = function (dom) {
        $(dom).hide();
      }

      //显示全部节点
      var showAllPlayer = function () {
        $(".J_Player").show();
      }

      //换人 换场上与场下人员数据
      var changeTwoPerson = function (memberNo, waitNo, node) {
        var temp = node.member[memberNo];

        node.member[waitNo] = node.wait[waitNo];
        node.member[waitNo].onPlay = 1;//表示上场
        node.member[waitNo].hasPlay = 1;
        savePlayer(node.member[waitNo]);

        node.wait[memberNo] = temp;
        node.wait[memberNo].onPlay = 0;//表示下场
        node.wait[memberNo].hasPlay = 1;
        savePlayer(node.wait[memberNo]);

        var newPlayer = node.member[waitNo];
        var oldPlayer = node.wait[memberNo];

        addChangeEvent(newPlayer, oldPlayer);

        delete node.member[memberNo];
        delete node.wait[waitNo];
      }
      //换人事件描述
      var addChangeEvent = function (newPlayer, oldPlayer){
        var para1 = newPlayer.teamName + newPlayer.playerNumber + "号" + newPlayer.playerName;
        var para2 = oldPlayer.playerNumber + "号" + oldPlayer.playerName;

        var eId = '';
        if($scope.sportType == 'basketball'){
          eId = 20;
        }else if($scope.sportType == 'football'){
          eId = 70;
        }

        eventManger.addEvent(eId,{para1:para1,para2:para2});
      }

      //检查是否 如果是由换人新增页面退回来的，需要直接加上换人事件
      var checkChangeEvent = function (){
        var side;
        if(Storage.changePlayerInfo){
          if($scope.homeTeamId == Storage.changePlayerInfo.teamId){
            side = "left";
          }else{
            side = "right";
          }

          var team = $scope.teamData[side];
          var newPlayer = getPlayer(Storage.changePlayerInfo.newPlayerId, team.member);
          var oldPlayer = getPlayer(Storage.changePlayerInfo.oldPlayerId, team.wait);
          addChangeEvent(newPlayer, oldPlayer);

          delete Storage.changePlayerInfo;
        }

        function getPlayer(id, team){
          var ret;
          $.each(team, function (key, item){
            if(item.playerId == id){
              ret = item;
            }
          })
          return ret;
        }
      }

      //恢复替补数据
      var recoverWaitData = function () {
        if ($scope.tempMemberData && $scope.step == 5) {
          if ($scope.recoverIsLeft) {
            $scope.teamData.left.member = $scope.tempMemberData;
          } else {
            $scope.teamData.right.member = $scope.tempMemberData;
          }
        }
      }

      //更新球员状态，比如换人
      var savePlayer = function (info, memberInfo) {
        var promise = SQLite.update("gamePlayers", {
          hasPlay: info.hasPlay,
          onPlay: info.onPlay,
          leave: info.leave
        }, {
          gameId: $scope.gameId,
          teamId: info.teamId,
          playerId: info.playerId
        })
      }

      //显示替补
      var showWait = function(isLeft, memberNo) {
        $scope.eventStr = "";
        $scope.changeObject = {};
        $scope.step = 5;

        var num = 0;
        var teamData = $scope.teamData;
        $scope.recoverIsLeft = isLeft;
        if (isLeft) {
          $scope.tempMemberData = teamData.left.member;
          teamData.left.member = teamData.left.wait;
          $scope.teamData = teamData;

          //如果为空要显示 无替补
          if(_.isEmpty(teamData.left.wait)){
            $scope.hasNoWaitMember = true;  
          }else{
            $scope.hasNoWaitMember = false;
          }
          $scope.showLeftTeam = true;
        } else {
          $scope.tempMemberData = teamData.right.member;
          teamData.right.member = teamData.right.wait;
          $scope.teamData = teamData;
          //如果为空要显示 无替补
          if(_.isEmpty(teamData.right.wait)){
            $scope.hasNoWaitMember = true;  
          }else{
            $scope.hasNoWaitMember = false;
          }
          $scope.showLeftTeam = false;
        }

        $scope.showAllTeam = false;
        showEventAnime(0);
      }

      //点安卓自带back按钮时，如果纠正比分浮层show着的话，先隐藏----add by danny zou
      $scope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {
        if ($scope._mobiscroll && $scope._mobiscroll.isVisible()) {
          event.preventDefault();
          $scope._mobiscroll.hide();
        }
      })
    })
  }])