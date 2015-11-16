/**
 * Created by danny zou on 15/7/9.
 */

app.factory('Camera', ['$q', function ($q) {

  var _fun = function (opt, successCb, errorCb) {
    //var deferred = $q.defer();
    if (!navigator.camera) {
      errorCb && errorCb('设备不支持');
    } else {
      var camera = navigator.camera;
      var success = function (data) {
        successCb && successCb(data + '?t=' + (new Date()).getTime());
        // if (ionic.Platform.isIOS()) {
        //   camera.cleanup();
        // }
      };
      var error = function (message) {
        errorCb && errorCb(message);
      };
      camera.getPicture(success, error, opt);
    }
  };

  var camera = {
    //拍照
    takePhoto: function (successCb, errorCb, opt) {
      var _default = {};
      if (ionic.Platform.isIOS()) {
        _default = {
          quality: 20,
          correctOrientation: true,
          allowEdit: true,
          destinationType: 1
        }
      } else {
        _default = {
          quality: 30,
          correctOrientation: true,
          allowEdit: true,
          destinationType: 1,
          targetWidth: 1280,
          targetHeight: 1280
        }
      }
      var option = opt || _default;
      _fun(option, successCb, errorCb);
    },
    //相册
    getPhoto: function (successCb, errorCb, opt) {
      var option = opt || {
          quality: 30,
          correctOrientation: true,
          sourceType: 2,
          allowEdit: true,
          destinationType: 1,
          targetWidth: 1280,
          targetHeight: 1280
        };
      _fun(option, successCb, errorCb);
    }
  };

  return camera;

}]);

