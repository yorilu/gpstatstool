/**
 * Created by anders on 15/5/27.
 */
define(['app'], function (app) {
    return app.factory('network', ['$window', function ($window) {

        var network ={
            getNetwork: function () {
                if(navigator.connection){
                    return navigator.connection.type;
                }else{
                    return null;
                }
            },

            isOnline: function () {
                var networkState = this.getNetwork();
                try{
                    return  networkState !== Connection.UNKNOWN && networkState !== Connection.NONE;
                }catch(e){
                    return true;
                }
            },

            isOffline: function () {
                var networkState = this.getNetwork();
                try{
                    return networkState === Connection.UNKNOWN || networkState === Connection.NONE;
                }catch(e){
                    return false;
                }
            }
        };

        return network;

    }]);

});