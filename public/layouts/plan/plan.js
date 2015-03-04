import angular from 'angular';
import moment  from 'moment';
import _       from 'lodash';

function withLocale(locale, f) {
    // can't find a way to create a new locale without
    // changing the global locale also
    var oldLocale = moment.locale();
    moment.locale(locale);
    var ret = f();
    moment.locale(oldLocale);
    return ret;
}

angular.module('wfPlan', ['wfPlanService', 'wfPollingService'])
    .service('wfPlanLoader', [ 'wfHttpSessionService', 'wfPlanService', 'wfPollingService', '$rootScope', '$http', function (http, planService, PollingService, $rootScope, $http) {

        this.poller = new PollingService(planService, () => { return {}; })

        this.render = (response) => {
            $rootScope.$broadcast('plan-view-data-load', response.data.data);
        }

        this.renderError = (err) => {
            console.log(err)
        }

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
    .controller('wfPlanController', ['$scope', 'wfPlanLoader', '$http', function wfPlanController ($scope, planLoader, $http) {
        withLocale("", function () {
            var calLocale = {
                calendar : {
                    lastDay : '[Yesterday]',
                    sameDay : '[Today]',
                    nextDay : '[Tomorrow]',
                    lastWeek : '[last] dddd',
                    nextWeek : 'dddd',
                    sameElse : 'L'
                }
            };
            moment.locale('wfPlan', calLocale);
        });

        $scope.$on('quick-add-submit', function (ev, item) {
            console.log("quick ADD!", item);
            $http.post("/api/v1/plan/item", JSON.stringify(item))
                .then((res) => console.log("success", res))
                .catch((err) => console.log("error", err));
        });

        $scope.selectedDate = null;

        $scope.selectDay = function (date) {
            console.log("selectDay", date);
            $scope.selectedDate = date;
        };

        $scope.$watch('startDate', () => {
           console.log(arguments);
        });

        // controller stuff
        $scope.plannedItems = []

        $scope.$on('plan-view-data-load', function (ev, data) {
            $scope.plannedItems = _.map(data, (item) => {
                item.plannedDate = moment(item.plannedDate)
                return item;
            });
            $scope.$broadcast('planned-items-changed', $scope.plannedItems);
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
        $scope.getItems = function (dateFrom, dateTo) {
            // search all of the planned items, and find the ones that
            // are within our date range
            return _.filter($scope.plannedItems, (item) => {
                var ret = (item.plannedDate.isSame(dateFrom) || item.plannedDate.isAfter(dateFrom)) &&
                    item.plannedDate.isBefore(dateTo);
                return ret;
            });
        }
        $scope.dateList = makeDateList();
    }])
    .controller('wfDateListController', [ '$scope', function ($scope) {
        $scope.$on('planned-items-changed', (ev, eventItems) => {
            $scope.items = $scope.getItems($scope.date, $scope.date.clone().add(1, 'days'));
        });
    }])
    .controller('wfNewsAgendaController', [ '$scope', function ($scope) {
        $scope.getBundles = function () { return _.keys($scope.agendaItems); };
        $scope.$watch('selectedDate', (newValue, oldValue) => {
            $scope.agendaItems = _.groupBy($scope.getItems(moment(newValue),
                                                 moment(newValue).add(1, 'days')), function(item) { return item.bundleId  });


        }, true);

    }])
    .controller('wfDetailedListController', ['$scope', function($scope){
        $scope.$watch('selectedDate', (newValue, oldValue) => {
            $scope.morningItems = $scope.getItems(moment(newValue),moment(newValue).add(12,'hours'));
            $scope.afternoonItems = $scope.getItems(moment(newValue).add(12,'hours'),moment(newValue).add(18,'hours'));
            $scope.eveningItems = $scope.getItems(moment(newValue).add(18,'hours'),moment(newValue).add(24,'hours'));
        }, true);
    }]);
