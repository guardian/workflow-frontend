import angular from 'angular';
import moment  from 'moment';
import _       from 'lodash';

import 'jquery'
import 'jquery-ui/draggable'
import 'jquery-ui/droppable'

import 'angular-dragdrop';

import { wfBundleView } from 'components/plan-view/bundle-view/bundle-view';
import { wfDayView } from 'components/plan-view/day-view/day-view';
import { wfPlanItem } from 'components/plan-view/plan-item/plan-item';
import { wfInlineAddItem } from 'components/plan-view/inline-add-item/inline-add-item';

function withLocale(locale, f) {
    // can't find a way to create a new locale without
    // changing the global locale also
    var oldLocale = moment.locale();
    moment.locale(locale);
    var ret = f();
    moment.locale(oldLocale);
    return ret;
}

angular.module('wfPlan', ['wfPlanService', 'wfPollingService', 'wfFiltersService', 'ngDragDrop'])
    .directive('wfBundleView', ['$rootScope','$timeout', 'wfBundleService', 'wfPlannedItemService', 'wfFiltersService', wfBundleView])
    .directive('wfDayView', ['$rootScope', 'wfPlannedItemService', '$http', '$timeout', 'wfFiltersService', wfDayView])
    .directive('wfPlanItem', ['$rootScope', '$http', '$timeout', 'wfContentService', 'wfBundleService', 'wfPlannedItemService', wfPlanItem])
    .directive('wfInlineAddItem', ['$timeout', wfInlineAddItem])
    .service('wfPlanLoader', [ 'wfHttpSessionService', 'wfPlanService', 'wfPollingService', 'wfFiltersService', '$rootScope', '$http', function (http, planService, PollingService, wfFiltersService, $rootScope, $http) {

        var filterParams = wfFiltersService.getAll();
        function params() {
            return {
                'newsList': filterParams['news-list']
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
    .filter('dateListFormatter', [function () {
        return function(date) {
            // date should be a moment() instance but we can make sure it is
            return moment(date).calendar();
        }
    }])
    .controller('wfPlanController', ['$scope', '$rootScope', 'wfPlanLoader', '$http', '$timeout', 'wfDayNoteService', 'wfFiltersService', 'wfPlannedItemService', function wfPlanController ($scope, $rootScope, planLoader, $http, $timeout, wfDayNoteService, wfFiltersService, wfPlannedItemService) {

        withLocale("", function () {

            var calLocale = {
                calendar : {
                    lastDay : '[Yesterday]',
                    sameDay : '[Today]',
                    nextDay : '[Tomorrow]',
                    lastWeek : '[Last] dddd',
                    nextWeek : 'dddd',
                    sameElse : 'L'
                }
            };
            moment.locale('wfPlan', calLocale);
        });

        $rootScope.$on('plan-view__ui-loaded', function() {
            $scope.isLoaded = true;
        });

        $scope.$on('quick-add-submit', function (ev, item) {

            wfPlannedItemService.add(item)
                .then((res) => {
                    planLoader.poller.refresh()
                        .then(updateScopeItems);
                    $rootScope.$emit('quick-add-success');
                })
                .catch((err) => {
                    $rootScope.$emit('quick-add-failure');
                });
        });

        $scope.$on('bundles-edited', () => {
            planLoader.poller.refresh()
                .then(updateScopeItems);
        });

        $scope.selectedDate = moment().startOf('day');

        $scope.selectDay = function (date) {
            $scope.selectedDate = date;
        };

        //$scope.$watch('startDate', () => {
        //   console.log(arguments);
        //});

        // controller stuff
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

        function makeDateList() {
            var ret =  withLocale('wfPlan', () => {
                var start = moment().subtract(3, 'days').startOf('day');

                let dateList = _.map(_.range(0, 10), (days) => {
                    var date = start.clone();
                    date.add(days, 'days');
                    return {'date':date};
                });
                return dateList;
            });
            return ret;
        }

        /**
         * Create the scope items for the bundle view and the day view using the currently selected date
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

        $scope.$on('pvFiltersChanged', function() {

            planLoader.poller.refresh();
            $scope.newsList = wfFiltersService.get('news-list');
            $scope.buildDateListAndDayNotes();
        });

        $scope.$on('plan-view__planned-items-changed', function () {
            $timeout(updateScopeItems); // Ensure scope is applied on the next digest loop
        });

        $scope.buildDateListAndDayNotes = function() {

            $scope.dateList = makeDateList();
            if ($scope.newsList) {

                wfDayNoteService.get({
                    'newsList': $scope.newsList,
                    'startDate': $scope.dateList[0].date.toISOString(),
                    'endDate': $scope.dateList[$scope.dateList.length-1].date.toISOString()
                }).then((response) => {

                    let dayNotes = response.data.data;
                    $scope.dateList.map((date) => {

                        let dateDayNote = dayNotes.filter((note) => {
                            return moment(note.day).isSame(date.date, 'day');
                        })[0];
                        date.dayNote = dateDayNote ? dateDayNote : {};
                        return date;
                    });
                });
            }

        };

        $scope.updateDayNote = function(id, newValue, date) {
            if (id) {
                wfDayNoteService.updateField(id, 'note', newValue);
            } else {

                wfDayNoteService.add({
                    'id': 0,
                    'note': newValue,
                    'day': date.format('YYYY-MM-DD'),
                    'newsList': $scope.newsList
                })
            }
        };


        $scope.getBundles = function () { return _.keys($scope.agendaItems); };
        $scope.$watch('selectedDate', (newValue, oldValue) => {
            $scope.currentlySelectedDay = newValue;
            updateScopeItems();
        }, false);

        $scope.getItems = function (dateFrom, dateTo) {
            // search all of the planned items, and find the ones that
            // are within our date range
            return _.filter($scope.plannedItems, (item) => {
                var ret = (item.plannedDate.isSame(dateFrom) || item.plannedDate.isAfter(dateFrom)) &&
                    item.plannedDate.isBefore(dateTo);
                return ret;
            });
        };

    }])
    .controller('wfDateListController', [ '$scope', function ($scope) {
        $scope.$on('plan-view__planned-items-changed', (ev, eventItems) => {
            $scope.items = $scope.getItems($scope.date.date, $scope.date.date.clone().add(1, 'days'));
        });
    }])
    .directive('wfOnResize', ['$window', '$parse', function ($window, $parse) {
        return {
            restrict: 'A',
            link: function ($scope, elem, attrs) {
                //console.log("AATTRS>>>>>>>>>>>", attrs.wfOnResize);
                //let fn = $parse(attrs.wfOnResize);
                //console.log(typeof fn);
                //console.log(fn($scope));
            }
        }
    }])
    //.controller('wfNewsAgendaController', [ '$scope', function ($scope) {
    //
    //
    //}]);
    //.controller('wfDetailedListController', ['$scope', function($scope){
    //    $scope.$watch('selectedDate', (newValue, oldValue) => {
    //        $scope.morningItems = $scope.getItems(moment(newValue),moment(newValue).add(12,'hours'));
    //        $scope.afternoonItems = $scope.getItems(moment(newValue).add(12,'hours'),moment(newValue).add(18,'hours'));
    //        $scope.eveningItems = $scope.getItems(moment(newValue).add(18,'hours'),moment(newValue).add(24,'hours'));
    //    }, true);
    //}]);
