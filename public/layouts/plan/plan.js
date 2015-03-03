import angular from 'angular';
import moment  from 'moment';
import _       from 'lodash';

angular.module('wfPlan', [])
    .service('wfPlanLoader', function () {
        // LOAD from the API here
        function loadPlanItems() {
            return [{
                title: "Stuff will happen here"
            }];
        }
        return {
            load: loadPlanItems
        }
    })
    .controller('wfPlanController', ['$scope', 'wfPlanLoader', function wfPlanController ($scope, planLoader) {
        // controller stuff
        $scope.plannedItems = planLoader.load();
        function makeDateList() {
            var now = moment();
            return _.map(_.range(0, 10), (days) => moment().add(days, 'days'));
        }
        $scope.dateList = makeDateList();
    }]);
