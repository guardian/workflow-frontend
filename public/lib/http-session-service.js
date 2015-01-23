
import angular from 'angular';

import 'lib/user';

angular.module('wfHttpSessionService', [])
    .service('wfHttpSessionService', ['$http', '$q', '$log', 'wfUserSession', wfHttpSessionService]);

function wfHttpSessionService($http, $q, $log, wfUserSession) {

    /**
     * Make a http request to the Workflow Content API.
     * Wraps all requests to handle when user sessions become invalid after an hour.
     *
     * @param  {object=} options Angular $http options for the call.
     * @return {Promise} (ES6 promise not a Angular "promise")
     */
    function httpRequest(options = {}) {

        return new Promise((resolve, reject) => {

            $http(options)
                .then(resolve, (err) => {


                    // Check whether session has become invalid
                    if (err && (err.status === 401 || err.status === 419)) {
                        $log.info('Invalid session, attempting to re-establish');

                        wfUserSession.reEstablishSession().then(
                            (data) => {
                                $log.info('Session re-established');

                                // Try the request again
                                return httpRequest(options);
                            },

                            (err) => {
                                throw new Error('Could not re-establish session: ' + err);
                            }

                        ).then(resolve, reject);

                    } else {
                        reject(buildHttpError(err));
                    }

                });

        });

    }


    /**
     * Turn a angular http error into a proper JS error for logging.
     */
    function buildHttpError(err) {

        if (err instanceof Error) {
            return err;
        }

        var requestConfig = err.config || {},

        requestParams = requestConfig.params &&
            Object.keys(requestConfig.params)
                .filter((param, idx, params) => requestConfig.params[param] !== undefined && requestConfig.params[param] !== null)
                .map((param) => `${param}=${requestConfig.params[param]}`),


        error = new Error([
            'Request error:',
            err.status || '?',
            err.statusText || 'Unknown',
            'from',
            requestConfig.method || '',
            (requestConfig.url || '') + (requestParams && requestParams.length > 0 ? '?' + requestParams.join('&') : '')

        ].join(' '));
        // TODO extras for sentry logging

        //is there a better way of checking if a field exists?
        if(err.data && err.data.error && err.data.error.friendlyMessage ) {
            error.friendlyMessage = err.data.error.friendlyMessage
        }
        return error;
    }


    // service exports:
    this.request = httpRequest;
}

