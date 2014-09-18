define(['../dashboard'], function (dashboardControllers) {

  'use strict';

  dashboardControllers.controller('Sidebar', ['$scope', function ($scope) {



    $scope.toggleSidebarSection = function ($event) {

        var sectionId = $event.target.getAttribute('data-target'),
            closedClass = 'sidebar__filter-list--closed';

        var section = document.querySelector(sectionId);

        if (section.classList.contains(closedClass)) {
          section.classList.remove(closedClass);
        } else {
          section.classList.add(closedClass);
        }

    }
  }]);

});
