define(['app', 'util', 'mobiscroll'], function(app, util) {
  return app.controller('GameCtrl', ['$scope', 'util', '$ionicActionSheet','$ionicPopup', '$ionicPopover', 'SQLite','$state','$stateParams', '$ionicHistory',
    function($scope, util, $ionicActionSheet, $ionicPopup, $ionicPopover, SQLite, $state, $stateParams, $ionicHistory) {
    $scope.util = util;
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
      UPLOAD_GAME_DATA: '确认结束本场比赛，上传赛事数据！',
      ADMIN_MODIFY_SCORE: "记分员xxx 17:37:37执行纠正比分操作，操作前为10：10操作后10：20",
    }
    
    $(function (){      
        
      var init = function (){
        var wheelVal = [];
        for(var i=0;i<400;i++){
          wheelVal.push(i);
        }
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
                text: '确定',
                handler: function (event, inst) { 
                  $("#J_Scroller").mobiscroll('cancel');
                  var v = inst.getVal().split(" ");
                  $scope.leftScore = parseInt(v[0]);
                  $scope.rightScore = parseInt(v[1]);
                  $scope.$apply();
                } 
            },
            { 
                text: '取消',
                handler: function (event, inst) { 
                  $("#J_Scroller").mobiscroll('cancel');
                } 
            }
          ],
          wheels: [[
              {
                  label:"teama",
                  keys: wheelVal,
                  values: wheelVal
              },
              {
                  label:"teamb",
                  keys: wheelVal,
                  values: wheelVal
              }
          ]]
        });
      }

      var $timer = $(".J_Timer");
      var timer = {
        time:0,
        intervalHandler: null,
        ing: false,
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
        start: function (){
          var that = this;
          this.ing = true;
          $scope.timerStr = STRING.PAUSE;
         // $scope.$apply();
          this.intervalHandler = setInterval(function (){
            that.time += .1;
            var time = that.formatTime(that.time);
            $timer.html(time);
          },100)
        },
        stop: function (){
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
      $scope.currentSection = 1;
      
      $scope.timerStr = STRING.START;
      
      /*init*/
      var matchID = $stateParams.matchID;
      var getGameSql = "select a.hometeamid,a.guestteamid,a.gameType,"+
                        "b.gameid,b.teamid,b.playerid,b.isfirst,b.onplay,"+
                        "c.teamname,"+
                        "d.PlayerName,d.PlayerNumber "+
                        "from game a,gameplayers b,Team c,Player d "+
                        "where a.id = b.gameid and b.teamid = c.id and d.id = b.playerID and a.id = '"+matchID+"'";
      var teamData;
      SQLite.execute(getGameSql).then(function (data) {
        //if(0) {
        if (data.length > 0) {
            var guestTeamId = data[0].guestTeamId;
            var homeTeamId = data[0].homeTeamId;
            var homeTeam;
            var guestTeam;
            $scope.gameType = data[0].gameType;
            
            teamData = {
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
              if(item.teamID == homeTeamId){
                teamData.left.teamName = item.teamName;
                if(item.onPlay == "true"){
                  addMember(teamData.left.member,item);
                }else{
                  addMember(teamData.left.wait,item);
                }
                
              }else{
                teamData.right.teamName = item.teamName;
                if(item.onPlay == "true"){
                  addMember(teamData.right.member,item);
                }else{
                  addMember(teamData.right.wait,item);
                }
              }
            })
          $scope.teamData = teamData;
          init();
        } else {
        
           var confirmPopup = $ionicPopup.confirm({
             title: '读取数据失败',
             buttons: [
                  {
                     text: '返回',
                     type: 'button-positive',
                     onTap: function(e) {
                       $ionicHistory.goBack();
                     }
                  }
                ]
           });
         
         /*
          $scope.teamData = teamData = {
            left: {
              teamName: "上海梦之队",
              member:{
                "1": {
                  playerName: "无名1",
                  playerID:"11111",
                  onplay: true
                },
                "2": {
                  playerName: "无名2",
                  playerID:"222222",
                  onplay: true
                },
                "3": {
                  playerName: "无名3",
                  playerID:"33333",
                  onplay: true
                }
              },
              wait: {
                "4": {
                  playerName: "无名4",
                  playerID:"444444",
                  onplay: false
                },
                "5": {
                  playerName: "无名5",
                  playerID:"55555",
                  onplay: false
                }
              }
            },
            right: {
              teamName: "北京梦之队",
              member: {
                "8": {
                  playerName: "无名8",
                  playerID: "88888",
                  onplay: true
                },
                "9": {
                  playerName: "无名9",
                  playerID: "99999",
                  onplay: true
                },
                "10": {
                  playerName: "无名10",
                  playerID: "10101010101",
                  onplay: true
                }
              }
            }
          }
          */
        }
      })
      
      $scope.toggleTimer = function (){
        if(timer.ing){
          //timer.stop();
          var hideHandler = $ionicActionSheet.show({
            buttons: [{
              text: STRING.HOME_TEAM_SUBSTITUTION
            }, {
              text: STRING.VISIT_TEAM_SUBSTITUTION
            }, {
              text: STRING.SECTION_OVER
            }],
            titleText: STRING.CHOOSE_OPERATE,
            cancelText: STRING.CANCEL,
            destructiveText: STRING.ALL_GAME_OVER,
            destructiveButtonClicked: function (){
              hideHandler();
              var confirmPopup = $ionicPopup.confirm({
                title: STRING.GAME_OVER,
                template: STRING.UPLOAD_GAME_DATA,
                buttons: [
                  { 
                    text: STRING.CONFIRM,
                    type: 'button-positive',
                    onTap: function(e) {
                      timer.stop();
                    }
                  },
                  {
                    text: STRING.CANCEL
                  }
                ]
              });
             
              confirmPopup.then(function(res) {
                if(res) {
                  //TODO  upload your data.
                } 
              });
            },
            cancel: function (){
            
            },
            buttonClicked: function(index) {
              timer.stop();
              hideHandler();
              showNormal();
              switch(index){
                case 0:
                  //home team substitution
                  $scope.cStep = 'change';
                  showSideTeam(true,null,true);
                  break;
                case 1:
                  //guest team substitution
                  $scope.cStep = 'change';
                  showSideTeam(false,null,true);
                  break;
                case 2:
                  //section over
                  $scope.currentSection++;
                  
                  break;
              }
            }
          });
        }else{
          timer.start();
        }
      }
    
      /*
      * $scope.cStep=0 没有操作
      * $scope.cStep=1 一级菜单
      * $scope.cStep=2 二级菜单
      * $scope.cStep='select'
      */
      $scope.stepOneClicked = function (event){
        var t = event.target;
        var $t = $(t);
        if($t.hasClass("J_Event")){
          var ev = $t.attr("data-event");
          ev = isNaN(ev)?ev:parseInt(ev);
          
          eventObject.event = ev;
          
          var ret = eventMgr(ev, eventObject, teamData);
          if(ret.stepTwo){
            $scope.stepTwoData = ret.stepTwo;
            $scope.showSecSetp = true;
            $scope.showFirstSetp = false;
          }
        }
      }
      
      $scope.stepTwoClicked = function (event){
        var t = event.target;
        var $t = $(t);
        if($t.hasClass("J_Event")){
          var ev = $t.attr("data-event");
          ev = isNaN(ev)?ev:parseInt(ev);
          
          eventObject.tEvent = ev;
          
          var ret = eventMgr(ev, eventObject, teamData);
        }
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
      var eventMgr = function (event, eventObject, teamData){
        var u = $scope.util;
        var ret = {};
        var eo = eventObject;
        var si = getMemInfo({
          isLeft: eo.sIsLeft,
          no: eo.sMember
        },teamData);
        var ti = getMemInfo({
          isLeft: eo.tIsLeft,
          no: eo.tMember
        },teamData);
        
        if(eo.finished){
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
        
        var cCompetitionNode = "";
        function sqAddEvent(eventType,playerA,playerB,score){
          var eventTime = timer.time.toFixed(1);
          var promise = SQLite.add("gameEvent", {
            gameID: matchID,
            competitionNode: cCompetitionNode,
            eventType: eventType,
            playerA: playerA,
            playerB: playerB,
            score: score,
            eventTime: eventTime,
            competitionNode: "b"+ $scope.currentSection
          })
          
          promise.then(function (eventId){
            $scope.cEventId.push(eventId);
          })

          if(score!=0){
            if(eo.sIsLeft == "1"){
              $scope.leftScore += score;
            }else{
              $scope.rightScore += score;
            }
          }
        }
        
        function addDesc(desc){
          var eventTime = timer.time.toFixed(1);
          var promise = SQLite.add("gameEventDesc", {
            gameID: matchID,
            desc: desc,
            eventTime: eventTime
          })
          
          promise.then(function (eventId){
            $scope.cDescEventId.push(eventId);
          })
        }
        
        function finishEvent(){
          $scope.cEventId = [];
          $scope.cDescEventId = [];
          var e = typeof eo.event != 'undefined'? eo.event : "";
          var te = typeof eo.tEvent != 'undefined'? eo.tEvent : "";
          var _case = e + "" + te  + "";
          var str = "";
          var pa = si.playerID;
          var pb = ti.playerID;
          var paName = si.playerName;
          var pbName = ti.playerName;
          switch(_case){
            case '0':
              //罚球命中
              str = "{0}{1}号{2}罚球命中";
              sqAddEvent(2,pa,"",1);
              break;
            case '59':
              //罚球不中，进攻篮板
              str = "{0}{1}号{2}罚球未命中，{4}号{5}抢到篮板";
              sqAddEvent(2,pa,"",0);
              sqAddEvent(3,pb,"",0);
              break;
            case '5a':
              //罚球不中，防守篮板
              str = "{0}{1}号{2}罚球未命中，{3}{4}号{5}抢到篮板";
              sqAddEvent(2,pa,"",0);
              sqAddEvent(3,pb,"",0);
              break;
            case '5b':
             //罚球不中球队篮板
              str = "{0}{1}号{2}罚球未命中，球队篮板";
              sqAddEvent(2,pa,"",0);
              break;
            case '5c':
            //罚球不中无篮板
              str = "{0}{1}号{2}罚球未命中，无篮板";
              sqAddEvent(2,pa,"",0);
              break;
            case '1d':
             //2分命中有助攻
              str = "{0}{1}号{2}2分命中，{4}号{5}助攻";
              sqAddEvent(0,pa,"",2);
              sqAddEvent(4,pb,pa,0);
              break;
            case '1e':
             //2分命中无助攻
              str = "{0}{1}号{2}2分命中";  
              sqAddEvent(0,pa,"",2);
              break;
            case '69':
              //2分不中进攻篮板
              str = "{0}{1}号{2}2分未命中，{4}号{5}抢到篮板"; 
              sqAddEvent(0,pa,"",0);
              sqAddEvent(3,pb,"",0);
              break;
            case '6a':
              //2分不中进攻篮板
              str = "{0}{1}号{2}2分未命中，{3}{4}号{5}抢到篮板"; 
              sqAddEvent(0,pa,"",0);
              sqAddEvent(3,pb,"",0);
              break;
            case '6b':
             //2分不中球队篮板
              str = "{0}{1}号{2}2分未命中，球队篮板";
              sqAddEvent(0,pa,"",0);
              break;
            case '6f':
             //2分不中出界
              str = "{0}{1}号{2}2分未命中，球出界";
              sqAddEvent(0,pa,"",0);
              break;
            case '6g':
             //2分不中盖帽
              str = "{0}{1}号{2}2分未命中，被{3}{4}号{5}盖帽";
              sqAddEvent(0,pa,"",0);
              sqAddEvent(8,pb,pa,0);
              break;
            case '2d':
             //3分命中有助攻
              str = "{0}{1}号{2}3分命中，{4}号{5}助攻";
              sqAddEvent(1,pa,"",3);
              sqAddEvent(4,pb,pa,0);
              break;
            case '2e':
             //3分命中无助攻
              str = "{0}{1}号{2}3分命中";  
              sqAddEvent(1,pa,"",3);
              break;
            case '79':
              //3分不中进攻篮板
              str = "{0}{1}号{2}3分未命中，{4}号{5}抢到篮板"; 
              sqAddEvent(1,pa,"",0);
              sqAddEvent(3,pb,"",0);
              break;
            case '7a':
              //3分不中进攻篮板
              str = "{0}{1}号{2}3分未命中，{3}{4}号{5}抢到篮板"; 
              sqAddEvent(1,pa,"",0);
              sqAddEvent(3,pb,"",0);
              break;
            case '7b':
             //3分不中球队篮板
              str = "{0}{1}号{2}3分未命中，球队篮板";
              sqAddEvent(1,pa,"",0);
              break;
            case '7f':
             //3分不中出界
              str = "{0}{1}号{2}3分未命中，球出界";
              sqAddEvent(1,pa,"",0);
              break;
            case '7g':
             //3分不中盖帽
              str = "{0}{1}号{2}3分未命中，被{3}{4}号{5}盖帽";
              sqAddEvent(1,pa,"",0);
              sqAddEvent(8,pb,pa,0);
              break;
            case '3':
             //抢断
              str = "{3}{4}号{5}进攻中被{0}{1}号{2}抢断";
              sqAddEvent(5,pa,pb,0);
              break;
            case '4':
             //失误
              str = "{0}{1}号{2}出现失误";
              sqAddEvent(6,pa,"",0);
              break;
            case '8':
             //犯规
              str = "{0}{1}号{2}对{3}{4}号{5}犯规";
              sqAddEvent(7,paName,pbName,0);
              break;
          };
          
          /*
            {0} 左边队名
            {1} 发起者号码
            {2} 发起者名字
            {3} 被动者队名
            {4} 被动者号码
            {5} 被动者名字
          */
          
          str = $scope.util.formatStr(str,si.teamName,eo.sMember,si.playerName,ti.teamName,eo.tMember,ti.playerName);
          addDesc(str);
          $scope.eventStr =str;
          showNormal();
        }
        
        switch(event){
          case 0:
            //罚球命中
            finishEvent();
            break;
          case 1:
            //2分命中
            ret = {
              stepTwo: {
                left:{
                  name: '2分命中'
                },
                right: [
                  {name: '有助攻',event: 'd'},
                  {name: '无助攻',event: 'e'}
                ]
              }
            }

            break;
          case 2:
            //3分命中
            ret = {
              stepTwo: {
                left:{
                  name: '3分命中'
                },
                right: [
                  {name: '有助攻',event: 'd'},
                  {name: '无助攻',event: 'e'}
                ]
              }
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
                left:{
                  name: '罚球不中'
                },
                right: [
                  {name: '进攻篮板',event: 9},
                  {name: '防守篮板',event: 'a'},
                  {name: '球队篮板',event: 'b'},
                  {name: '无篮板',event: 'c'},
                ]
              }
            }
            break;
          case 6:
            //2分不中
            ret = {
              stepTwo: {
                left:{
                  name: '2分不中'
                },
                right: [
                  {name: '进攻篮板',event: 9},
                  {name: '防守篮板',event: 'a'},
                  {name: '球队篮板',event: 'b'},
                  {name: '出界',event: 'f'},
                  {name: '盖帽',event: 'g'}
                ]
              }
            }
            break;
          case 7:
            //3分不中
            ret = {
              stepTwo: {
                left:{
                  name: '3分不中'
                },
                right: [
                  {name: '进攻篮板',event: 9},
                  {name: '防守篮板',event: 'a'},
                  {name: '球队篮板',event: 'b'},
                  {name: '出界',event: 'f'},
                  {name: '盖帽',event: 'g'}
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
        }

        return ret;
      }
      
      /*
      * member.isLeft;
      * member.no
      *
      */
      var getMemInfo = function (member, teamData){
        var team;
        if(member.isLeft){
          team = teamData.left;
        }else{
          team = teamData.right;
        }
        var teamName = team.teamName;
        var memberName;
        var id;
        if(typeof member.no != 'undefined'){
          return team.member[member.no]
        }else{
          return {};
        }
      }
        
      $scope.cStep = 0;
      $scope.tempMemberData = null;
      var eventObject;
      $scope.playerClicked = function ($event){
        if(!timer.ing && ($scope.cStep !='change' && $scope.cStep !='change2')){
          var confirmPopup = $ionicPopup.confirm({
            title: "提示",
            template: "开始比赛才能操作",
            buttons: [
              { 
                text: STRING.CONFIRM,
                type: 'button-positive'
              }
            ]
          });
          return;
        }
        var t = $event.target;
        var $t = $(t);
        var isLeft = $t.attr('data-left');
        var memberNo = $t.attr("data-no");
        
        
        if($scope.cStep == 0){
          $scope.cStep = 1;
          eventObject = {};
          eventObject.sIsLeft = isLeft;
          eventObject.sMember = memberNo;
          eventObject.sDom = $t;
          hideOtherPlayer($t);
          if(isLeft){
            $scope.showRightTeam = false;
            $scope.showFirstSetp = true;
          }else{
            $scope.showLeftTeam = false;
            $scope.showFirstSetp = true;
          }
        }else if($scope.cStep == "selectMember"){
          eventObject.tIsLeft = isLeft;
          eventObject.tMember = memberNo;
          eventObject.tDom = $t;
          eventObject.finished = true;
          eventMgr(undefined, eventObject,teamData);
        }else if($scope.cStep == "change"){
          eventObject = {};
          eventObject.sIsLeft = isLeft;
          eventObject.sMember = memberNo;
          $scope.cStep = "change2";
          
          if(isLeft){
            $scope.tempMemberData = teamData.left.member
            teamData.left.member = teamData.left.wait;
            $scope.teamData = teamData;
          }else{
            $scope.tempMemberData = teamData.right.member
            teamData.right.member = teamData.right.wait;
            $scope.teamData = teamData;
          }
        }else if($scope.cStep == "change2"){
          eventObject.tIsLeft = isLeft;
          eventObject.tMember = memberNo;
          if(isLeft){
            teamData.left.member = $scope.tempMemberData;
            changeTwoPerson(eventObject.sMember,eventObject.tMember,teamData.left);
            $scope.teamData = teamData;
          }else{
            teamData.right.member = $scope.tempMemberData;
            changeTwoPerson(eventObject.sMember,eventObject.tMember,teamData.right);
            $scope.teamData = teamData;
          }
          showNormal();
        }else{
          $scope.cStep = 0;
          showNormal();
        }
      }
      
      $scope.cancelEvent = function (){
        //TODO;
        $scope.eventStr = "";
        $.each($scope.cEventId,function (index, id){
          SQLite.delete("GameEvent", {
            eventID: id
          })
        })
        
        $.each($scope.cDescEventId,function (index, id){
          SQLite.delete("GameEventDesc", {
            eventID: id
          })
        })
    
      }
      
      var changeTwoPerson = function (memberNo, waitNo, node){
        var temp = node.member[memberNo];
        node.member[waitNo] = node.wait[waitNo];
        node.wait[memberNo] = temp;
        delete node.member[memberNo];
        delete node.wait[waitNo];
      }
      
      var showNormal = function (){
        $scope.cStep = 0;
        $scope.showLeftTeam = true;
        $scope.showRightTeam = true;
        $scope.showFirstSetp = false;
        $scope.showSecSetp = false;
        showAllPlayer();
      }
      
      var hidePlayer = function (dom){
        $(dom).hide();
      }
      
      var hideOtherPlayer = function (dom){
        $(".J_Player").not(dom).hide();
      }
      var showAllPlayer = function (){
        $(".J_Player").show();
      }
      
      var showSideTeam = function (isLeft, hideDom, isChange){
        if(isChange){
          $scope.cStep = 'change';
        }else{
          $scope.cStep = 'selectMember';
        }
        
        showAllPlayer();
        $scope.showFirstSetp = false;
        $scope.showSecSetp = false;
        if(isLeft){
          $scope.showLeftTeam = true;
          $scope.showRightTeam = false;
        }else{
          $scope.showRightTeam = true;
          $scope.showLeftTeam = false;
        }
        hideDom && hidePlayer(hideDom);
      }
    })
  }]);
});