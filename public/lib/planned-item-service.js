import angular from 'angular';

import 'lib/http-session-service';

angular
    .module('wfPlannedItemService', ['wfHttpSessionService'])
    .factory('wfPlannedItemService', ['$rootScope', '$log', 'wfHttpSessionService',
        function ($rootScope, $log, wfHttpSessionService) {
            var httpRequest = wfHttpSessionService.request;

            class PlannedItemService {

                get(params) { // untested
                    return httpRequest({
                        method: 'GET',
                        url: '/api/v1/plan/item',
                        params: params
                    });
                }

                add(plannedItem) {
                    return httpRequest({
                        method: 'POST',
                        url: '/api/v1/plan/item',
                        data: plannedItem
                    });
                }

                /**
                 * Update a single field on a plannedItem
                 * @param plannedItemId
                 * @param fieldName
                 * @param value
                 * @returns {Promise}
                 */
                updateField(plannedItemId, fieldName, value) {
                    return httpRequest({
                        method: 'PATCH',
                        url: '/api/v1/plan/item/' + plannedItemId + '/' + fieldName,
                        data: {
                            'data': value
                        }
                    });
                }

                remove(plannedItem) {
                    return httpRequest({
                        method: 'DELETE',
                        url: '/api/v1/plan/item',
                        data: plannedItem,
                        headers: {'Content-Type': 'application/json'}
                    });
                }

                /**
                 * Update multiple fields on a plannedItem and return a single promise
                 * @param plannedItemId
                 * @param fieldsAndValues key,value pairs to update
                 */
                updateFields(plannedItemId, fieldsAndValues) {

                    let promises = [];

                    for (let key in fieldsAndValues) {
                        if (fieldsAndValues.hasOwnProperty(key)) {
                            promises.push(this.updateField(plannedItemId, key, fieldsAndValues[key]));
                        }
                    }

                    return Promise.all(promises);
                }

                //blankItem() {
                //    return {
                //        title: newItemName ? newItemName : "New Item",
                //        id: 0,
                //        newsList: wfFiltersService.get('news-list') || 0,
                //        plannedDate: moment().toISOString(),
                //        bundleId: bundle.id
                //    };
                //}
            }

            return new PlannedItemService();
        }]);

