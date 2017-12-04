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


        // Restrictions, url must be same origin on Load
        function reEstablishSessionInIframe() {

            if (!$sessionCheckFrame) {
                // singleton iframe
                $sessionCheckFrame = angular.element('<iframe class="login-check__frame">');

                angular.element($window.document.body).append($sessionCheckFrame);
            }

            return new Promise((resolve, reject) => {

                var timeout;

                function postMessageListener(event) {
                    // checks for "originalEvent" object, available when jquery is in the page
                    var eventData = event.originalEvent && event.originalEvent.data || event.data;

                    if (eventData) { // TODO: check for sessionCheck identifier in message data

                        $$window.off('message', postMessageListener);
                        $timeout.cancel(timeout);

                        resolve(eventData);
                    }

                }


                $$window.on('message', postMessageListener);


                // Timeout fallback
                timeout = $timeout(function () {

                    $$window.off('message', postMessageListener);

                    reject(new Error('Timeout loading URL in iframe: ' + SESSION_CHECK_URL));

                }, IFRAME_TIMEOUT);


                $sessionCheckFrame.one('load', function () {

                    try {
                        // When logged out, google auth refuses to load in an iframe by setting the X-Frame-Options header
                        // we can sort of detect this by checking the location of the iframe
                        // if the contentDocument object cannot be accessed, its due to a security error.
                        // security error will occur when the frame is on a different origin

                        if ($sessionCheckFrame[0].contentDocument.location) {
                            // loaded successfully - now wait for a postMessage with the user object.
                        }

                    } catch (err) {

                        $$window.off('message', postMessageListener);
                        $timeout.cancel(timeout);

                        reject(err);
                    }


                });


                $sessionCheckFrame.attr('src', SESSION_CHECK_URL);

            });
        }


        class UserSession {


            reEstablishSession() {

                return new Promise((resolve, reject) => {

                    reEstablishSessionInIframe().then(
                        resolve,

                        // Catch errors re-establishing session in iframe
                        function (err) {
                            // TODO: open in popup

                            reject(err);
                        }
                    );

                });

            }

        }

        return new UserSession();

    }]);
