import angular from 'angular';

import 'lib/http-session-service';

angular
    .module('wfDayNoteService', ['wfHttpSessionService'])
    .factory('wfDayNoteService', ['$rootScope', '$log', 'wfHttpSessionService',
        function ($rootScope, $log, wfHttpSessionService) {
            var httpRequest = wfHttpSessionService.request;

            class DayNoteService {

                get(params) { // untested
                    return httpRequest({
                        method: 'GET',
                        url: '/api/v1/plan/day-note',
                        params: params
                    });
                }

                add(dayNote) {
                    return httpRequest({
                        method: 'POST',
                        url: '/api/v1/plan/day-note',
                        data: dayNote
                    });
                }

                /**
                 * Update a single field on a plannedItem
                 * @param dayNoteId
                 * @param fieldName
                 * @param value
                 * @returns {Promise}
                 */
                updateField(dayNoteId, fieldName, value) {
                    return httpRequest({
                        method: 'PATCH',
                        url: '/api/v1/plan/day-note/' + dayNoteId + '/' + fieldName,
                        data: {
                            'data': value
                        }
                    });
                }
            }

            return new DayNoteService();
        }]);

