import angular from 'angular';

import 'angular-bootstrap';

import 'components/date-time-picker/date-time-picker';

import 'lib/composer-service';
import 'lib/content-service';
import 'lib/legal-states-service';
import 'lib/filters-service';
import 'lib/prodoffice-service';
import { punters } from 'components/punters/punters';


var wfStubModal = angular.module('wfStubModal', ['ui.bootstrap', 'legalStatesService', 'wfComposerService', 'wfContentService', 'wfDateTimePicker', 'wfProdOfficeService', 'wfFiltersService'])
    .directive('punters', ['$rootScope', 'wfGoogleApiService', punters]);

function StubModalInstanceCtrl($rootScope,$scope, $modalInstance, $window, config, stub, mode, sections, statusLabels, legalStatesService, wfComposerService, wfProdOfficeService, wfContentService, wfPreferencesService, wfFiltersService, sectionsInDesks) {
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
    $scope.statuses = statusLabels;
    $scope.cdesks = _wfConfig.commissioningDesks

    if(mode==='import') {
       $scope.statuses = statusLabels.filter(function(s) { return s.value!=='Stub'});
    }

    $scope.stub = stub;

    if ($scope.stub.section !== null) {
        /**
         * To ensure that a modal loaded without a preference for section does not validate,
         * only set the section if a preference was found
         */
        $scope.stub.section = (function findSelectedSectionInAvailableSections (sect) {
            var filteredSections = $scope.sections.filter((el) => el.name === sect.name);
            if (filteredSections.length > 0) {
                return filteredSections[0];
            }
            return sect;
        })($scope.stub.section);
    }

    $scope.stub.status = 'Writers';

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
    }

    $scope.legalStates = legalStatesService.getLegalStates();
    $scope.prodOffices = wfProdOfficeService.getProdOffices();

    $scope.$watch('stub.section', (newValue, oldValue) => {

        if (newValue) {
            wfPreferencesService.getPreference('preferedStub').then((data) => {
                data.section = newValue.name;
                wfPreferencesService.setPreference('preferedStub', data);
            }, () => {
                wfPreferencesService.setPreference('preferedStub', {
                    section: newValue.name
                });
            })
        }

    }, true);

    $scope.validImport = false;
    $scope.wfComposerState;

    $scope.composerUrlChanged = () => {
        wfComposerService.getComposerContent($scope.formData.composerUrl).then(
            (composerContent) => {
                //check validity
                if (composerContent) {

                    var contentItem = wfComposerService.parseComposerData(composerContent.data, $scope.stub);
                    var composerId = contentItem.composerId;

                    if(composerId) {
                        $scope.composerUrl = config.composerViewContent + '/' + composerId;
                        $scope.stub.title = contentItem.headline;
                        // slice needed because the australian prodOffice is 'AUS' in composer and 'AU' in workflow
                        $scope.stub.prodOffice  = contentItem.composerProdOffice ? contentItem.composerProdOffice.slice(0,2) : 'UK';

                        wfContentService.getById(composerId).then(
                            function(res){
                                if(res.data.data.visibleOnUi) {
                                    $scope.wfComposerState = 'visible';
                                    $scope.stubId = res.data.data.id;
                                }
                                else {
                                    $scope.wfComposerState = 'invisible'
                                }
                            },
                            function(err) {
                                if(err.status === 404) {
                                    $scope.validImport = true;
                                    if(err.data.archive) { $scope.wfComposerState = 'archived'; }
                                }
                            });
                    }
                } else {
                    $scope.stub.title = null;
                    $scope.stub.composerId = null;
                    $scope.stub.contentType = null;
                }
            }
        );
    };

    $scope.ok = function (addToComposer) {
        var stub = $scope.stub;
        var promise;

        if (!addToComposer && !($scope.mode === "import")) {
            delete stub.status;
        }

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

            if(err.status === 409) {
                $scope.errorMsg = 'This item is already linked to a composer item.';
                if(err.data.composerId) {
                    $scope.composerUrl = config.composerViewContent + '/' + err.data.composerId;
                }
                if(err.data.stubId) {
                    $scope.stubId = err.data.stubId;
                }
            }
            else {
                $scope.errorMsg = err.friendlyMessage || err.message || err;
                $scope.actionSuccess = false;
            }

            $rootScope.$apply(() => { throw new Error('Stub ' + mode + ' failed: ' + (err.message || err)); });

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
    'wfLocationService',
    'sections',
    'config',
    function ($window, $rootScope, $modal, $log, wfContentService, wfFiltersService, wfProdOfficeService, wfPreferencesService, wfLocationService, sections, config) {

        function currentFilteredOffice() {
            return wfFiltersService.get('prodOffice');
        }

        function guessCurrentOfficeFromTimezone() {
            return wfProdOfficeService.timezoneToOffice(wfLocationService.getCurrentLocation().id);
        }

        /**
         * Return a promise for stub data based off the users stored preferences.
         * Currently only modifies section for content creation
         *
         * @param contentType
         * @returns {Promise}
         */
        function setUpPreferedStub (contentType) {

            function createStubData (contentType, sectionName) {

                return {
                    contentType: contentType,
                    // Only send through a section if one is found in the prefs
                    section: sectionName === null ? sectionName : sections.filter((section) => section.name === sectionName)[0],
                    priority: 0,
                    needsLegal: 'NA',
                    prodOffice: currentFilteredOffice() ||  guessCurrentOfficeFromTimezone()
                };
            }

            return wfPreferencesService.getPreference('preferedStub').then((data) => {

                return createStubData(contentType, data.section);
            }, () => {

                return createStubData(contentType, null);
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
    }]).directive('wfFocus', ['$timeout', function($timeout){
      return {
          restrict: "A",
          link: function (scope, element, attrs, ctrls) {
              if(attrs.focusMe === "true" || attrs.focusMe === undefined) {
                $timeout(function() { element[0].focus(); }, 500);
              }
          }
      };
    }]);
