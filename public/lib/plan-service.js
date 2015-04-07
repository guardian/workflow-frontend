import angular from 'angular';

import 'lib/http-session-service';

angular
    .module('wfPlanService', ['wfHttpSessionService'])
    .factory('wfPlanService', ['$rootScope', '$log', 'wfHttpSessionService',
        function ($rootScope, $log, wfHttpSessionService) {
            var httpRequest = wfHttpSessionService.request;

            class PlanService {
                get(params) {
                    console.log(params);
                    return httpRequest({
                        method: 'GET',
                        url: '/api/v1/plan',
                        params: params
                    });
                }
            }

            return new PlanService();
        }]);

