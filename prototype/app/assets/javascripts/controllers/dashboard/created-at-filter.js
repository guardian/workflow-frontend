define(['../dashboard'], function(dashboardControllers) {

    'use strict';

    dashboardControllers.controller('CreatedAtFilter', ['$scope', function($scope) {
        $scope.cannedFilters = [
            { caption: "Any", value: null },
            { caption: "Yesterday", value: "yesterday" },
            { caption: "Today", value: "today" },
            { caption: "Last 24 Hours", value: "last24" },
            { caption: "Last 48 Hours", value: "last48" }
        ]

        $scope.selectedFilter = null;

        $scope.filterIsSelected = function(filter) {
            return (filter != null && filter.value === $scope.selectedFilter);
        }

        $scope.filterClick = function(filter) {
            if($scope.filterIsSelected(filter)) {
                $scope.selectedFilter = null;
            } else {
                $scope.selectedFilter = filter.value;
            }
            $scope.$emit('filtersChanged.createdAt', $scope.selectedFilter);
        }
    }]);

});
