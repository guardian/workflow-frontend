/**
 * Initialises "raven", Sentry's client library.
 *
 * Hooks in the Angular plugin (ngRaven) also provided by Raven.
 *
 * @see https://www.getsentry.com
 * @see https://github.com/getsentry/raven-js
 */


import raven from 'raven-js/dist/raven.min';
import angular from 'angular';

import 'raven-js/plugins/angular';


angular.module('wfSentry', ['ngRaven'])

    // Raven's angular module requires "RavenConfig" to be declared
    .service('RavenConfig', ['wfEnvironment', function(wfEnvironment) {
        return {
            'dsn': wfEnvironment.sentry.url
        };
    }]);
