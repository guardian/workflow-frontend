define([
    'angular',
    'moment',
    '../dashboard'
], function (
    angular,
    moment,
    dashboardControllers
) {
    'use strict';



    dashboardControllers.controller('DateFilterCtrl',
        ['$scope','$location', 'paramsService', 'filtersService', function($scope, $location, paramsService, filtersService) {
        $scope.dateOptions = filtersService.mkDateOptions();
        var selectedDate = filtersService.get('selectedDate');

        // ensure that the date from the URL is the same object as the
        // one used in the Select drop-down, as its compared with ===
        $scope.dateOptions.forEach(function(date) {
          if (date.isSame(selectedDate)) {
            selectedDate = date;
          }
        });

        $scope.selectedDate = selectedDate;

        $scope.$watch('selectedDate', function(date) {
            filtersService.updateDate(date);
            $scope.$emit('changedFilters');
        });

    }]);

    return dashboardControllers;
});
