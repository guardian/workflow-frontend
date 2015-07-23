import angular from 'angular';

import 'lib/http-session-service';

function hashCode(str) { // java String#hashCode
    var hash = 0;
    for (var i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return hash;
}

function intToARGB(i) {
    let c = ((i>>24)&0xFF).toString(16) +
        ((i>>16)&0xFF).toString(16) +
        ((i>>8)&0xFF).toString(16)  +
        (i&0xFF).toString(16);

    return("#" + c.substr(0, 6));
}

angular
    .module('wfBundleService', ['wfHttpSessionService'])
    .factory('wfBundleService', ['$rootScope', '$log', 'wfHttpSessionService',
        function ($rootScope, $log, wfHttpSessionService) {
            var httpRequest = wfHttpSessionService.request;

            class BundleService {
                getList(params) {
                    return httpRequest({
                        method: 'GET',
                        url: '/api/v1/plan/bundles',
                        params: params
                    }).then((response) => {
                        _wfConfig.bundleList = response.data.data;
                        return response;
                    });
                }

                list() {
                    return _wfConfig.bundleList;
                }

                getTitle(bundleId) {
                    return _wfConfig.bundleList[bundleId] ? _wfConfig.bundleList[bundleId].title : ""; // bundles are guaranteed to be in id order from the server
                }

                add(bundle) {
                    return httpRequest({
                        method: 'POST',
                        url: '/api/v1/plan/bundle',
                        data: bundle
                    });
                }

                updateTitle(bundleId, title) {

                    _wfConfig.bundleList[bundleId].title = title;

                    return httpRequest({
                        method: 'PATCH',
                        url: '/api/v1/plan/bundle/' + bundleId + '/title',
                        data: {
                            data: title
                        }
                    });
                }

                genBundleColorStyle(prop, s) {
                    let ret = {};
                    ret[prop] = intToARGB(hashCode(s || "empty"));
                    return ret;
                }

                constructor () {
                    $rootScope.$on('plan-view__bundles-edited', () => {
                        this.getList();
                    });
                }
            }

            return new BundleService();
        }]);

