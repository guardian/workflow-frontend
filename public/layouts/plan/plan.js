import angular from 'angular';
import moment  from 'moment';
import _       from 'lodash';

function withLocale(locale, f) {
    // can't find a way to create a new locale without
    // changing the global locale also
    var oldLocale = moment.locale();
    moment.locale(locale);
    console.log("-> locale", moment.locale());
    var ret = f();
    moment.locale(oldLocale);
    console.log("<- locale", moment.locale());
    return ret;
}

angular.module('wfPlan', [])
    .service('wfPlanLoader', [ 'wfHttpSessionService', function (http) {
        // LOAD from the API here
        function loadPlanItems() {
            return http.request({url: "/api/v1/plan"}).then((res) => _.map(res.data.data, (item) => {
                item.plannedDate = moment(item.plannedDate);
                return item;
            }));
        };
        return {
            load: loadPlanItems
        };
    }])
    .filter('dateListFormatter', [function () {
        return function(date) {
            // date should be a moment() instance but we can make sure it is
            return moment(date).calendar();
        }
    }])
    .controller('wfPlanController', ['$scope', 'wfPlanLoader', function wfPlanController ($scope, planLoader) {
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
        
        // controller stuff
        $scope.plannedItems = []
        planLoader.load().then((items) => {
            console.log("items", items);
            $scope.apply(function () { $scope.plannedItems = items; })
        });
        function makeDateList() {
            return withLocale('wfPlan', () => {
                var now = moment().startOf('day');
                return _.map(_.range(0, 10), (days) => moment().add(days, 'days'));
            });
        }
        $scope.getItems = function (dateFrom, dateTo) {
            // search all of the planned items, and find the ones that
            // are within our date range
            return _.filter($scope.plannedItems, (item) => {
                return item.plannedDate
            });
        }
        $scope.dateList = makeDateList();
    }]);
