import angular from 'angular';

import 'lib/date-service';
import 'lib/filters-service';
import 'components/location-picker/location-picker';
import 'components/compactor-toggle/compactor-toggle';
import 'components/sidebar-filter/sidebar-filter';
import { filterDefaults } from 'lib/filter-defaults';

import './dashboard-sidebar.html';

angular.module('wfDashboardSidebar', ['wfFiltersService', 'wfSidebarFilter', 'wfLocationPicker', 'wfCompactorToggle'])
    .controller('wfDashboardSidebarController', ['$scope', 'statuses', 'wfFiltersService', 'wfPreferencesService', function ($scope, statuses, wfFiltersService, wfPreferencesService) {

        $scope.statuses = statuses;

        $scope.filters = filterDefaults(statuses, wfFiltersService)

        wfPreferencesService.getPreference('featureSwitches')
        .then((featureSwitches) => {
            $scope.filters = filterDefaults(statuses, wfFiltersService, featureSwitches);
        })
        .catch((err) => { 
            console.warn('failed to get featureSwitches', err) 
        })

        function enableSidebar() {
            $scope.enabled = "active";
        }

        function disableSidebar() {
            $scope.enabled = "inactive";
        }

        $scope.$on("search-mode.enter", disableSidebar);
        $scope.$on("search-mode.exit",  enableSidebar);

        // default to enabled
        enableSidebar();
    }]);
