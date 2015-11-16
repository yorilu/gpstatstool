/**
 * Created by anders on 15/6/1.
 */
app.factory('Geolocation', ['$q', '$log', '$cacheFactory', '$http',
  function ($q, $log, $cacheFactory, $http) {
    var geo = navigator.geolocation,
      geoCache = $cacheFactory('geoCache');
    var geoService = {

      /**
       * @ngdoc function
       * @name smartCourtLib.scGeo#getCurrentPosition
       * @methodOf smartCourtLib.scGeo
       * @description
       *  获取当前位置的经纬度,为baidu经纬度格式
       * @param {object=} options 定位选项
       * @param {boolean} options.enableHighAcuracy 是否开启高精度定位，默认为false
       * @param {number} options.timeout 定位超时时间，默认为3s
       * @example
       *  <pre>
       *    //获取定位promise
       *    var geoPromise = scGeo.getCurrentPosition();
       *
       *    geoPromise.then(function (data) {
             *      //成功处理
             *      //数据格式为
             *      data = {
             *        "longitude" : 121.4712441,
             *        "latitude" : 31.2723774
             *      }
             *    },function (data) {
             *      //失败处理
             *      //数据格式为
             *      data = {
             *        "message“：”失败说明“,
             *       "code":"错误码"
             *      }
             *      //错误码定义
             *      //UNKNOW_ERROR|PERMISSION_DENIED|POSITION_UNAVALIABLE|TIMEOUT
             *    })
       *  </pre>
       */

      getCurrentPosition: function (options) {

        var cache = geoCache.get('currentPosition');
        if (cache) {
          var defer = $q.defer;
          defer.resolve(cache)
          return defer.promise;
        } else {
          var gpsPromise = this.getGPSPosition(options);
          return gpsPromise.then(
            this.convBaiduPos
          )
        }
      },

      /**
       * 获取GPS经纬度
       * @param options
       * @returns {*}
       */
      getGPSPosition: function (options) {
        var deferred = $q.defer();

        var opt = {
          enableHighAcuracy: true,
          timeout: 10000
        }
        if (angular.isObject(options)) {
          angular.extend(opt, options);
        }

        var sucCb = function (data) {
          $log.debug('定位成功' + data.coords);
          deferred.resolve(data.coords);
        }
        var errorCb = function (data) {
          $log.debug('定位失败' + data);
          deferred.reject(data);
        }

        geo.getCurrentPosition(sucCb, errorCb, opt);

        return deferred.promise;
      },


      /**
       * 将GPS坐标装换为百度坐标
       */
      convBaiduPos: function (data) {
        var deferred = $q.defer();
        var ak = 'vH2zoCtOoS5QCx1Wjtn2dG6C',
          url = 'http://api.map.baidu.com/geoconv/v1/';
        url = url + "?coords=" + data.longitude + "," + data.latitude +
          "&ak=" + ak + "&callback=JSON_CALLBACK";
        // alert(url);
        // var a = 'http://api.map.baidu.com/geoconv/v1/?coords=121.471149,31.272375ak=vH2zoCtOoS5QCx1Wjtn2dG6C&callback=JSON_CALLBACK'

        $http.jsonp(url)
          .success(function (data) {
            if (data.status == 0) {
              var poiont = data.result[0];
              var restult = {
                longitude: poiont.x,
                latitude: poiont.y
              }
              geoCache.put('currentPosition', restult);
              deferred.resolve(restult)
            } else {
              deferred.reject();
            }
          })
          .error(function (data, status, headers, config) {
            deferred.reject();
          });
        return deferred.promise;
      }
    }

    return geoService;
  }])
