
import angular from 'angular';

import 'angular-bootstrap';

import 'components/date-time-picker/date-time-picker';

import 'lib/content-service';
import 'lib/legal-states-service';
import 'lib/prodoffice-service';


var wfStubModal = angular.module('wfStubModal', ['ui.bootstrap', 'legalStatesService', 'wfContentService', 'wfDateTimePicker', 'wfProdOfficeService']);

function StubModalInstanceCtrl($scope, $modalInstance, stub, sections, legalStatesService, wfProdOfficeService) {

    $scope.stub = stub;

    $scope.disabled = !!stub.composerId;

    $scope.sections = sections;
    $scope.legalStates = legalStatesService.getLegalStates();
    $scope.prodOffices = wfProdOfficeService.getProdOffices();

    $scope.ok = function (addToComposer) {
        $modalInstance.close({
            addToComposer: addToComposer,
            stub: $scope.stub
        });
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };

}

wfStubModal.controller('StubModalInstanceCtrl', ['$scope',
    '$modalInstance',
    'stub',
    'sections',
    'legalStatesService',
    StubModalInstanceCtrl]);

wfStubModal.run(['$rootScope',
    '$modal',
    '$log',
    'wfContentService',
    'wfProdOfficeService',
    function ($rootScope, $modal, $log, wfContentService, wfProdOfficeService) {
        var $scope = $rootScope;

        $scope.$on('stub:edit', function (event, stub) {
            open(stub);
        });

        $scope.$on('stub:create', function (event, contentType) {
            var stub = {
                contentType: contentType || 'article',
                section: $scope.selectedSection || 'Technology',
                priority: 0,
                needsLegal: 'NA',
                prodOffice: wfProdOfficeService.getDefaultOffice()
            };
            open(stub);
        });

        function open(stub, addToComposer) {

            var modalInstance = $modal.open({
                templateUrl: '/assets/components/stub-modal/stub-modal.html',
                controller: StubModalInstanceCtrl,
                windowClass: 'stubModal',
                resolve: {
                    stub: function () {
                        return stub;
                    }
                }
            });

            modalInstance.result.then(function (modalCloseResult) {
                var stub = modalCloseResult.stub;
                var newStub = angular.copy(stub);
                var addToComposer = modalCloseResult.addToComposer;
                var isEdit = !!stub.id;


                var promise;
                if (addToComposer) {
                    promise = wfContentService.createInComposer(newStub);

                } else if (newStub.id) {
                    promise = wfContentService.updateStub(newStub);

                } else {
                    promise = wfContentService.createStub(newStub);
                }

                promise.then(() => {
                    $rootScope.$broadcast('getContent');

                    var eventName = isEdit ? 'stub.edited' : 'stub.created';
                    $rootScope.$broadcast(eventName, { 'content': newStub });

                }, (err) => {
                    $log.error((isEdit ? 'Edit' : 'Create') + ' stub failed: ' + err);
                });

            });

        }
    }]);

// composer import control
// stub create and edit

var ComposerImportModalInstanceCtrl = function ($scope, $modalInstance, stub, sections, legalStatesService, wfComposerService, wfProdOfficeService) {

    $scope.stub = stub;

    $scope.formData = {};

    $scope.disabled = $scope.stub.composerId !== undefined;

    $scope.composerUrlChanged = function () {
        wfComposerService.getComposerContent($scope.formData.composerUrl).then(
            function (content) {
                if (content) {
                    $scope.stub.composerId = content.id;
                    $scope.stub.contentType = content.type;
                    $scope.stub.title = content.headline;
                } else {
                    $scope.stub.composerId = null;
                    $scope.stub.contentType = null;
                    $scope.stub.title = null;
                }
            }
        );
    };


    // Watch changes to dueText
    $scope.$watch('formData.dueText', function () {
        $scope.dueTextChanged();
    });


    $scope.onDatePicked = function (newDate, oldDate) {
        $scope.formData.dueText = moment(newDate).format("D MMM YYYY, HH:mm");
    };

    $scope.dueTextChanged = function () {
        if (!$scope.formData.dueText) { // set to none when empty
            $scope.stub.due = null;
            return;
        }

        var due;
        try {
            due = Date.create($scope.formData.dueText).toISOString();
            $scope.stub.due = due;
        }
        catch (e) {
            delete $scope.stub.due;
        }
    };

    $scope.sections = sections;
    $scope.legalStates = legalStatesService.getLegalStates();
    $scope.prodOffices = wfProdOfficeService.getProdOffices();

    $scope.ok = function () {
        $modalInstance.close({
            stub: $scope.stub
        });
    };
    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
};

wfStubModal.controller('ComposerImportModalInstanceCtrl', ['$scope',
    '$modalInstance',
    'stub',
    'sections',
    'legalStatesService',
    'wfComposerService',
    'wfProdOfficeService',
    ComposerImportModalInstanceCtrl]);

wfStubModal.run(['$rootScope',
    '$modal',
    '$http',
    '$q',
    'config',
    'wfProdOfficeService',
    function ($rootScope, $modal, $http, $q, config, wfProdOfficeService) {
        var $scope = $rootScope;
        $scope.$on('content:import', function (event) {
            var stub = {
                section: $scope.selectedSection || 'Technology',
                prodOffice: wfProdOfficeService.getDefaultOffice(),
                priority: 0,
                needsLegal: 'NA'
            };
            open(stub);
        });

        function open(stub) {
            var modalInstance = $modal.open({
                templateUrl: '/assets/components/stub-modal/stub-import-modal.html',
                controller: ComposerImportModalInstanceCtrl,
                windowClass: 'stubModal',
                resolve: {
                    stub: function () {
                        return stub;
                    }
                }
            });

            modalInstance.result.then(function (modalCloseResult) {
                var stub = modalCloseResult.stub;

                console.log('stub data:', stub);
                var newStub = angular.copy(stub);

                var response = $http({
                    method: 'POST',
                    url: '/api/stubs',
                    data: newStub
                }).success(function () {
                    $scope.$emit('content.imported', { 'content': newStub });

                    $scope.$emit('getContent');
                });
            });
        }
    }]);

    // add to composer modal

    // var ComposerModalInstanceCtrl = function ($scope, $modalInstance, stub) {

    //     $scope.contentType = {type: stub.contentType || "article"};

    //     $scope.ok = function () {
    //         $modalInstance.close($scope.contentType.type);
    //     };
    //     $scope.cancel = function () {
    //         $modalInstance.dismiss('cancel');
    //     };
    // };

    // dashboardControllers.controller('ComposerModalInstanceCtrl', ['$scope', '$modalInstance', 'stub', ComposerModalInstanceCtrl]);

    // dashboardControllers.controller('ComposerModalCtrl', ['$scope',
    //     '$modal',
    //     '$http',
    //     'config', function ($scope, $modal, $http, config) {


    //         $scope.$on('addToComposer', function (event, stub) {
    //             open(stub);
    //         });

    //         function open(stub) {
    //             var modalInstance = $modal.open({
    //                 templateUrl: 'composerModalContent.html',
    //                 controller: ComposerModalInstanceCtrl,
    //                 resolve: {
    //                     stub: function () {
    //                         return stub;
    //                     }
    //                 }
    //             });

    //             var composerNewContent = config['composerNewContent'];

    //             modalInstance.result.then(function (type) {
    //                 $http({
    //                     method: 'POST',
    //                     url: composerNewContent,
    //                     params: {'type': type},
    //                     withCredentials: true
    //                 }).success(function (data) {
    //                     var composerId = data.data.id;
    //                     $http({
    //                         method: 'POST',
    //                         url: '/api/stubs/' + stub.id,
    //                         params: {'composerId': composerId, 'contentType': type}
    //                     }).success(function () {
    //                         $scope.$emit('content.statusChanged', {
    //                             content: stub,
    //                             status: 'Writers',
    //                             oldStatus: 'Stub'
    //                         });

    //                         $scope.$emit('getContent');
    //                     });
    //                 });
    //             });
    //         };
    //     }]);
