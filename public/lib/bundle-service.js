import angular from 'angular';

import 'lib/http-session-service';

angular
    .module('wfBundleService', ['wfHttpSessionService'])
    .factory('wfBundleService', ['$rootScope', '$log', 'wfHttpSessionService',
        function ($rootScope, $log, wfHttpSessionService) {
            var httpRequest = wfHttpSessionService.request;

            class BundleService {
                get(params) {
                    return httpRequest({
                        method: 'GET',
                        url: '/api/v1/plan/bundles',
                        params: params
                    });
                }

                add(bundle) {
                    return httpRequest({
                        method: 'POST',
                        url: '/api/v1/plan/bundle',
                        data: bundle
                    });
                }
            }

            return new BundleService();
        }]);

