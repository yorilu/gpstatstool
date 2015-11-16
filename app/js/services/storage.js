/**
 * Created by danny zou on 15/5/28.
 */
app.factory('Storage', ['$window', function($window) {

  var storage = {
    masterLogo: 1,
    guestLogo: 1,
    masterTeam: {
      teamName: '',
      players: [
        //         {
        // TeamID:'',
        // PlayerID:''
        //         }
      ]
    },
    guestTeam: {
      teamName: '',
      teamid: '',
      players: []
    },
    myteamData: {
      teamName: '',
      teamid: '',
      players: []
    },
    areaDetail: {
      id: '',
      name: '',
      cityId:'',
      courtlist: []
    },
    courtDetail: {
      id: '',
      name: ''
    },


    players: [],
    formatMatch: function() {
      storage.masterTeam = {
        teamName: '',
        players: []
      };
      storage.guestTeam = {
        teamName: '',
        players: []
      };
    },
    formatPlayer: function(number) {
      storage.players = [];
      var _num = number ? number : 0;
      for (var i = 0; i < _num; i++) {
        storage.players.push({
          id: null,
          playerName: '',
          playerNumber: ''
        })
      }
    },
    addPlayer: function() {
      storage.players.push({
        id: null,
        playerName: '',
        playerNumber: ''
      })
    }


  };

  return storage;

}]);