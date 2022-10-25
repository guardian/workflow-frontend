/**
 * User Module. Provides the "wfUser" service containing data fields for the
 * current signed in user.
 *
 * @example
 * angular.module('myModule', 'wfUser')
 *   .controller('myController', ['wfUser', function(wfUser) {
 *     var email = wfUser.email;
 *     var lastName = wfUser.lastName;
 *     var firstName = wfUser.firstName;
 *   }]);
 */

import angular from 'angular';

angular.module('wfUser', [])

    // TODO: convert wfUser to a class/function as user may change
    .factory('wfUser', [function () {
        var user = window._wfConfig.user;
        if (!user) {
            return {};
        }

        // Decorate user object
        user.displayName = user.firstName + " " + user.lastName;

        return user;
    }])


    .factory('wfUserSession', ['$timeout', '$window', function ($timeout, $window) {

        var SESSION_CHECK_URL = '/login/status',

            IFRAME_TIMEOUT = 6000,

            $sessionCheckFrame,

            $$window = angular.element($window);


        class UserSession {

            reEstablishSession() {
                // no-cors means fetching in the blind - we cannot check the final status code
                return fetch(SESSION_CHECK_URL, { mode: 'no-cors' });
            }

        }

        return new UserSession();

    }]);
