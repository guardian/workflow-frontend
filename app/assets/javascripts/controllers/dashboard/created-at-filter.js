define(['moment', '../dashboard'], function(moment, dashboardControllers) {

    'use strict';

    dashboardControllers.controller('CreatedAtFilter', ['$scope', function($scope) {
        $scope.cannedFilters = [{
            caption: "Yesterday", value: "yesterday"
        }]

        $scope.selectedFilter = "";

        $scope.filterClick = function(filter) {
            $scope.selectedFilter = filter;
            $scope.$emit('filtersChanged.createdAt', filter.value);
        }
    }]);

});
