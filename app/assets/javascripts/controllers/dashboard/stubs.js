define([
    'angular',
    'controllers/dashboard'
], function (
    angular,
    dashboardControllers
    ) {
    'use strict';
    dashboardControllers.controller('StubsCtrl', ['$scope','$http', function($scope, $http) {
        function getStubs() {
            var uri = '/stubsJson';
            $http.get(uri).success(function(response) {
                $scope.stubItems = response.data;
            });
        }
        getStubs();
        $scope.$on('getStubs', function(){
            getStubs();
        });
    }]);

    return dashboardControllers;
});