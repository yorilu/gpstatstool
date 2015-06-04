/**
 * Created by danny zou on 15/5/28.
 */
define(['app'], function(app) {
  return app.factory('storage', ['$window', function($window) {

    var storage = {
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
        players: []
      },
      myteamData: {
        teamname: '',
        teamid: '',
        players: []
      },
      players: [
        // {
        //   id: 1,
        //   PlayerName: '啊啊啊',
        //   PlayerNumber: '01',
        // }, {
        //   id: 2,
        //   PlayerName: '啊啊啊',
        //   PlayerNumber: '02',
        // }, {
        //   id: 3,
        //   PlayerName: '啊啊啊',
        //   PlayerNumber: '03',
        // }, {
        //   id: 4,
        //   PlayerName: '啊啊啊',
        //   PlayerNumber: '04',
        // }, {
        //   id: 5,
        //   PlayerName: '啊啊啊',
        //   PlayerNumber: '05',
        // }
      ],
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
      },
      addFaker: function(index) {
        var max = 0;
        for (var i = 0, len = storage.players.length; i < len; i++) {
          if (storage.players[i].playerNumber > max) {
            max = storage.players[i].playerNumber;
          }
        }
        if (max < 100) {
          max = 99;
        }
        storage.players[index] = {
          id: null,
          playerName: '充数球员',
          playerNumber: max + 1,
        };
      }


    };

    return storage;

  }]);

});