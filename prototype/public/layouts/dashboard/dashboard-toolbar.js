
import angular from 'angular';

import 'lib/date-service';
import 'lib/filters-service';

angular.module('wfDashboardToolbar', ['wfFiltersService', 'wfDateService'])
  .controller('wfDashboardToolbarController', ['$scope', 'wfFiltersService', 'wfDateParser', 'prodOfficeService', 'sections', function($scope, wfFiltersService, wfDateParser, prodOfficeService, sections) {

    $scope.selectedProdOffice = wfFiltersService.get('prodOffice');

    $scope.prodOffices = prodOfficeService.getProdOffices();


    $scope.selectedSection = wfFiltersService.get('section');
    $scope.sections = sections;

    $scope.$watch('selectedProdOffice', function(){
      $scope.$emit('filtersChanged.prodOffice', $scope.selectedProdOffice);
    });

    $scope.$watch('selectedSection', function(){
      $scope.$emit('filtersChanged.section', $scope.selectedSection);
    });


    $scope.dateOptions = wfDateParser.getDaysThisWeek();
    var selectedDate = wfFiltersService.get('selectedDate');

    // ensure that the date from the URL is the same object as the
    // one used in the Select drop-down, as its compared with ===
    $scope.dateOptions.forEach(function(date) {
      if (date.isSame(selectedDate)) {
        selectedDate = date;
      }
    });

    $scope.selectedDate = selectedDate;

    $scope.deadlineSelectActive = function() {
      return $scope.selectedDate && typeof($scope.selectedDate) != 'string';
    };

    $scope.$watch('selectedDate', function() {
      $scope.$emit('filtersChanged.selectedDate', $scope.selectedDate);
    });

  }])

  .directive('wfToolbarOption', [function() {
    return {
      restrict: 'A',
      require: '^ngModel',
      scope: {
        ngModel: '=',
        optionName: '@wfToolbarOption',
        value: '@wfToolbarOptionValue'
      },

      link: function(scope, elem, attrs, ngModel) {

        var className = 'dashboard-toolbar__' + scope.optionName + '-option',
            activeClass = className + '--active',

            value = scope.value || undefined;

        ngModel.$render = function() {
          var newValue = ngModel.$modelValue;

          if (newValue == value) {
            elem.addClass(activeClass);
            elem.removeClass(className);
          } else {
            elem.addClass(className);
            elem.removeClass(activeClass);
          }
        };

        elem.on('click', function(event) {
          ngModel.$setViewValue(value);

          ngModel.$render();
          scope.$apply();
        });
      }
    };
  }]);
