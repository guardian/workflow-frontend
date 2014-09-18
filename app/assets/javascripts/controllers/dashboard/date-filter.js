define([
    'angular',
    'moment',
    '../dashboard'
], function (angular, moment, dashboardControllers) {
    'use strict';

    dashboardControllers.controller('DateFilterCtrl',
        ['$scope', '$location', 'wfFiltersService', 'wfDateParser',
            function ($scope, $location, wfFiltersService, wfDateParser) {

                $scope.dateOptions = wfDateParser.getDaysThisWeek();
                var selectedDate = wfFiltersService.get('selectedDate');

                // ensure that the date from the URL is the same object as the
                // one used in the Select drop-down, as its compared with ===
                $scope.dateOptions.forEach(function (date) {
                    if (date.isSame(selectedDate)) {
                        selectedDate = date;
                    }
                });

                $scope.selectedDate = selectedDate;

                $scope.$watch('selectedDate', function () {
                    $scope.$emit('filtersChanged.selectedDate', $scope.selectedDate);
                });

            }]);

    return dashboardControllers;
});
