/**
 * Created by anders on 15/7/15.
 */


angular.module('config')
  .constant('Mock', {

    //事件
    getGameRules: [
      {
        ruleId: 1,
        ruleName: '二分制',
        ruleVersionNo: '1',
        sportType: 'basketball',
        ruleItems: [
          {
            templateId: 1,
            templateName: '罚球命中',
            templateContent: '{0}罚球命中'
          }
        ]
      },
      {
        ruleId: 1,
        ruleName: '二分制',
        ruleVersionNo: '1',
        sportType: 'football',
        ruleItems: [
          {
            templateId: 1,
            templateName: '罚球命中',
            templateContent: '{0}罚球命中'
          }
        ]
      }
    ],

    addTeam: true,
    addPlayer: true,
    addTeamPlayer: true,
    addGamePlayer: true

  });