import angular from 'angular';

import 'lib/content-service';
import { registerSubscription } from '../../lib/notifications';

import './dashboard-create.html';

angular
    .module('wfDashboardCreate', ['wfContentService'])
    .controller('wfDashboardCreateController', ['$scope', 'wfContentService', function ($scope, contentService) {
        contentService.getTypes().then( (types) => {
            $scope.options = types;
        });

        $scope.createContent = function(contentType) {
            $scope.$emit('stub:create', contentType);
        };
        $scope.importContent = function() {
            $scope.$emit('content:import');
        };

        $scope.registerSubscription = () => {
            // TODO MRB: show spinner and success or similar
            registerSubscription();
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
