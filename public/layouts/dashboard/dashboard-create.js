import angular from 'angular';

import 'lib/content-service';

angular
    .module('wfDashboardCreate', ['wfContentService'])
    .controller('wfDashboardCreateController', ['$scope', 'wfContentService', function ($scope, contentService) {
        $scope.options = contentService.getTypes(); 

        $scope.createContent = function(contentType) {
            $scope.$emit('stub:create', contentType);
        }
        $scope.importContent = function() {
            $scope.$emit('content:import');
        }
    }])
