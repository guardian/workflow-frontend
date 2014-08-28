define(['moment', '../dashboard'], function(moment, dashboardControllers) {

  'use strict';

  var baseDate = function() { return moment() };

  dashboardControllers.controller('CreatedAtFilter', ['$scope', function($scope) {
    /* cb's return an obj containing from and to. Times relative to the base date */
    $scope.cannedFilters = [{
      name: "Last 24hrs", cb: function(dt) { return { from: dt.subtract('days', 1) } }
    }]
  }]);

});
