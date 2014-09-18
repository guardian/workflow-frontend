/**
 * lib/visibility-service
 *
 * Simple angular wrapper around the Page Visibility API.
 *
 * Adapted from: http://www.html5rocks.com/en/tutorials/pagevisibility/intro/
 */

import angular from 'angular';

angular.module('wfVisibilityService', [])
    .factory('wfVisibilityService', [function () {

        function getHiddenProp() {
            var prefixes = ['webkit', 'moz', 'ms', 'o'];

            // if 'hidden' is natively supported just return it
            if ('hidden' in document) return 'hidden';

            // otherwise loop over all the known prefixes until we find one
            for (var i = 0; i < prefixes.length; i++) {
                if ((prefixes[i] + 'Hidden') in document)
                    return prefixes[i] + 'Hidden';
            }

            // otherwise it's not supported
            return null;
        }


        function addVisibilityChangeListener(listener) {
            var visProp = getHiddenProp(),
                evtname = visProp.replace(/[H|h]idden/, '') + 'visibilitychange';

            document.addEventListener(evtname, listener);
        }


        class VisibilityService {

            onVisibilityChanged(callback) {
                addVisibilityChangeListener((function () {
                    callback({ visibility: !this.isHidden() });
                }).bind(this));
            }

            isHidden() {
                var prop = getHiddenProp();
                if (!prop) return false;

                return document[prop];
            }

        }

        return new VisibilityService();

    }])

    .run(['$rootScope', 'wfVisibilityService', function ($rootScope, wfVisibilityService) {
        wfVisibilityService.onVisibilityChanged(function (data) {
            $rootScope.$broadcast('visibility.changed', data);
        });
    }]);
