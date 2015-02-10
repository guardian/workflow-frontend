
import angular from 'angular';

import 'lib/user';

angular.module('wfHttpSessionService', [])
    .service('wfHttpSessionService', ['$http', '$q', '$log', 'wfUserSession', wfHttpSessionService]);

function wfHttpSessionService($http, $q, $log, wfUserSession) {

    var MAX_RETRIES = 20;

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
                        if(options.retryCount && options.retryCount > MAX_RETRIES) {
                           throw new Error('Could not re-establish session (exceeded max retries): ' + err);
                           return;
                        }

                        options.retryCount = options.retryCount ? options.retryCount + 1 : 1;

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

        // Append to error object Workflow API JSON error conventions
        if(err.data && err.data.error) {
            error.friendlyMessage = err.data.error.friendlyMessage;
            error.data = err.data.error.data || {};
        } else {
            err.data = {};
        }

        error.status = err.status;
        return error;
    }


    // service exports:
    this.request = httpRequest;
}

