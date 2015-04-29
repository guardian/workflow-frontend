import angular from 'angular';

import 'lib/http-session-service';

angular
    .module('wfPlannedItemService', ['wfHttpSessionService'])
    .factory('wfPlannedItemService', ['$rootScope', '$log', 'wfHttpSessionService',
        function ($rootScope, $log, wfHttpSessionService) {
            var httpRequest = wfHttpSessionService.request;

            class PlannedItemService {

                get(params) { // untested
                    return httpRequest({
                        method: 'GET',
                        url: '/api/v1/plan/item',
                        params: params
                    });
                }

                add(plannedItem) {
                    return httpRequest({
                        method: 'POST',
                        url: '/api/v1/plan/item',
                        data: plannedItem
                    });
                }

                update(plannedItem) {
                    return httpRequest({
                        method: 'POST',
                        url: '/api/v1/plan/item',
                        data: plannedItem
                    });
                }
            }

            return new PlannedItemService();
        }]);

