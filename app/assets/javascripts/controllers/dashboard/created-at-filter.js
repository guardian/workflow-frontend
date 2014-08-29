define(['moment', '../dashboard'], function(moment, dashboardControllers) {

    'use strict';

    dashboardControllers.controller('CreatedAtFilter', ['$scope', function($scope) {
        $scope.cannedFilters = [{
            caption: "Yesterday", value: "yesterday"
        }]

        $scope.selectedFilter = "";

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
