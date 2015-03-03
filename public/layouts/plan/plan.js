import angular from 'angular';

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
    }]);
