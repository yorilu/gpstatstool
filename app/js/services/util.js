/**
 * Created by anders on 15/4/14.
 */
/**
 * @ngdoc service
 * @name app.util
 * @description
 *  工具方法集合
 * */


app.factory('Util', ['$q','$ionicLoading', function($q,$ionicLoading) {

  var ua = navigator.userAgent;

  var util = {

    /**
     * 设备信息
     */
    os: {
      isAndroid: ua.indexOf('Android') > 0,
      isIOS: /iP(ad|hone|od)/.test(ua)
    },

    /**
     * 浏览器信息
     */
    browser: {
      QQ: ua.indexOf('MQQBrowser') > 0,
      UC: ua.indexOf('UCBrowser') > 0,
      MIUI: ua.indexOf('MiuiBrowser') > 0,
      WeiXin: ua.indexOf('MicroMessage') > 0,
      Chrome: !!window.chrome
    },


    Date: {

      now: function() {
        return (new Date()).getTime();
      },

      /*
       * 在当前日期上计算偏移值
       */
      calDateByOffset: function(offset) {
        var date = new Date();
        date.setDate(date.getDate() + offset);
        return this.dateFormat(date, 'yyyy-MM-dd');
      },

      /**
       * 日期字符串转毫秒
       */
      str2mm: function(dateStr) {
        // ios 下的日期格式
        dateStr = dateStr.replace(/-/g, '/');
        return Date.parse(dateStr);
      },

      dateFormat: function(date, format) {
        var o = {
          "M+": date.getMonth() + 1,
          //month
          "d+": date.getDate(),
          //day
          "h+": date.getHours(),
          //hour
          "m+": date.getMinutes(),
          //minute
          "s+": date.getSeconds(),
          //second
          "q+": Math.floor((date.getMonth() + 3) / 3),
          //quarter
          "S": date.getMilliseconds() //millisecond
        }

        if (/(y+)/.test(format)) {
          format = format.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));
        }

        for (var k in o) {
          if (new RegExp("(" + k + ")").test(format)) {
            format = format.replace(RegExp.$1, RegExp.$1.length == 1 ? o[k] : ("00" + o[k]).substr(("" + o[k]).length));
          }
        }
        return format;
      },

      //本地事件与服务器时间差
      timeInterval:0,
      /**
       * 获取服务器事件
       */
      getServerDate:function (){
        var now = this.now();
        if(this.timeInterval >0){
          now = now + this.timeInterval;
        }
        return new Date(now);
      }
    },

    now: function() {
      return this.Date.now();
    },

    /**
     * 返回对象的key值
     * @param obj
     */
    keys: function(obj) {
      var keys = [];
      for (var i in obj) {
        keys.push(i)
      }
      return keys;
    },

    /**
     * 指定元素填充数组
     * @param length
     * @param fillChar
     * @returns {Array}
     */
    fillArray: function(length, fillChar) {
      var array = [];
      for (var i = 0; i < length; i++) {
        array.push(fillChar);
      }
      return array
    },

    /**
     * 返回对象的value数组
     * @param obj
     */
    values: function(obj) {
      var values = [];
      for (var i in obj) {
        values.push(obj[i])
      }
      return values;
    },

    /**
     * 生成一个GUID
     */
    creatGUID: function() {
      function S4() {
        return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
      }

      function NewGuid() {
        return S4() + S4() + S4() + S4() + S4();
      }

      return NewGuid();
    },
    /*
     * @desc 节流函数，功能是某个function 最多在某时间内触发一次。
     * 比如 var fn = function (){};
     * window.onscroll = function (){
     * 	fn();
     * }
     *  该fn函数 最多2秒内只执行一次。
     *
     */
    throttle: function(func, wait, options) {
      var context,
        args,
        result,
        that = this;
      var timeout = null;
      var previous = 0;
      if (!options)
        options = {};
      var later = function() {
        previous = options.leading === false ? 0 : that.now();
        timeout = null;
        result = func.apply(context, args);
        if (!timeout)
          context = args = null;
      };
      return function() {
        var now = that.now();
        if (!previous && options.leading === false)
          previous = now;
        var remaining = wait - (now - previous);
        context = this;
        args = arguments;
        if (remaining <= 0 || remaining > wait) {
          clearTimeout(timeout);
          timeout = null;
          previous = now;
          result = func.apply(context, args);
          if (!timeout)
            context = args = null;
        } else if (!timeout && options.trailing !== false) {
          timeout = setTimeout(later, remaining);
        }
        return result;
      };
    },
    /*
     * @desc 节流函数，功能是某个function 在最后一次执行停止后某时间内触发。
     * 比如 var fn = function (){};
     * window.onscroll = function (){
     * 	fn();
     * }
     *  该fn函数 在scroll停止后2秒内若没有新的触发scroll 则触发该fn 函数。
     *
     */
    debounce: function(func, wait, immediate) {
      var timeout,
        args,
        context,
        timestamp,
        result,
        that = this;

      var later = function() {
        var last = that.now() - timestamp;
        if (last < wait && last > 0) {
          timeout = setTimeout(later, wait - last);
        } else {
          timeout = null;
          if (!immediate) {
            result = func.apply(context, args);
            if (!timeout)
              context = args = null;
          }
        }
      };
      return function() {
        context = this;
        args = arguments;
        timestamp = that.now();
        var callNow = immediate && !timeout;
        if (!timeout)
          timeout = setTimeout(later, wait);
        if (callNow) {
          result = func.apply(context, args);
          context = args = null;
        }

        return result;
      };
    },
    formatStr: function() {
      if (arguments.length == 0) {
        return null;
      }
      var str = arguments[0];
      for (var i = 1; i < arguments.length; i++) {
        var re = new RegExp('\\{' + (i - 1) + '\\}', 'gm');
        str = str.replace(re, arguments[i]);
      }
      return str;
    },

    dateFormat: function(date, format) {
      return this.Date.dateFormat(date, format);
    },
    isString: function(str) {
      return Object.prototype.toString.call(str) === "[object String]";
    },
    getObjectLength: function(obj) {
      var i = 0;
      for (j in obj) {
        i++;
      }
      return i;
    },
    isUdf: function (object){
      var udf;
      return typeof object == 'undefined' || typeof object ==udf || object == udf;
    },
    UI: {
      showLoading: function(text, time) {
        $ionicLoading.show({
          template: text || '<ion-spinner icon="ios"></ion-spinner>',
          duration: time ? time : null
        });
      },

      hideLoading: function() {
        $ionicLoading.hide();
      }
    }
  }

  return util;
}]);