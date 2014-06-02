define([
    'angular',
    'controllers/stubs'
], function (
    angular,
    stubsControllers
) {
    'use strict';

    stubsControllers.controller('StubsCtrl',
        ['$scope', '$http', 'filterParams', function($scope, $http, filterParams) {

        var getStubs = function () {
            var params = filterParams.get();
            var uri = '/api/stubs';
            $http.get(uri, {params: params}).success(function (response) {
                $scope.stubItems = response.data;
            });
        }
        $scope.$on('changedFilters', getStubs);
        $scope.$on('getStubs', getStubs);

        $scope.editStub = function (stub) {
            $scope.$broadcast('editStub', angular.copy(stub));
        };

        $scope.addToComposer = function(stub, composerUrl) {
            $scope.$broadcast('addToComposer', stub, composerUrl)
        };

        $scope.deleteStub = function(stub) {
            if (window.confirm("Are you sure? \"" + stub.title + "\" looks like a nice stub to me.")) {
                $http({
                   method: 'DELETE',
                   url: '/api/stubs/' + stub.id
                }).success(function(){
                    $scope.$emit('getStubs');
                });
            }
        };

    }]);

    return stubsControllers;
});
