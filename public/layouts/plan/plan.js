import angular from 'angular';
import moment  from 'moment';
import _       from 'lodash';

import 'jquery'
import 'jquery-ui/draggable'
import 'jquery-ui/droppable'

import 'angular-dragdrop';

import { wfDayView } from 'components/plan-view/day-view/day-view';
import { wfDayViewPlanItem } from 'components/plan-view/day-view-plan-item/day-view-plan-item';

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
    .directive('wfDayView', ['$rootScope', '$http', '$timeout', wfDayView])
    .directive('wfDayViewPlanItem', ['$rootScope', '$http', '$timeout', 'wfContentService', wfDayViewPlanItem])
    .service('wfPlanLoader', [ 'wfHttpSessionService', 'wfPlanService', 'wfPollingService', 'wfFiltersService', '$rootScope', '$http', function (http, planService, PollingService, wfFiltersService, $rootScope, $http) {

        var filterParams = wfFiltersService.getAll();
        function params() {
            return {
                'newsList': filterParams['news-list']
            }
        }

        this.poller = new PollingService(planService, params);

        this.render = (response) => {
            $rootScope.$broadcast('plan-view-data-load', response.data.data);
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
    .controller('wfPlanController', ['$scope', '$rootScope', 'wfPlanLoader', '$http', function wfPlanController ($scope, $rootScope, planLoader, $http) {
        withLocale("", function () {

        $scope.genColor = (s) => {
            function hashCode(str) { // java String#hashCode
                var hash = 0;
                for (var i = 0; i < str.length; i++) {
                   hash = str.charCodeAt(i) + ((hash << 5) - hash);
                }
                return hash;
            }

            function intToARGB(i) {
                var c = ((i>>24)&0xFF).toString(16) +
                        ((i>>16)&0xFF).toString(16) +
                        ((i>>8)&0xFF).toString(16);

                return("#" + c);
            }

            return { 'border-left-color': intToARGB(hashCode(s || "empty")) };
        }


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

        $scope.$on('quick-add-submit', function (ev, item) {

            console.log("quick ADD!", item);
            $http.post("/api/v1/plan/item", JSON.stringify(item))
                .then((res) => {
                    console.log("success", res);
                    planLoader.poller.refresh()
                        .then(updateScopeItems);
                    $rootScope.$emit('quick-add-success');
                })
                .catch((err) => {
                    $rootScope.$emit('quick-add-failure');
                    console.log("error", err);
                });
        });

        $scope.selectedDate = moment().startOf('day');

        $scope.selectDay = function (date) {
            $scope.selectedDate = date;
        };

        $scope.$watch('startDate', () => {
           console.log(arguments);
        });

        // controller stuff
        $scope.plannedItems = [];

        $scope.$on('plan-view-data-load', function (ev, data) {
            $scope.plannedItems = _.map(data, (item) => {
                item.plannedDate = moment(item.plannedDate);
                return item;
            });
            $scope.$broadcast('planned-items-changed', $scope.plannedItems);
            document.querySelector('.plan-container').classList.add('loaded');
        });

        function makeDateList() {
            var ret =  withLocale('wfPlan', () => {
                var start = moment().subtract(3, 'days').startOf('day');
                return _.map(_.range(0, 10), (days) => {
                    var date = start.clone();
                    date.add(days, 'days');
                    return date;
                });
            });
            return ret;
        }
        function updateScopeItems() {
            $scope.dayItems = $scope.getItems(moment($scope.currentlySelectedDay), moment($scope.currentlySelectedDay).add(1, 'days'));
            $scope.agendaItems = _.groupBy($scope.dayItems, function(item) { return item.bundleId || "No Bundle" });
        }
        $scope.$on('planned-items-changed', function () {
            updateScopeItems();
        });
        $scope.getItems = function (dateFrom, dateTo) {
            // search all of the planned items, and find the ones that
            // are within our date range
            return _.filter($scope.plannedItems, (item) => {
                var ret = (item.plannedDate.isSame(dateFrom) || item.plannedDate.isAfter(dateFrom)) &&
                    item.plannedDate.isBefore(dateTo);
                return ret;
            });
        };
        $scope.dateList = makeDateList();

        $scope.getBundles = function () { return _.keys($scope.agendaItems); };
        $scope.$watch('selectedDate', (newValue, oldValue) => {
            $scope.currentlySelectedDay = newValue;
            updateScopeItems();
        }, false);

    }])
    .controller('wfDateListController', [ '$scope', function ($scope) {
        $scope.$on('planned-items-changed', (ev, eventItems) => {
            $scope.items = $scope.getItems($scope.date, $scope.date.clone().add(1, 'days'));
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
