
import angular from 'angular';

import 'angular-bootstrap';

import 'components/date-time-picker/date-time-picker';

import 'lib/composer-service';
import 'lib/content-service';
import 'lib/legal-states-service';
import 'lib/filters-service';
import 'lib/prodoffice-service';


var wfStubModal = angular.module('wfStubModal', ['ui.bootstrap', 'legalStatesService', 'wfComposerService', 'wfContentService', 'wfDateTimePicker', 'wfProdOfficeService']);

function StubModalInstanceCtrl($scope, $modalInstance, stub, mode, sections, legalStatesService, wfComposerService, wfProdOfficeService, wfContentService) {

    $scope.mode = mode;
    $scope.modalTitle = ({
        'create': 'Create News item',
        'edit': 'Edit News item',
        'import': 'Import from Composer'
    })[mode];

    $scope.formData = {};
    $scope.stub = stub;

    $scope.disabled = !!stub.composerId;

    $scope.sections = sections;
    $scope.legalStates = legalStatesService.getLegalStates();
    $scope.prodOffices = wfProdOfficeService.getProdOffices();


    $scope.composerUrlChanged = () => {
        wfComposerService.getComposerContent($scope.formData.composerUrl).then(
            (composerContent) => {
                if (composerContent) {
                    $scope.stub.composerId = composerContent.id;
                    $scope.stub.contentType = composerContent.type;
                    $scope.stub.title = composerContent.headline;
                    $scope.stub.activeInInCopy = composerContent.activeInInCopy;
                } else {
                    $scope.stub.composerId = null;
                    $scope.stub.contentType = null;
                    $scope.stub.title = null;
                }
            }
        );
    };

    $scope.ok = function (addToComposer) {
        $modalInstance.close({
            addToComposer: addToComposer,
            stub: $scope.stub
        });
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };

    $scope.delete = function () {
        wfContentService.remove($scope.stub.id)
            .then(() => {
                $scope.$emit('content.deleted', { contentItem: $scope.stub });
                $scope.$apply();
                $modalInstance.dismiss('cancel');
            }, function () {
                if (console && console.error) { // placeholder for sentry
                    console.error(arguments);
                }
            });
    }

}

wfStubModal.run(['$rootScope',
    '$modal',
    '$log',
    'wfContentService',
    'wfFiltersService',
    'wfProdOfficeService',
    function ($rootScope, $modal, $log, wfContentService, wfFiltersService, wfProdOfficeService) {

        function currentFilteredSection() {
            return wfFiltersService.get('section');
        }

        $rootScope.$on('stub:edit', function (event, stub) {
            open(stub, 'edit');
        });

        $rootScope.$on('stub:create', function (event) {
            var stub = {
                contentType: 'article',
                section: currentFilteredSection() || 'Technology',
                priority: 0,
                needsLegal: 'NA',
                prodOffice: wfProdOfficeService.getDefaultOffice()
            };
            open(stub, 'create');
        });

        $rootScope.$on('content:import', function (event) {
            var stub = {
                section: currentFilteredSection() || 'Technology',
                priority: 0,
                needsLegal: 'NA',
                prodOffice: wfProdOfficeService.getDefaultOffice()
            };
            open(stub, 'import');
        });

        function open(stub, mode) {

            var modalInstance = $modal.open({
                templateUrl: '/assets/components/stub-modal/stub-modal.html',
                controller: StubModalInstanceCtrl,
                windowClass: 'stubModal',
                resolve: {
                    stub: () => stub,
                    mode: () => mode
                }
            });

            modalInstance.result.then(function (modalCloseResult) {
                var stub = modalCloseResult.stub;
                var addToComposer = modalCloseResult.addToComposer;

                var promise;
                if (addToComposer) {
                    promise = wfContentService.createInComposer(stub);

                } else if (stub.id) {
                    promise = wfContentService.updateStub(stub);

                } else {
                    promise = wfContentService.createStub(stub,
                                                          stub.activeInInCopy);
                }

                promise.then(() => {

                    // Map modal mode to event name
                    var eventName = ({
                        'create': 'stub.created',
                        'edit': 'stub.edited',
                        'import': 'content.imported'
                    }[mode]);

                    $rootScope.$broadcast(eventName, { 'contentItem': stub });

                    $rootScope.$broadcast('getContent');

                }, (err) => {
                    $log.error('Stub ' + mode + ' failed: ' + (err.message || JSON.stringify(err)));
                });

            });

        }
    }]);
