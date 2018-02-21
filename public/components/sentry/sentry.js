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


angular.module('wfSentry', ['ngRaven'])

    // Raven's angular module requires "RavenConfig" to be declared
    .service('RavenConfig', ['wfEnvironment', function(wfEnvironment) {

        raven.setExtraContext({
          session_id: _wfConfig.sessionId
        });

      // Note: this isn't required, but guarantees the user context is empty when an error is sent to sentry.
        raven.setUserContext();

        return {
            'dsn': wfEnvironment.sentry.url,
            config: {
                'shouldSendCallback': () =>
                    window.location.href.indexOf('local.dev-gutools.co.uk') === -1
            }
        };
    }]);
