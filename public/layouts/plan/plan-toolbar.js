import angular from 'angular';

import 'lib/filters-service';

angular.module('wfPlanToolbar', ['wfFiltersService'])
    .controller('wfPlanToolbarController', ['$scope', function ($scope) {
        // controller stuff
        $scope.a = "b";
    }]);
