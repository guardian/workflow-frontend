import angular from 'angular';
import moment  from 'moment';
import _       from 'lodash';

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
    .controller('wfPlanController', ['$scope', 'wfPlanLoader', function wfPlanController ($scope, planLoader) {
        moment.locale('wfPlan', {
            calendar : {
                lastDay : '[Yesterday]',
                sameDay : '[Today]',
                nextDay : '[Tomorrow]',
                lastWeek : '[last] dddd',
                nextWeek : 'dddd',
                sameElse : 'L'
            }
        });
        // controller stuff
        $scope.plannedItems = []
        planLoader.load().then((items) => {
            console.log("items", items);
            $scope.apply(function () { $scope.plannedItems = items; })
        });
        function makeDateList() {
            var now = moment().locale("wfPlan");
            return _.map(_.range(0, 10), (days) => moment().add(days, 'days'));
        }
        $scope.getItems = function (date) {
        }
        $scope.dateList = makeDateList();
    }]);
