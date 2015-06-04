define(['app', 'require-text!loginTpl', 'http'], function (app, loginTpl) {

    return app.controller('MatchListCtrl', ['$scope', '$state', '$ionicModal', '$ionicNavBarDelegate',
        '$timeout', '$ionicActionSheet', 'SQLite', 'network', 'http', '$ionicLoading',
        function ($scope, $state, $ionicModal, $ionicNavBarDelegate, $timeout, $ionicActionSheet, SQLite, network, http, $ionicLoading) {
            $ionicNavBarDelegate.showBackButton(false);

            var searchMatch = "select g.id, g.teamAScore,g.teamBScore,g.status,g.uploadFlag," +
                "t1.teamname hometeam, t1.logoId homeLogo, t2.teamname guestteam,t2.logoId guestLogo" +
                " FROM game g, team t1,team t2" +
                " where g.hometeamId = t1.id" +
                " and g.guestteamId = t2.id";

            //获取比赛列表
            SQLite.execute(searchMatch).then(function (data) {
                if (data.length > 0) {
                    $scope.matchList = data;
                } else {
                    //demo数据
                    $scope.matchList = [{
                        id: 1,
                        homeTeam: '勇士',
                        homeLogo: '03.jpg',
                        guestTeam: '骑士',
                        guestLogo: '05.jpg',
                        teamAScore: '93',
                        teamBScore: '64',
                        status: '1',
                        uploadFlag: '0'
                    }, {
                        id: 2,
                        homeTeam: '勇士',
                        homeLogo: '03.jpg',
                        guestTeam: '骑士',
                        guestLogo: '09.jpg',
                        teamAScore: '40',
                        teamBScore: '64',
                        status: '2',
                        uploadFlag: '1'
                    }, {
                        id: 3,
                        homeTeam: '勇士',
                        homeLogo: '09.jpg',
                        guestTeam: '骑士',
                        guestLogo: '11.jpg',
                        teamAScore: '140',
                        teamBScore: '164',
                        status: '2',
                        uploadFlag: '0'
                    }]
                }
            });

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

            //去下一页
            $scope.goNextPage = function (id, status, uploadFlag) {
                //http.uploadGame(id).then(function (data) {
                //    $ionicLoading.hide();
                //}, function () {
                //    $ionicLoading.hide();
                //});
                if (status < 2) {
                    $state.go('app.game', {matchID: id});
                } else if (status == '2') {
                    if (uploadFlag != 1) {
                        $ionicLoading.show({
                            template: '赛事数据上传中....'
                        });
                        //上传比赛数据
                        http.uploadGame(id).then(function (data) {
                            $ionicLoading.hide();
                        }, function () {
                            $ionicLoading.hide();
                        });
                        //$state.go('app.starter', {matchID: id});
                    } else {
                        $state.go('app.matchstat', {matchID: id});
                    }

                }
            };


            $scope.showActionSheet = function () {

                // 显示操作表
                $ionicActionSheet.show({
                    buttons: [{
                        text: '足球'
                    }, {
                        text: '篮球'
                    }],
                    titleText: '选择运动类型',
                    cancelText: '取消',
                    buttonClicked: function (index, obj) {
                        $state.go('app.addmatch', {
                            type: obj.text
                        });

                    }
                });

            };

            // Form data for the login modal
            $scope.loginData = {};
            // Create the login modal that we will use later
            $scope.modal = $ionicModal.fromTemplate(loginTpl, {
                scope: $scope
            });
            // Triggered in the login modal to close it
            $scope.closeLogin = function () {
                $scope.modal.hide();
            };

            // Open the login modal
            $scope.showLogin = function () {
                $scope.modal.show();
            };

            // Perform the login action when the user submits the login form
            $scope.doLogin = function () {
                console.log('Doing login', $scope.loginData);

                // Simulate a login delay. Remove this and replace with your login
                // code if using a login system
                http.login($scope.loginData).then(function(){
                    $scope.closeLogin();
                },function(){
                    $ionicLoading.show({
                       template: '登录失败,您可以选择比赛结束后上传....',
                        duration:1000
                    });
                })

            };

            //如果没有登录,且网络畅通,请求登录
            SQLite.checkLogin().then(function(){

            },function(){
                if ( network.isOnline()) {
                    $scope.showLogin();
                }
            })

            $scope.$on('$stateChangeStart', function () {
                $ionicNavBarDelegate.showBackButton(true);
            });
        }
    ]);

});