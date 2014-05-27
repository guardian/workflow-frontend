define([
    'angular',
    'controllers/content'
], function (
    angular,
    contentControllers
    ) {
    'use strict';
    contentControllers.controller('StubsCtrl', ['$scope','$http', function($scope, $http) {
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

    return contentControllers;
});