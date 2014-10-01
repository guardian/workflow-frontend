import angular from 'angular';
import 'lib/user';
import 'lib/visibility-service';

angular.module('wfContentService', ['wfVisibilityService', 'wfDateService', 'wfFiltersService', 'wfUser'])
    .factory('wfContentService', ['$http', '$timeout', '$rootScope', '$log', 'wfDateParser', 'wfFormatDateTimeFilter', 'wfFiltersService', 'wfUserSession',
        function ($http, $timeout, $rootScope, $log, wfDateParser, wfFormatDateTimeFilter, wfFiltersService, wfUserSession) {

            /**
             * Make a http request to the Workflow Content API.
             * Wraps all requests to handle when user sessions become invalid after an hour.
             *
             * @param  {object=} options Angular $http options for the call.
             * @return {Promise}
             */
            function httpRequest(options = {}) {

                return new Promise((resolve, reject) => {

                    $http(options)
                        // $http "Promise.success" is part of angular's API, "then" has a different syntax!
                        .success(resolve)
                        .catch(function (err) {

                            // Check whether session has become invalid
                            if (err && (err.status === 401 || err.status === 419)) {
                                $log.info('Invalid session, attempting to re-establish');

                                wfUserSession.reEstablishSession().then(
                                    function (data) {
                                        $log.info('Session re-established');

                                        // Try the request again
                                        return httpRequest(options);
                                    },

                                    function (err) {
                                        $log.error('Could not re-establish session: ' + err);

                                        // TODO: make event more generic for catch all
                                        $rootScope.$apply(function () {
                                            $rootScope.$broadcast('getContent.failed', { error: err });
                                        });

                                        reject('Could not re-establish session: ' + err);
                                    }
                                ).then(resolve, reject);

                            } else {
                                // TODO: make event more generic for catch all
                                $rootScope.$broadcast('getContent.failed', { error: err });

                                reject(err);
                            }
                        });

                });

            }


            class ContentService {

                /**
                 * Async retrieves content from service.
                 *
                 * @param {Object} params
                 * @returns {Promise}
                 */
                get(params) {
                    return httpRequest({
                        method: 'GET',
                        url: '/api/content',
                        params: params
                    });
                }

                /**
                 * Async update a field for a piece of content.
                 *
                 * @param {String} stubId
                 * @param {String} field
                 * @param {mixed} data
                 */
                update(stubId, field, data) {
                    return httpRequest({
                        method: 'PUT',
                        url: '/api/stubs/' + stubId + '/' + field,
                        data: { data: data }
                    });
                }

                /**
                 * Async deletes content.
                 *
                 * @param {String} stubId ID of stub to delete.
                 * @returns {Promise}
                 */
                remove(stubId) {
                    return httpRequest({
                        method: 'DELETE',
                        url: '/api/stubs/' + stubId
                    });
                }


                /**
                 * Formats model params into params to send to server.
                 *
                 * @param {Object} params
                 * @returns {Object}
                 */
                getServerParams() {
                    var modelParams = wfFiltersService.getAll();

                    var selectedDate = modelParams['selectedDate'];

                    var dateRange = wfDateParser.parseRangeFromString(selectedDate);
                    var createdRange = wfDateParser.parseRangeFromString(modelParams['created']);

                    var params = {
                        'status': modelParams['status'],
                        'state': modelParams['state'],
                        'section': modelParams['section'],
                        'content-type': modelParams["content-type"],
                        'flags': modelParams['flags'],
                        'prodOffice': modelParams['prodOffice'],
                        'due.from': wfFormatDateTimeFilter(dateRange['from'], "ISO8601") || null,
                        'due.until': wfFormatDateTimeFilter(dateRange['until'], "ISO8601") || null,
                        'created.from': wfFormatDateTimeFilter(createdRange['from'], "ISO8601") || null,
                        'created.until': wfFormatDateTimeFilter(createdRange['until'], "ISO8601") || null
                    };

                    return params;

                }

            }

            return new ContentService();

        }])

    /**
     * Content polling service.
     */
    .factory('wfContentPollingService', ['$http', '$timeout', '$rootScope', 'wfContentService', function ($http, $timeout, $rootScope, wfContentService) {

        var POLLING_DELAY = 5000;

        class ContentPollingService {

            constructor(paramsProvider) {
                this._paramsProvider = paramsProvider;

                this.init();
            }

            init() {
                // event provided by visibility service
                $rootScope.$on('visibility.changed', (function (event, data) {
                    if (data.visibility) {
                        this.startPolling();
                    } else {
                        this.stopPolling();
                    }
                }).bind(this));
            }

            // single callback only required so far...
            onPoll(callback) {
                this._callback = callback;
            }

            /**
             * Start polling for updates.
             *
             * @param {function} paramsProvider used to retrieve filter params for the scope
             *                                  at the instant the next poll occurs. Necessary to
             *                                  cater for changes in filters.
             * @param {function} callback called on each successful polled reponse.
             */
            startPolling() {
                var tick = (function () {
                    wfContentService.get(this._paramsProvider())
                        .then(this._callback)
                        .then((function () { // finally
                            this._timer = $timeout(tick, POLLING_DELAY);
                        }).bind(this));

                }).bind(this);

                tick();
            }

            stopPolling() {
                if (this._timer) {
                    $timeout.cancel(this._timer);
                    this._timer = false;
                }
            }
        }

        return ContentPollingService;

    }]);
