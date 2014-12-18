
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


    var contentName = wfContentService.getTypes()[stub.contentType] || "News item";

    $scope.mode = mode;
    $scope.modalTitle = ({
        'create': `Create ${contentName}`,
        'edit': `Edit ${contentName}`, 
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
                    var stub = wfComposerService.parseComposerData(composerContent.data, $scope.stub);

                    // preset working title
                    stub.title = stub.headline;


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
            }, function (err) {
                $scope.$apply(() => { throw err; });
            });
    };

}

wfStubModal.run(['$rootScope',
    '$modal',
    '$log',
    'wfContentService',
    'wfFiltersService',
    'wfProdOfficeService',
    'sections',
    function ($rootScope, $modal, $log, wfContentService, wfFiltersService, wfProdOfficeService, sections) {

        function currentFilteredSection() {
            return wfFiltersService.get('section');
        }

        function currentFilteredOffice() {
            return wfFiltersService.get('prodOffice');
        }

        function getSectionFromSections(sectionName) {
            return sections.filter((section) => section.name === sectionName)[0];
        }

        var lastUsedSection = 'Technology'; // tech by default

        function defaultStub(contentType) {
            function defaultSection() {
                var filteredSection = currentFilteredSection(),
                    splitSections;

                if (!filteredSection) {
                    return lastUsedSection;
                }

                splitSections = filteredSection.split(',');

                if (splitSections.indexOf(lastUsedSection) !== -1) {
                    return lastUsedSection;
                }

                return splitSections[0] || lastUsedSection;
            }

            return {
                contentType: contentType,
                section: getSectionFromSections(defaultSection()),
                priority: 0,
                needsLegal: 'NA',
                prodOffice: currentFilteredOffice() ||  'UK' 
            };
        }

        $rootScope.$on('stub:edit', function (event, stub) {
            open(stub, 'edit');
        });

        $rootScope.$on('stub:create', function (event, contentType) {
            open(defaultStub(contentType), 'create');
        });

        $rootScope.$on('content:import', function (event) {
            open(defaultStub(), 'import');
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

                stub.status = 'Writers'; // TODO: allow status to be selected

                var promise;
                if (addToComposer) {
                    promise = wfContentService.createInComposer(stub);

                } else if (stub.id) {
                    promise = wfContentService.updateStub(stub);

                } else {
                    promise = wfContentService.createStub(stub);
                }

                if (stub.section) {
                    lastUsedSection = stub.section.name;
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
                    $rootScope.$apply(() => { throw new Error('Stub ' + mode + ' failed: ' + (err.message || err)); });
                });

            });

        }
    }]);
