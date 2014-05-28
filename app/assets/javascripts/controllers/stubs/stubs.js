define([
    'angular',
    'controllers/stubs'
], function (
    angular,
    stubsControllers
) {
    'use strict';

    stubsControllers.controller('StubsCtrl', ['$scope','$http', function($scope, $http) {
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
        $scope.addToComposer = function(stub, composerUrl) {
            $scope.$broadcast('addToComposer', stub, composerUrl)
        }
    }]);

    return stubsControllers;
});
