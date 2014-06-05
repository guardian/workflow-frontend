define([
    'angular',
    'controllers/dashboard'
], function (
    angular,
    dashboardControllers
    ) {
    'use strict';

    dashboardControllers.controller('ContentItemCtrl', ['$scope', '$http', function($scope, $http){
        var content = $scope.content;
        $scope.$watch('content.status', function(newValue, oldValue) {
            if (newValue !== oldValue) {
                $http({
                    method: 'PUT',
                    url: '/api/content/' + content.composerId,
                    data: content
                });
            }
        });

    }]);

    return dashboardControllers;

});
