define(['moment', '../dashboard'], function(moment, dashboardControllers) {

  'use strict';

  var baseDate = function() { return moment() };

  /* most filters just subtract a certain amount from the base date */
  function simpleSubtract(unit, amt) {
    return function(dt) { return { from: dt.subtract(unit, amt) } }
  }

  dashboardControllers.controller('CreatedAtFilter', ['$scope', function($scope) {
    /* cb's return an obj containing from and to. Times relative to the base date */
    $scope.cannedFilters = [{
      name: "Last 24hrs", cb: simpleSubtract('days', 1)
    }]
  }]);

});
