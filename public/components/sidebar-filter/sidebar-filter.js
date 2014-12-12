import angular from 'angular';

import _ from 'lodash';
import 'lib/filters-service';

angular.module('wfSidebarFilter', ['wfFiltersService'])
    .directive('wfSidebarFilter', ['wfFiltersService', '$injector', function (wfFiltersService, $injector) {

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
            var currentSelection = wfFiltersService.get($scope.filter.namespace);

            if (!currentSelection) {
                $scope.selectedFilters = [];
            } else {
                $scope.selectedFilters = currentSelection.split(",")
            }

            if ($scope.filter.customLinkFunction) { // Custom linking function for non-standard filters
                $injector.invoke(
                    $scope.filter.customLinkFunction, // function
                    this, // scope for execution
                    {
                        '$scope': $scope // local variables to be used before dependency resolution
                    }
                );
            }

            $scope.filterIsSelected = function(filter) {
                if($scope.selectedFilters.length < 1)
                    return filter.value === $scope.defaultFilter.value
                else
                    return (filter != null && _.contains($scope.selectedFilters, filter.value));
            };

            $scope.defaultFilterClick = function(filter) {
                // this is a replace operartion, instead of an add
                $scope.selectedFilters = [];
                $scope.$emit('filtersChanged.' + $scope.filter.namespace, $scope.selectedFilters);
            }

            $scope.filterClick = function(filter) {
                if($scope.filterIsSelected(filter)) {
                    $scope.selectedFilters =
                        _.filter($scope.selectedFilters,
                                 flt => flt !== filter.value);
                } else {
                    $scope.selectedFilters.push(filter.value);
                }
                $scope.$emit('filtersChanged.' + $scope.filter.namespace, $scope.selectedFilters);
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
