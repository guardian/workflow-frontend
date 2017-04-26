/**
 * Initialises "raven", Sentry's client library.
 *
 * Hooks in the Angular plugin (ngRaven) also provided by Raven.
 *
 * @see https://www.getsentry.com
 * @see https://github.com/getsentry/raven-js
 */


import raven from 'raven-js';
import angular from 'angular';

import 'raven-js/plugins/angular';

import 'lib/user';

angular.module('wfSentry', ['ngRaven', 'wfUser'])

    // Raven's angular module requires "RavenConfig" to be declared
    .service('RavenConfig', ['wfEnvironment', 'wfUser', function(wfEnvironment, wfUser) {

        raven.setUserContext({
            'email': wfUser.email,
            'first_name': wfUser.firstName,
            'last_name': wfUser.lastName
        });

        return {
            'dsn': wfEnvironment.sentry.url,
            config: {
                'shouldSendCallback': (data) =>
                    window.location.href.indexOf('local.dev-gutools.co.uk') === -1
            }
        };
    }]);
