
import angular from 'angular';

import 'lib/user';

angular.module('wfHttpSessionService', [])
    .service('wfHttpSessionService', ['$http', '$q', '$log', 'wfUserSession', wfHttpSessionService])

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
                                $log.error('Could not re-establish session: ' + err);

                                throw new Error('Could not re-establish session: ' + err);
                            }

                        ).then(resolve, reject);

                    } else {
                        reject(err);
                    }

                });

        });

    }


    // service exports:
    this.request = httpRequest;
}

