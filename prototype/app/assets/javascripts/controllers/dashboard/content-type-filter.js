define(['../dashboard'], function(dashboardControllers) {

    'use strict';

    dashboardControllers.controller('ContentTypeFilter', ['$scope', function($scope) {

        $scope.defaultFilter = { caption: "All", value: null };

        $scope.cannedFilters = [
            { caption: "Article", value: "article", icon: "file" },
            { caption: "Liveblog", value: "liveblog", icon: "th-list" },
            { caption: "Gallery", value: "gallery", icon: "camera" },
            { caption: "Interactive", value: "interactive", icon: "hand-up" }
        ];

        if (!$scope.selectedContentType) {
          $scope.selectedContentType = null;
        }

        $scope.filterIsSelected = function(filter) {
          return (filter != null && filter.value === $scope.selectedContentType);
        };

        $scope.filterClick = function(filter) {
          if($scope.filterIsSelected(filter)) {
            $scope.selectedContentType = null;
          } else {
            $scope.selectedContentType = filter.value;
          }

          $scope.$emit('filtersChanged.content-type', $scope.selectedContentType);
        }
    }]);

});
