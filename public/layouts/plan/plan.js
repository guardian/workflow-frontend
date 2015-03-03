import angular from 'angular';


angular.module('wfPlan', [])
    .controller('wfPlanController', ['$scope', function wfPlanController ($scope) {
        // controller stuff

        $scope.plannedItems = [1, 2, 3, 4, 5];

    }]);

