/**
 * Analytics module which listens for events and tracks them as appropriate
 * within Mixpanel.
 */

import angular from 'angular';
import './analytics/mixpanel-adapter';
import UAParser from 'ua-parser/ua-parser.min';

import './user';

// constants:
var MX_TOKEN_PROD = '8bed1eea7b1ff4e758ae8fbc60968d26',
    MX_TOKEN_DEV = '5db5be65ee7d6c82a730a4cbec2465f2';

angular.module('wfAnalytics', ['wfUser'])

    .factory('wfAnalytics', ['wfUser', function (wfUser) {

        function getMixpanelToken() {
            if (window.location.hostname == 'workflow.gutools.co.uk') {
                return MX_TOKEN_PROD;
            }
            return MX_TOKEN_DEV;
        }

        class Analytics {

            /**
             * Initialise mixpanel. Also sets the current signed in user for all
             * tracked events.
             */
                init() {
                mixpanel.init(getMixpanelToken());
                mixpanel.identify(wfUser.email);

                // Set the user for every tracked event
                mixpanel.people.set({
                    '$email': wfUser.email,
                    '$first_name': wfUser.firstName,
                    '$last_name': wfUser.lastName
                });

                // Set the browser and OS version for every tracked event
                var ua = new UAParser(), // parse the user agent
                    browser = ua.getBrowser(),
                    os = ua.getOS();

                mixpanel.register({
                    'Browser version': browser.name + ' ' + browser.major,
                    'Operating System version': os.name + ' ' + os.version
                });
            }

            /**
             * Track an event in mixpanel, attaching aditional global properties to the event.
             * @param {string} eventName Name of event to track in mixpanel.
             *                           Generally this is a user friendly string,
             *                           containing case formatting and spaces.
             * @param {object} properties Additional values to store on the event.
             */
                track(eventName, properties = {}) {

                // Screen res and viewport may change, so re- tracking
                angular.extend(properties, {
                    'Screen resolution': window.screen.width + ' x ' + window.screen.height,
                    'Screen viewport': document.documentElement.clientWidth + ' x ' + document.documentElement.clientHeight
                });

                mixpanel.track(eventName, properties);
            }

        }

        return new Analytics();
    }])

    // Initialise and attach event listeners on load (run)
    .run(['$rootScope', 'wfAnalytics', function ($rootScope, wfAnalytics) {

        wfAnalytics.init();

        wfAnalytics.track('Dashboard loaded');

        /**
         * Track a given event using eventData from a emitted event.
         * @param  {string} eventName Name of event to record in mixpanel.
         * @param  {object} eventData Object containing data from the event to track.
         * @param  {object} extraProperties Aditional properties to record on the
         *                                  tracked event in mixpanel.
         */
        function track(eventName, eventData, extraProperties) {
            var props;

            // extract common properties from eventData
            if (eventData && eventData.content) {
                props = {
                    'Section': eventData.content.section,
                    'Content type': eventData.content.contentType
                };
            }

            if (extraProperties) {
                angular.extend(props || {}, extraProperties);
            }

            wfAnalytics.track(eventName, props);
        }

        // Tracking event listeners
        //   - separate declarations to aid maintenance.

        // Track Stub created
        $rootScope.$on('stub.created', function (event, data) {
            track('Stub created', data, {
                'Created in Composer': !!data.content.composerId
            });
        });

        // Track stub edited
        $rootScope.$on('stub.edited', function (event, data) {
            track('Stub edited', data);
        });

        // Track deletion of stubs
        $rootScope.$on('stub.deleted', function (event, data) {
            track('Stub deleted', data);
        });

        // Track stub/content status change
        $rootScope.$on('content.statusChanged', function (event, data) {
            track('Status changed', data, {
                'Status transition': data.oldStatus + ' to ' + data.status
            });
        });

        // Track import from composer
        $rootScope.$on('content.imported', function (event, data) {
            track('Content imported', data);
        });

        // Track content when its edited
        $rootScope.$on('content.edited', function (event, data) {
            track('Content edited', data, {
                'Field': data.field
            });
        });

        // Track deletion of content
        $rootScope.$on('content.deleted', function (event, data) {
            track('Content deleted', data);
        });

        // TODO Things to track:
        //  View in Composer
        //  Content list filtered

    }]);
