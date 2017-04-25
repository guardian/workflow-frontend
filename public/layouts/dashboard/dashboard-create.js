import angular from 'angular';

import '../../lib/content-service';

import './dashboard-create.html';

angular
    .module('wfDashboardCreate', ['wfContentService'])
    .controller('wfDashboardCreateController', ['$scope', 'wfContentService', function ($scope, contentService) {
        $scope.options = contentService.getTypes();

        $scope.createContent = function(contentType) {
            $scope.$emit('stub:create', contentType);
        };
        $scope.importContent = function() {
            $scope.$emit('content:import');
        };
    }])
    .directive('wfDropdownToggle', ['$document', function($document){
        return {
            restrict: 'A',
            link: function(scope, element) {
                scope.toggleDropdown = function() { scope.showDropdown = !scope.showDropdown }
                element.bind('click', function(event) { event.stopPropagation(); });
                $document.bind('click', function(){ scope.showDropdown = false; scope.$apply();});
            }
        };
    }]);
