import angular from 'angular';
import moment  from 'moment';
import _       from 'lodash';

import 'jquery'
import 'jquery-ui/draggable'
import 'jquery-ui/droppable'

import 'angular-dragdrop';

import { wfDateView } from 'components/plan-view/date-view/date-view';
import { wfBundleView } from 'components/plan-view/bundle-view/bundle-view';
import { wfDayView } from 'components/plan-view/day-view/day-view';
import { wfPlanItem } from 'components/plan-view/plan-item/plan-item';
import { wfInlineAddItem } from 'components/plan-view/inline-add-item/inline-add-item';
import { wfDateRangeWidget } from  'components/plan-view/date-range-widget/date-range-widget';
import { wfBundleSearch } from  'components/plan-view/bundle-search/bundle-search';


angular.module('wfPlan', ['wfPlanService', 'wfPollingService', 'wfFiltersService', 'ngDragDrop'])
    .directive('wfDateView', ['$rootScope','$timeout', 'wfDayNoteService', 'wfPlannedItemService', 'wfFiltersService', '$sce', wfDateView])
    .directive('wfBundleView', ['$rootScope','$timeout', 'wfBundleService', 'wfPlannedItemService', 'wfFiltersService', wfBundleView])
    .directive('wfDayView', ['$rootScope', 'wfPlannedItemService', '$http', '$timeout', 'wfFiltersService', wfDayView])
    .directive('wfPlanItem', ['$rootScope', '$http', '$timeout', 'wfContentService', 'wfBundleService', 'wfPlannedItemService', wfPlanItem])
    .directive('wfInlineAddItem', ['$timeout', wfInlineAddItem])
    .directive('wfDateRangeWidget', ['$timeout', 'wfFiltersService', wfDateRangeWidget])
    .directive('wfBundleSearch', ['$timeout', wfBundleSearch])
    .service('wfPlanLoader', [ 'wfHttpSessionService', 'wfPlanService', 'wfPollingService', 'wfFiltersService', '$rootScope', '$http', function (http, planService, PollingService, wfFiltersService, $rootScope, $http) {

        function params() {
            let filterParams = wfFiltersService.getAll();
            return {
                'newsList': filterParams['news-list'],
                'startDate': filterParams['plan-start-date'],
                'endDate': filterParams['plan-end-date']
            }
        }

        this.poller = new PollingService(planService, params);

        this.render = (response) => {
            $rootScope.$broadcast('plan-view__data-load', response.data.data);
        };

        this.renderError = (err) => {
            console.log(err)
        };

        this.poller.onPoll(this.render);
        this.poller.onError(this.renderError);

        this.poller.startPolling();
    }])
    .controller('wfPlanController', ['$scope', '$rootScope', 'wfPlanLoader', '$http', '$timeout', 'wfDayNoteService', 'wfFiltersService', 'wfPlannedItemService', function wfPlanController ($scope, $rootScope, planLoader, $http, $timeout, wfDayNoteService, wfFiltersService, wfPlannedItemService) {

        // ADD ALPHA LABEL
        (function createBetaLabel () {
            let title = angular.element('<span class="plan-view__title">Plan view <span class="plan-view__title--beta">ALPHA</span></span>');
            document.querySelector('.top-toolbar__title').appendChild(title[0]);
        })();
        // ! ADD ALPHA LABEL

        $rootScope.$on('plan-view__ui-loaded', function() {
            $scope.isLoaded = true;
        });

        (function monitorDateRangeForChanges () {

            $scope.planDateRange = null;

            $scope.$watch('planDateRange.startDate', (newValue, oldValue) => {
                if (newValue) {
                    $scope.$emit('plan-view__filters-changed.plan-start-date', newValue.toISOString());
                }
            }, true);

            $scope.$watch('planDateRange.endDate', (newValue, oldValue) => {
                if (newValue) {
                    $scope.$emit('plan-view__filters-changed.plan-end-date', newValue.toISOString());
                }
            }, true);
        })();

        $scope.selectedDate = moment().startOf('day');

        $scope.selectDay = function (date) {
            $scope.selectedDate = date.startOf('day');
        };

        $scope.plannedItems = [];
        $scope.plannedItemsByBundle = [];

        $scope.$on('plan-view__data-load', function (ev, data) {

            data.forEach((bundle) => {
                bundle.items.map((item) => {
                    item.plannedDate = moment(item.plannedDate);
                    return item;
                });
            });

            $scope.plannedItemsByBundle = data;

            $scope.plannedItems = $scope.plannedItemsByBundle.map((bundle) => {
                return bundle.items;
            }).flatten();

            $scope.$broadcast('plan-view__planned-items-changed', $scope.plannedItemsByBundle);
        });

        /**
         * These watchers handle changes to various scope properties when they are changed
         * and ensure that the data is correctly processed for use by the UI via updateScopeItems
         */
        (function setUpWatchersForUserActionScopeChanges () {

            // Currently Selected Date
            $scope.$watch('selectedDate', (newValue, oldValue) => {
                $scope.currentlySelectedDay = newValue;
                $timeout(updateScopeItems);
                $rootScope.$emit('plan-view__date-selected')
            }, false);

            // parameters loaded from the URL
            $scope.$on('plan-view__filters-changed', function() {

                planLoader.poller.refresh()
                    .then(() => {
                        $timeout(updateScopeItems);
                    });
                $scope.newsList = wfFiltersService.get('news-list');
            });

            // Item added to interface via quick add
            $scope.$on('plan-view__quick-add-submit', function (ev, item) {

                wfPlannedItemService.add(item)
                    .then((res) => {
                        planLoader.poller.refresh()
                            .then(() => {
                                $timeout(updateScopeItems);
                            });
                        $rootScope.$emit('plan-view__quick-add-success');
                    })
                    .catch((err) => {
                        $rootScope.$emit('plan-view__quick-add-failure');
                    });
            });

            // Items altered in Plan View
            $scope.$on('plan-view__planned-items-changed', () => {
                 $timeout(updateScopeItems);
            });

            $scope.$on('plan-view__plan-item-deleted', (ev, deletedItem) => {

                function removeItemFromList(list, item) {
                    return list.filter((i) => i.id !== item.id);
                }
                $timeout( () => {
                    $scope.dayItems = removeItemFromList($scope.dayItems, deletedItem);
                    $scope.dayItemsByBundle = $scope.dayItemsByBundle.map( (bundle) => {
                        if (bundle.id === deletedItem.bundleId) {
                            bundle.itemsToday =  removeItemFromList(bundle.itemsToday, deletedItem);
                            bundle.items = removeItemFromList(bundle.items, deletedItem);
                        }
                        return bundle;
                    })
                });
            });

            // Items altered in bundle view
            $scope.$on('plan-view__bundles-edited', () => {
                planLoader.poller.refresh()
                    .then(() => {
                        $timeout(updateScopeItems);
                    });
            });
        })();

        /**
         * Create the scope items for the bundle and day view using the currently selected date
         */
        function updateScopeItems() {

            let selectedDay = moment($scope.currentlySelectedDay),
                selectedDayPlusOne = moment($scope.currentlySelectedDay).add(1, 'days');

            /**
             * Does a plannedItems date fall within a date range?
             * @param item
             * @param dateFrom
             * @param dateTo
             * @returns {*}
             */
            function itemIsWithinDateRange (item, dateFrom, dateTo) {

                return (item.plannedDate.isSame(dateFrom) || item.plannedDate.isAfter(dateFrom)) &&
                    item.plannedDate.isBefore(dateTo)
            }

            // Filter items for the bundle view
            $scope.dayItemsByBundle = $scope.plannedItemsByBundle.map((bundle) => {

                bundle.itemsToday = bundle.items.filter((item) => {

                    return itemIsWithinDateRange(item, selectedDay, selectedDayPlusOne);
                });
                return bundle;
            });

            // Filter items for the day view
            $scope.dayItems = $scope.plannedItems.filter((item) => {

                return itemIsWithinDateRange(item, selectedDay, selectedDayPlusOne);
            });
        }

        // Interface tracking
        $scope.$watch('byBundle', (newValue, oldValue) => {
            if (newValue) {
                $scope.$emit('plan-view__bundle-tab-chosen', {});
            }
        });

    }]);
