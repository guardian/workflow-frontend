import angular from 'angular';

import 'angular-bootstrap';

import 'components/date-time-picker/date-time-picker';

import 'lib/composer-service';
import 'lib/content-service';
import 'lib/legal-states-service';
import 'lib/filters-service';
import 'lib/prodoffice-service';


var wfStubModal = angular.module('wfStubModal', ['ui.bootstrap', 'legalStatesService', 'wfComposerService', 'wfContentService', 'wfDateTimePicker', 'wfProdOfficeService', 'wfFiltersService',]);

function StubModalInstanceCtrl($rootScope, $scope, $modalInstance, $window, config, stub, mode, sections, legalStatesService, wfComposerService, wfProdOfficeService, wfContentService, wfPreferencesService, wfFiltersService, sectionsInDesks) {
    var contentName = wfContentService.getTypes()[stub.contentType] || "News item";

    $scope.mode = mode;
    $scope.modalTitle = ({
        'create': `Create ${contentName}`,
        'edit': `Edit ${contentName}`,
        'import': 'Import from Composer'
    })[mode];

    $scope.formData = {};
    $scope.disabled = !!stub.composerId;
    $scope.sections = getSectionsList(sections);

    $scope.stub = stub;
    $scope.stub.section = (function findSelectedSectionInAvailableSections () {
        var sect = $scope.stub.section;
        var filteredSections = $scope.sections.filter((el) => el.name === sect.name);
        if (filteredSections.length === 0) {
            return $scope.sections[0];
        } else {
            return filteredSections[0];
        }
    })();

    /**
     * If the user currently has a desk selected then only
     * show the sections that are part of that desk in the dropdown
     * @param sections
     * @returns Filtered list of sections
     */
    function getSectionsList (sections) {
        var deskId = wfFiltersService.get('desk');

        if (deskId) {
            var sectionsIdsInThisDesk = sectionsInDesks.filter((el) => el.deskId === parseInt(deskId, 10));
            sections = sections.filter((el) => sectionsIdsInThisDesk[0].sectionIds.indexOf(el.id) != -1)
        }

        return sections
    };

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
        var stub = $scope.stub;
        var promise;

        stub.status = 'Writers';

        if (addToComposer) {
            promise = wfContentService.createInComposer(stub);
        } else if (stub.id) {
            promise = wfContentService.updateStub(stub);
        } else {
            promise = wfContentService.createStub(stub);
        }

        $scope.actionInProgress = true;

        promise.then((response) => {
            var eventName = ({
                'create': 'stub.created',
                'edit': 'stub.edited',
                'import': 'content.imported'
            }[$scope.mode]);

            $rootScope.$broadcast(eventName, { 'contentItem': stub });
            $rootScope.$broadcast('getContent');

            if(stub.composerId && ($scope.mode != 'import')) {
                $scope.composerUrl = config.composerViewContent + '/' + stub.composerId;
            } else {
                $modalInstance.close({
                    addToComposer: addToComposer,
                    stub: $scope.stub
                });
            }

            $scope.actionSuccess = true;
            $scope.actionInProgress = false;
        }, (err) => {
            $scope.actionSuccess = false;
            $scope.contentUpdateError = true;

            $scope.errorMsg = err.friendlyMessage || err.message || err;
            $rootScope.$apply(() => { throw new Error('Stub ' + mode + ' failed: ' + (err.message || err)); });

            $scope.actionSuccess = false;
            $scope.actionInProgress = false;
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
                    section: getSectionFromSections(section) || defaultSection,
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
        };
    }]);
