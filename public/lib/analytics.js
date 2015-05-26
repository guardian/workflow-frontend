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
        function track(eventName, contentItem, extraProperties) {
            var props = {
                'Section': contentItem.section,
                'Content type': contentItem.contentType
            };

            if (extraProperties) {
                angular.extend(props || {}, extraProperties);
            }

            wfAnalytics.track(eventName, props);
        }

        // Tracking event listeners
        //   - separate declarations to aid maintenance.

        // Track Stub created
        $rootScope.$on('stub.created', (event, msg) => {
            track('Stub created', msg.contentItem, {
                'Created in Composer': !!msg.contentItem.composerId
            });
        });

        // Track stub edited
        $rootScope.$on('stub.edited', (event, msg) => {
            track('Stub edited', msg.contentItem);
        });

        // Track deletion of stubs
        $rootScope.$on('stub.deleted', (event, msg) => {
            track('Stub deleted', msg.contentItem);
        });

        // Track stub/content status change
        $rootScope.$on('contentItem.updated', (event, msg) => {
            if (msg.data && msg.data.status) {
                track('Status changed', msg.contentItem, {
                    'Status transition': msg.oldValues.status + ' to ' + msg.data.status
                });

            } else if (msg.data) {
                for (var fieldId in msg.data) {
                    track('Content edited', msg.contentItem, {
                        'Field': fieldId
                    });
                }
            }

        });

        // Track import from composer
        $rootScope.$on('content.imported', (event, msg) => {
            track('Content imported', msg.contentItem);
        });


        // Track deletion of content
        $rootScope.$on('content.deleted', (event, data) => {
            track('Content deleted', data.contentItem);
        });

        let ignoreFirstCall = (fn) => {
            let c = false;
            return () => {
                if (!c) {
                    c = !c;
                } else {
                    fn.apply(this, arguments);
                }
            }
        };

        $rootScope.$on('plan-view__ui-loaded', (event, data) => {         // what date range are they looking at on load
            track('Plan view | Plan view loaded', {});
        });

        $rootScope.$on('plan-view__filters-changed.plan-start-date', ignoreFirstCall((event, data) => {
            track('Plan view | Start date edited', data);
        }));

        $rootScope.$on('plan-view__filters-changed.plan-end-date', ignoreFirstCall((event, data) => {
            track('Plan view | End date edited', data);
        }));

        $rootScope.$on('plan-view__quick-add-submit', (event, data) => {
            track('Plan view | Quick add submitted', data);
        });

        $rootScope.$on('plan-view__date-selected', ignoreFirstCall((event, data) => {
            track('Plan view | Date selected', data);
        }));

        $rootScope.$on('plan-view__plan-item-deleted', (event, data) => {
            track('Plan view | Item deleted', data);
        });

        // create bundle via dnd

        // create item from day note

        // Added a day note

        // Drag item to bucket

        // use inline add to BUCKET

        // use inline add to BUNDLE

        

        // TODO Things to track:
        //  View in Composer
        //  Content list filtered

    }]);
