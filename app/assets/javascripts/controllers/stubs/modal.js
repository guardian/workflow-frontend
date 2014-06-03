define([
    'angular',
    'sugar',
    'moment',
    'controllers/stubs'
], function (
    angular,
    sugar,
    moment,
    stubsControllers
) {
    'use strict';

    var StubModalInstanceCtrl = function ($scope, $modalInstance, stub) {
        $scope.stubForm = stub;

        $scope.ok = function (addToComposer) {
            $modalInstance.close({
                addToComposer: addToComposer,
                form: $scope.stubForm
            });
        };
        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };
    };

    stubsControllers.controller('StubModalInstanceCtrl', ['$scope','$modalInstance','stub', 'addToComposer', StubModalInstanceCtrl]);

    stubsControllers.controller('StubModalCtrl', ['$scope',
                                                  '$modal',
                                                  '$http',
                                                  '$q',
                                                  'config',
                                                  function($scope, $modal, $http, $q, config){

        var composerNewContent = config['composerNewContent'];

        $scope.$on('editStub', function(event, stub) {
            open(stub);
        });

        $scope.$on('newStub', function(event, contentType) {
            var stub = {
                contentType: contentType || 'article',
                section: 'Technology'
            };
            open(stub);
        });

        function open(stub, addToComposer) {

            var modalInstance = $modal.open({
                templateUrl: 'stubModalContent.html',
                controller: StubModalInstanceCtrl,
                resolve: {
                    stub: function () {
                        return stub;
                    },
                    addToComposer: function() {
                        return addToComposer;
                    }
                }
            });

            modalInstance.result.then(function (modalCloseResult) {
                var stub = modalCloseResult.form;
                var newStub = angular.copy(stub);
                var addToComposer = modalCloseResult.addToComposer;
                newStub.due = stub.due && Date.create(stub.due).toISOString();
                function callComposer(addToComposer) {
                    var deferred = $q.defer();
                    var type = stub.contentType;
                    if(addToComposer) {
                        $http({
                            method: 'POST',
                            url: composerNewContent,
                            params: {'type': type},
                            withCredentials: true
                        }).then(function(response){
                            var composerId = response.data.data.id;
                            deferred.resolve(composerId);
                        },function(response){
                            deferred.reject(response);
                        });
                    }
                    else {
                        deferred.resolve(null);
                    }
                    return deferred.promise;
                }

                callComposer(addToComposer).then(function(composerId) {
                    newStub.composerId = composerId;
                    var response;
                    if (newStub.id === undefined) {
                        response = $http({
                            method: 'POST',
                            url: '/api/stubs',
                            params: newStub,
                            headers: {'Content-Type': 'application/x-www-form-urlencoded'}
                        });
                    }
                    else {
                        response = $http({
                            method: 'PUT',
                            url: '/api/stubs/' + stub.id,
                            params: newStub,
                            headers: {'Content-Type': 'application/x-www-form-urlencoded'}
                        });
                    }
                    response.success(function(){
                        $scope.$emit('getStubs');
                    });
                });
            });
        };
    }]);

    return stubsControllers;
});
