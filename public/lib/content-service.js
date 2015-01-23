import angular from 'angular';

import 'lib/composer-service';
import 'lib/http-session-service';
import 'lib/user';
import 'lib/visibility-service';

angular.module('wfContentService', ['wfHttpSessionService', 'wfVisibilityService', 'wfDateService', 'wfFiltersService', 'wfUser', 'wfComposerService'])
    .factory('wfContentService', ['$rootScope', '$log', 'wfHttpSessionService', 'wfDateParser', 'wfFormatDateTimeFilter', 'wfFiltersService', 'wfComposerService',
        function ($rootScope, $log, wfHttpSessionService, wfDateParser, wfFormatDateTimeFilter, wfFiltersService, wfComposerService) {

            var httpRequest = wfHttpSessionService.request;

            class ContentService {
                getTypes() {
                    return {
                        "article": "Article",
                        "liveblog": "Live blog",
                        "gallery": "Gallery",
                        "interactive": "Interactive"
                    }
                };

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
                 * Async creates a stub in workflow.
                 */
                createStub(stubData) {
                    var params = {};
                    return httpRequest({
                        method: 'POST',
                        url: '/api/stubs',
                        params: params,
                        data: stubData
                    });
                }


                /**
                 * Creates a draft in Composer from a Stub. Effectively moving
                 * it to "Writers" status.
                 * Also will create the stub if it doesn't have an id.
                 */
                createInComposer(stub) {
                    return wfComposerService.create(stub.contentType).then( (response) => {

                        wfComposerService.parseComposerData(response.data, stub);

                        if (stub.id) {
                            return this.updateStub(stub);
                            // return this.updateComposerId(stub.id, composerId, stub.contentType);

                        } else {
                            return this.createStub(stub);
                        }
                    });
                }


                /**
                 * Updates an existing stub by overwriting its fields via PUT.
                 */
                updateStub(stub) {
                    return httpRequest({
                        method: 'PUT',
                        url: '/api/stubs/' + stub.id,
                        data: stub
                    });
                }


                /**
                 * Async update a field for a piece of content.
                 *
                 * Adapter for both content and stubs APIs.
                 * TODO normalise to single API.
                 *
                 * @param {Object} contentItem
                 * @param {String} field
                 * @param {mixed} data
                 *
                 * @returns {Promise}
                 */
                updateField(contentItem, field, data) {
                    if (field === 'status') {
                        return this.updateStatus(contentItem, data);
                    }

                    var contentId = contentItem.id || contentItem.stubId;

                    // TODO: create a generic PATCH / PUT API
                    return httpRequest({
                        method: 'PUT',
                        url: '/api/stubs/' + contentId + '/' + field,
                        data: { 'data': data }
                    });
                }


                /**
                 * Updates the status of a Content Item or a Stub. If contentItem
                 * is a Stub, a draft will be created moving it to "Writers" status.
                 */
                updateStatus(contentItem, data) {
                    if (!contentItem.composerId) { // its a stub
                        return this.createInComposer(contentItem);
                    }

                    return httpRequest({
                        method: 'PUT',
                        url: '/api/content/' + contentItem.composerId + '/status',
                        data: { 'data': data }
                    });
                }


                /**
                 * Link existing stub to composer article.
                 */
                updateComposerId(stubId, composerId, contentType) {
                    return httpRequest({
                        method: 'POST', // TODO: update to PATCH method
                        url: '/api/stubs/' + stubId,
                        params: { 'composerId': composerId, 'contentType': contentType }
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
                        'created.until': wfFormatDateTimeFilter(createdRange['until'], "ISO8601") || null,
                        'text': modelParams['text'] || null,
                        'assignee': modelParams['assignee'] || null
                    };

                    return params;

                }

            }

            return new ContentService();

        }])

    /**
     * Content polling service.
     *
     * TODO: replace with an event stream
     */
    .factory('wfContentPollingService', ['$http', '$timeout', '$rootScope', 'wfContentService', function ($http, $timeout, $rootScope, wfContentService) {

        var POLLING_DELAY = 5000;

        class ContentPollingService {

            /**
             * @param {function} paramsProvider used to retrieve filter params for the scope
             *                                  at the instant the next poll occurs. Necessary to
             *                                  cater for changes in filters.
             */
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

            onError(callback) {
                this._errorCallback = callback;
            }


            startPolling() {
                return this.refresh();
            }


            stopPolling() {
                if (this._timer) {
                    $timeout.cancel(this._timer);
                    this._timer = false;
                }
            }


            /**
             * Forces a poll to the server to refresh data. Resets the poll
             * timer for the next subsequent poll.
             */
            refresh() {
                this.stopPolling();

                return wfContentService.get(this._paramsProvider())
                    .then(this._callback)
                    .then( () => {
                        this._timer = $timeout(this.refresh.bind(this), POLLING_DELAY);
                    })
                    .catch((err) => {
                        if (this._errorCallback) {
                            this._errorCallback(err);
                        }
                    });
            }
        }

        return ContentPollingService;

    }]);
