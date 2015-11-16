app.controller('SearchAreaCtrl', ['$scope', '$stateParams', '$timeout', '$ionicPopup', '$ionicHistory', 'Http', 'Storage','Util',
    function($scope, $stateParams, $timeout, $ionicPopup, $ionicHistory, http, storage,util) {

      $scope.data = [];

      $scope.storage = storage;

      $scope.searchData = {
        keyword: storage.areaDetail.name
      }

      $scope.search = function() {
        if ($.trim($scope.searchData.keyword) == '') {
          $scope.data = [];
          return;
        }
        util.UI.showLoading();
        http.searchStadium($scope.searchData.keyword, $stateParams.type)
          .then(function(data) {
            util.UI.hideLoading();
            if (data.data && data.data.length > 0) {
              $scope.data = data.data;
            } else {
              $scope.data = [];
            }
          }, function(data) {
            util.UI.hideLoading();
            util.UI.showLoading('网络错误，请检查网络后重试', 1000);
            $scope.data = [];
          });
      }
      if ($scope.searchData.keyword) {
        $scope.search();
      }
      $scope.select = function(item) {
        util.UI.showLoading();
        http.searchCourt(item.id)
          .then(function(data) {
            util.UI.hideLoading();
            if (data.data && data.data.courtList && data.data.courtList.length > 0) {
              $scope.storage.areaDetail = {
                id: item.id,
                name: item.name,
                cityId:item.cityId,
                courtList: data.data.courtList
              };
              $scope.storage.courtDetail = {
                id: '',
                name: ''
              }
              $ionicHistory.goBack();
            } else {
              util.UI.showLoading('该场馆下没有对应的场地', 1000);
            }

          }, function(data) {
            util.UI.hideLoading();
            util.UI.showLoading('网络错误，请检查网络后重试', 1000);
          });
      }
    }
  ]);