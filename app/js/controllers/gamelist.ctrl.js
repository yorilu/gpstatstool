app.controller('GameListCtrl', ['$rootScope', '$scope', '$state', '$ionicHistory', '$ionicNavBarDelegate',
  '$timeout', '$ionicActionSheet', 'SQLite', 'Http', '$ionicLoading', '$filter', '$q',
  '$ionicScrollDelegate', 'Util', 'Storage', 'User', 'Cloud', 'Network','Http',
  function ($rootScope, $scope, $state, $ionicHistory, $ionicNavBarDelegate, $timeout,
            $ionicActionSheet, SQLite, http, $ionicLoading, $filter, $q,
            $ionicScrollDelegate, Util, storage, User, Cloud, Network,Http) {


    var backBtn = [];

    var MSG = {
      NO_NETWORK: '网络不可用，请检查手机网络!',
      NO_RULES: '没有赛事规则,请重新同步!'
    };
    //查询今明两天数据
    var searchMatchSql = "select g.id, g.teamAScore,g.teamBScore,g.status,g.uploadFlag,g.startTime," +
      "t1.teamname homeTeam, t1.logoId homeLogo,t1.logoUrl homeLogoUrl, t2.teamname guestTeam," +
      "t2.logoId guestLogo, t2.logoUrl guestLogoUrl,g.gameEventRulesId, " +
      " g.homeTeamId, g.guestTeamId,g.homeTeamOver, g.guestTeamOver ,g.gameType ,g.sportType," +
      " g.stadiumId, g.stadiumName,g.courtName,g.gameEventRulesId " +
      " FROM game g, team t1,team t2" +
      " where g.hometeamId = t1.id" +
      " and g.guestteamId = t2.id";

    //比赛列表
    var allatchList = [],
      futureList = [],
      lastList = [],
      curMatchList = [],
    //显示未上传比赛列表
      showUnuploadFlag = false,
    //第一次进入时,不使用下拉加载更多
      usePullAction = false,
    //事件规则
      eventRuleMap = {};


    //未上传比赛列表
    $scope.unUploadList = [];

    $scope.msg = "";

    //当前显示的比赛列表
    $scope.curMatchList = [];

    $scope.$ionicScrollDelegate = $ionicScrollDelegate;

    //加载过去的比赛数据
    $scope.loadLastMatchList = function () {
      var len = lastList.length;
      if (len > 0) {
        curMatchList = curMatchList.concat(lastList.splice(len - 5, len));
        $scope.curMatchData = getCurShowMatchData(curMatchList);
      }
      $scope.$broadcast('scroll.refreshComplete');
    };

    //加载未来的比赛
    $scope.loadFutureMatchList = function () {
      if (usePullAction && futureList.length > 0) {
        curMatchList = curMatchList.concat(futureList.splice(0, 5));
        $scope.curMatchData = getCurShowMatchData(curMatchList);
      }
      usePullAction = true;
      $scope.$broadcast('scroll.infiniteScrollComplete');
    };

    $scope.moreDataCanBeLoaded = function () {
      return futureList.length > 0;
    }

    //装换比赛状态的显示
    $scope.convertStatus = function (status) {
      var msg = "正在比赛";
      if (status == '0') {
        msg = "未开始";
      } else if (status == 1) {
        msg = "正在比赛";
      } else if (status == 2) {
        msg = "已结束"
      }
      return msg;
    };

    //装换比赛的上传状态
    $scope.convertUploadFlag = function (status, uploadFlag) {
      var msg = "";
      if (status == 2 && uploadFlag == 0) {
        msg = "数据未上传"
      }
      return msg;
    };

    //根据给定日期,显示今天明天
    $scope.transDate = function (date) {
      if (date == Util.Date.calDateByOffset(0)) {
        date = '今天';
      } else if (date == Util.Date.calDateByOffset(1)) {
        date = '明天';
      } else if (date == Util.Date.calDateByOffset(-1)) {
        date = '昨天';
      }
      return date;
    };


    //转换运动类型
    $scope.transSportType = function (type) {
      return type == "football" ? "足球" : "篮球";
    };


    //去下一页
    $scope.goNextPage = function (id) {
      var self = this,
        game = findMatchById(id),
        status = game.status;

      //未开始
      if (status == 0) {
        var startTime = Util.Date.str2mm(game.startTime);
        var serverDate = Util.Date.getServerDate(),
        todayTime = Util.Date.str2mm($filter('date')(serverDate, 'yyyy/MM/dd')),
        now = serverDate.getTime();
        //如果比赛开始时间<当天零点,过去的比赛不运行开始
        if (startTime < todayTime) {
          Util.UI.showLoading('比赛时间已过,不能开始比赛', 1000);
        } else if (startTime < now || startTime - now < 3600000) {
          //如果没有设置赛事规则,要求用户选择赛事规则
          // if (_.isUndefined(game.gameEventRulesId)) {
          if (!game.gameEventRulesId) {
            showRuleActionSheet(game)
          } else {
            checkFirstNum(game);
          }
        } else {
          // 未来的比赛,不允许开始
          Util.UI.showLoading('暂时不能开始比赛', 1000);
        }
      } else if (status == 1) {
        //正在进行
        goGameView(game);
      } else if (status == '2') {
        //已结束
        if (game.uploadFlag != 1) {
          //赛事事件数据未上传完成, 重新上传赛事数据
          if (Network.isOffline()) {
            Util.UI.showLoading(MSG.NO_NETWORK, 1000);
            return;
          } else {
            Util.UI.showLoading('赛事数据上传中......');
            Cloud.againUpload(game['id']).then(function () {
              getMatchList();
              Util.UI.hideLoading();
              //补传成功,再通知服务端重新统计.
              http.updateGameStatistics({
                gameId :game['id'],
                ruleId: game.gameEventRulesId
              });
            }, function () {
              Util.UI.showLoading('上传失败,请稍候重试', 1000);
            })
          }
        } else {
          //已结束/已上传,允许进入赛事统计
          if (game.sportType == 'basketball') {
            $state.go('app.basketballstat', {matchID: id});
          } else {
            $state.go('app.footballstat', {matchID: id});
          }
        }

      }
    };

    //用户登出
    $scope.logout = function () {
      Cloud.firstSync = true;
      User.logout();

      $state.go('login');
    };

    /**
     * 云同步
     */
    $scope.cloudSync = function () {
      Util.UI.showLoading();
      Cloud.getGamesByScorer()
        .then(function (gameIds) {
          if(gameIds.length>0){
            return Cloud.getGameTeams({'gameIds': gameIds});
          }
        }).then(function(){
          $scope.msg = "";
          getMatchList();
          return Cloud.getGameRules();
        },function(){
          getMatchList();
          $scope.msg = MSG.NO_NETWORK;
        }).then(function () {
          return selectEventRules();
        }, function () {
          Util.UI.hideLoading();
          selectEventRules();
          $scope.msg = MSG.NO_NETWORK;
        }).then(function () {
          Util.UI.hideLoading();
        }, function () {
          //显示网络失败
          selectEventRules();
          Util.UI.hideLoading();
        })
    };
    //
    //新建比赛
    $scope.showActionSheet = function () {

      if (Network.isOffline()) {
        Util.UI.showLoading('未连接网络,请连接网络后重试.', 1000);
        return;
      }

      window.actionSheetIsShow = true;
      // 显示操作表
      $ionicActionSheet.show({
        buttons: [{
          text: '足球',
          value: 'football'
        }, {
          text: '篮球',
          value: 'basketball'
        }],
        titleText: '选择运动类型',
        cancelText: '取消',
        buttonClicked: function (index, obj) {
          window.actionSheetIsShow = false;
          $state.go('app.addmatch', {
            type: obj.value
          });
        }
      });
    };

    //选择事件规则
    function showRuleActionSheet(game) {
      var rules = eventRuleMap[game.sportType];
      if(rules.length == 0){
        Util.UI.showLoading(MSG.NO_RULES, 1000);
        return ;
      }
      window.actionSheetIsShow = true;
      $ionicActionSheet.show({
        buttons: rules,
        titleText: '选择事件模板',
        cancelText: '取消',
        buttonClicked: function (index, obj) {
          window.actionSheetIsShow = false;
          game.gameEventRulesId = obj.value;
          //game表保存gameEventRuleID
          SQLite.update('game', {
            gameEventRulesId: obj.value
          }, {
            "id": game['id']
          }).then(function () {
            checkFirstNum(game);
          })
        }
      })
    };


    //获取事件规则
    function selectEventRules() {
      eventRuleMap = {};
      SQLite.getEventRules().then(function (rules) {
        _.each(rules, function (item, key) {
          var sportType = item.sportType;
          if (!eventRuleMap[sportType]) {
            eventRuleMap[sportType] = []
          }
          eventRuleMap[sportType].push({
            text: item.ruleName,
            value: item.ruleId
          })
        });
      })
    };

    //检查首发
    function checkFirstNum(game) {
      //今天0点-开始1小时的比赛允许开始
      var gameType = game.gameType.toUpperCase();
      //参加比赛的人数
      var gameNum = gameType.split('V')[0];

      //检查比赛数目
      SQLite.getGamePlayerNum(game).then(function (data) {
        var teamIds = [];
        //如果比赛的首发小于比赛要求的人数,要求选择首发
        if (data.home < gameNum) {
          teamIds.push(game.homeTeamId);
        }
        if (data.guest < gameNum) {
          teamIds.push(game.guestTeamId);
        }

        if (teamIds.length > 0) {
          $state.go('app.starter', {
            matchId: game["id"],
            number: gameNum,
            teamgroup: teamIds.join(','),
            type: game.sportType
          });
        } else {
          goGameView(game);
        }
      })
    }

    //去比赛页
    function goGameView(game) {
      var toView = 'app.game';
      if (game.sportType == "football") {
        toView = 'app.gamefot';
      }
      $state.go(toView, {matchId: game['id']});
    }


    function init() {
      var isResume = window.localStorage.getItem('isResume');
      if (Cloud.firstSync && !isResume) {
        $scope.cloudSync();
        Cloud.firstSync = false;
      } else {
        selectEventRules();
        getMatchList();
      }
      window.localStorage.removeItem('isResume');
    }

    //显示未上传的比赛
    $scope.showUploadMatch = function () {
      //只允许点击一次,触发显示未上传比赛列表
      if (showUnuploadFlag) {
        return;
      }
      showUnuploadFlag = true;
      // alert('aa');
      $scope.curMatchData = getCurShowMatchData($scope.unUploadList);
      //$scope.backBtn.removeClass('hide');
      //$scope.backBtn.one('click', restoreMatchList);
    };


    //退出显示未上传
    function restoreMatchList() {
      showUnuploadFlag = false;
      $scope.backBtn.addClass('hide');
      $scope.$apply(function () {
        $scope.curMatchData = getCurShowMatchData(curMatchList);
      })
    };

    /**
     * 查询比赛列表
     */
    function getMatchList() {
      usePullAction = false;
      $scope.unUploadList = [];
      var today = $filter('date')(new Date(), 'yyyy-MM-dd');
      var futureMatchList = searchMatchSql + " and g.startTime >= ? order by g.startTime",
        lastMatchList = searchMatchSql + " and g.startTime < ? order by g.startTime";

      //查询今天至未来的数据
      var futureP = SQLite.execute(futureMatchList, [today]).then(function (data) {
        futureList = data;
      });
      var lastP = SQLite.execute(lastMatchList, [today]).then(function (data) {
        lastList = data;
      });

      //过去未来的数据都查询完
      var promise = $q.all([futureP, lastP]);
      promise.then(function () {
        allatchList = futureList.concat(lastList);

        //被上传赛事
        for (var i in allatchList) {
          var match = allatchList[i];
          //已完成,未上传
          if (match.uploadFlag == 0 && match.status == 2) {
            $scope.unUploadList.push(match);
          }
        }
        //当前在页面显示的
        curMatchList = futureList.splice(0, 5);
        var curNum = curMatchList.length;
        //默认一屏显示5条
        if (curNum < 5) {
          curMatchList = curMatchList.concat(lastList.splice(0, 5 - curNum));
          //当填充了历史数据后,操作滚动条,使今天在首屏
          if (curNum <= 3) {
            $timeout(function () {
              $ionicScrollDelegate.scrollBottom()
            }, 500);
          }
        }
        if ($scope.unUploadList.length > 0) {
          $scope.msg = "您本地还有" + $scope.unUploadList.length + "场赛事数据未提交，请尽快处理！";
        } else if ($scope.msg != MSG.NO_NETWORK) {
          $scope.msg = "";
        }

        $scope.curMatchData = getCurShowMatchData(curMatchList)

      })
    };

    //将比赛List 转换为以日期key的Map
    function getCurShowMatchData(list) {
      var matchMap = {};
      angular.forEach(list, function (item, key) {
        //截取日期
        var matchDate = item.startTime.substring(0, item.startTime.indexOf(' '));
        if (!matchMap[matchDate]) {
          matchMap[matchDate] = [item];
        } else {
          matchMap[matchDate].push(item);
        }
      })

      return matchMap;
    };

    /**
     * 根据ID查询赛事信息
     * @param matchId
     * @returns {*}
     */
    function findMatchById(matchId) {
      var list = allatchList;
      for (var i in list) {
        if (list[i].id == matchId) {
          return list[i];
        }
      }
    };


    init();

    //每次进入此页面,隐藏back
    $scope.$on('$ionicView.afterEnter', function () {
      usePullAction = false;
      //setTimeout(function () {
      //  $scope.backBtn = $('[nav-bar=active] ion-header-bar button');
      //  if ($state.current.name == 'app.gamelist') {
      //    $scope.backBtn.addClass('hide');
      //  }
      //}, 100)
    });
  }
]);

