
import angular from 'angular';

import 'angular-bootstrap';

import 'components/date-time-picker/date-time-picker';

import 'lib/composer-service';
import 'lib/content-service';
import 'lib/legal-states-service';
import 'lib/filters-service';
import 'lib/prodoffice-service';
import { punters } from 'components/punters/punters';


var wfStubModal = angular.module('wfStubModal', ['ui.bootstrap', 'legalStatesService', 'wfComposerService', 'wfContentService', 'wfDateTimePicker', 'wfProdOfficeService'])
    .directive('punters', ['$rootScope', 'wfGoogleApiService', punters]);

function StubModalInstanceCtrl($scope, $modalInstance, $window, config, stub, mode, sections, legalStatesService, wfComposerService, wfProdOfficeService, wfContentService, wfPreferencesService) {
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

    $scope.$watch('stub.section', (newValue, oldValue) => {

        wfPreferencesService.getPreference('preferedStub').then((data) => {
            data.section = newValue.name;
            wfPreferencesService.setPreference('preferedStub', data);
        }, () => {
            wfPreferencesService.setPreference('preferedStub', {
                section: newValue.name
            });
        })
    }, true);

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

wfStubModal.run([
    '$window',
    '$rootScope',
    '$modal',
    '$log',
    'wfContentService',
    'wfFiltersService',
    'wfProdOfficeService',
    'wfPreferencesService',
    'sections',
    'config',
    function ($window, $rootScope, $modal, $log, wfContentService, wfFiltersService, wfProdOfficeService, wfPreferencesService, sections, config) {

        function currentFilteredOffice() {
            return wfFiltersService.get('prodOffice');
        }

        function getSectionFromSections(sectionName) {
            return sections.filter((section) => section.name === sectionName)[0];
        }

        /**
         * Return a promise for stub data based off the users stored preferences.
         * Currently only modifies section for content creation
         *
         * @param contentType
         * @returns {Promise}
         */
        function setUpPreferedStub (contentType) {

            var defaultSection = 'Technology'; // tech by default

            function createStubData (contentType, section) {

                return {
                    contentType: contentType,
                    section: getSectionFromSections(section),
                    priority: 0,
                    needsLegal: 'NA',
                    prodOffice: currentFilteredOffice() ||  'UK'
                };
            }

            return wfPreferencesService.getPreference('preferedStub').then((data) => {

                return createStubData(contentType, data.section || defaultSection);
            }, () => {

                return createStubData(contentType, defaultSection);
            });
        }


        $rootScope.$on('stub:edit', function (event, stub) {
            open(stub, 'edit');
        });

        $rootScope.$on('stub:create', function (event, contentType) {

            setUpPreferedStub(contentType).then((stub) => {

                open(stub, 'create')
            });
        });

        $rootScope.$on('stub.created', (event, msg) => {
            if(msg.contentItem.composerId) {
                var composerUrl = config.composerViewContent + '/' + msg.contentItem.composerId;
                $window.open(composerUrl);
            }
        });

        $rootScope.$on('content:import', function (event) {

            setUpPreferedStub(null).then((stub) => {

                open(stub, 'import')
            });
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
