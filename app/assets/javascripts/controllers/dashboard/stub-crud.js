define([
    'angular',
    'controllers/dashboard'
], function (
    angular,
    dashboardControllers
    ) {
    'use strict';

    dashboardControllers.controller('NewStubDropdownCtrl', ['$scope', function ($scope) {
        $scope.newStub = function (contentType) {
            $scope.$emit('newStubButtonClicked', contentType);
        };
    }]);

    var StubModalInstanceCtrl = function ($scope, $modalInstance, stub, sectionsService) {
        $scope.stubForm = stub;

        $scope.disabled = stub.composerId !== undefined;

        sectionsService.getSections().then(function (sections) {
            $scope.sections = sections.map(function(s) {return s.name;});
        });

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

    dashboardControllers.controller('StubModalInstanceCtrl', ['$scope',
        '$modalInstance',
        'stub',
        'sectionsService',
        StubModalInstanceCtrl]);

    dashboardControllers.controller('StubModalCtrl', ['$scope',
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



    return dashboardControllers;
});