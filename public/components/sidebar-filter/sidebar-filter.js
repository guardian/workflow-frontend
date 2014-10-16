import angular from 'angular';

import 'lib/filters-service';

angular.module('wfSidebarFilter', ['wfFiltersService'])
    .directive('wfSidebarFilter', ['wfFiltersService', function (wfFiltersService) {

    return {
        restrict: 'E',
        replace: true,
        templateUrl: '/assets/components/sidebar-filter/sidebar-filter.html',
        scope: {
            filter: '=wfFilter',
            listIsOpen: '@wfListIsOpen'
        },
        link: function ($scope, elem, attrs) {

            $scope.defaultFilter = { caption: "All", value: null };
            $scope.selectedFilter = wfFiltersService.get($scope.filter.namespace);

            if (!$scope.selectedFilter) {
                $scope.selectedFilter = null;
            }

            $scope.filterIsSelected = function(filter) {
                return (filter != null && filter.value === $scope.selectedFilter);
            };

            $scope.filterClick = function(filter) {
                if($scope.filterIsSelected(filter)) {
                    $scope.selectedFilter = null;
                } else {
                    $scope.selectedFilter = filter.value;
                }

                $scope.$emit('filtersChanged.' + $scope.filter.namespace, $scope.selectedFilter);
            };

            $scope.toggleSidebarSection = function () {
                $scope.list = $scope.list || elem[0].querySelector('.sidebar__filter-list');

                if (!$scope.listHeight) {
                    $scope.listHeight = $scope.list.offsetHeight;
                    $scope.list.style.maxHeight = $scope.listHeight + 'px';
                    getComputedStyle($scope.list).maxHeight; // Force reflow in FF & IE
                }

                if ($scope.listIsOpen) {
                    $scope.listIsOpen = false;
                    $scope.list.style.maxHeight = '0px';
                } else {
                    $scope.listIsOpen = true;
                    $scope.list.style.maxHeight = $scope.listHeight + 'px';
                }

            };
        }
    };
}]);
