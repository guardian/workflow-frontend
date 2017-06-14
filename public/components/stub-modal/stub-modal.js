import angular from 'angular';

import 'angular-bootstrap-temporary';

import _ from 'lodash';

import 'components/date-time-picker/date-time-picker';

import 'lib/composer-service';
import 'lib/content-service';
import 'lib/legal-states-service';
import 'lib/filters-service';
import 'lib/prodoffice-service';
import { punters } from 'components/punters/punters';

const wfStubModal = angular.module('wfStubModal', ['ui.bootstrap', 'legalStatesService', 'wfComposerService', 'wfContentService', 'wfDateTimePicker', 'wfProdOfficeService', 'wfFiltersService', 'wfCapiAtomService'])
    .directive('punters', ['$rootScope', 'wfGoogleApiService', punters]);

function StubModalInstanceCtrl($rootScope, $scope, $modalInstance, $window, config, stub, mode, sections, statusLabels, legalStatesService, wfComposerService, wfProdOfficeService, wfContentService, wfPreferencesService, wfFiltersService, sectionsInDesks, wfCapiAtomService) {

    wfContentService.getTypes().then( (types) => {
        $scope.contentName =
            (wfContentService.getAtomTypes())[stub.contentType] ?
            "Atom" : (types[stub.contentType] || "News item");

        $scope.modalTitle = ({
            'create': `Create ${$scope.contentName}`,
            'edit': `Edit ${$scope.contentName}`,
            'import': 'Import Existing Content'
        })[mode];
    });

    $scope.mode = mode;

    $scope.formData = {};
    $scope.disabled = !!stub.composerId;
    $scope.sections = getSectionsList(sections);
    $scope.statuses = statusLabels;
    $scope.cdesks = _wfConfig.commissioningDesks;
    $scope.atomTypes = ['Media'];

    if(mode==='import') {
       $scope.statuses = statusLabels.filter(function(s) { return s.value!=='Stub'});
    }

    $scope.stub = stub;

    if ($scope.stub.section) {
        /**
         * To ensure that a modal loaded without a preference for section does not validate,
         * only set the section if a preference was found
         */
        $scope.stub.section = (function findSelectedSectionInAvailableSections (sect) {
            const filteredSections = $scope.sections ? $scope.sections.filter((el) => (el ? el.name === sect.name : false)) : [];
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
        const deskId = wfFiltersService.get('desk');

        if (deskId) {
            const sectionsIdsInThisDesk = sectionsInDesks.filter((el) => el.deskId === parseInt(deskId, 10));
            if (sectionsIdsInThisDesk.length > 0) {
                const setSectionsIdsInThisDesk = new Set(sectionsIdsInThisDesk[0].sectionIds);
                sections = sections.filter((el) => setSectionsIdsInThisDesk.has(el.id))
            }
        }
        return sections;
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

    function importComposerContent(url) {
        wfComposerService.getComposerContent($scope.formData.importUrl).then(
            (composerContent) => {
                //check validity
                if (composerContent) {

                    const contentItem = wfComposerService.parseComposerData(composerContent.data, $scope.stub);
                    const composerId = contentItem.composerId;

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
    }

    function importContentAtom(id, atomType) {
        wfCapiAtomService.getCapiAtom(id, atomType).then((response) => {
            if(response) {
                const atom = wfCapiAtomService.parseCapiAtomData(response, atomType);
                $scope.stub.title = atom.title;
                wfContentService.getByEditorId(id).then(
                    (content) => console.log("[PMR 1522] ", content)
                )
            }
        });
    }

    const importUrlHandlers = [
        { name: "Media Atom Maker",
          regex: "videos/([0-9a-f-]+)$",
          fn: (url, matches) => importContentAtom(matches[1], "media")
        },
        { name: "Composer",
          regex: "^.*$",
          fn: importComposerContent
        }
    ];

    $scope.importUrlChanged = () => {
        const url = $scope.formData.importUrl;
        const handler = _.find(importUrlHandlers, (handlerObj) => {
            return url.search(handlerObj.regex) !== -1;
        });

        if(handler) {
            $scope.importHandler = handler;
            $scope.importHandler.fn(url, url.match(handler.regex));
        } else {
            console.log("[PMR 1219] no handler found");
        }
    };

    $scope.ok = function (addToComposer, addToAtomEditor) {
        const stub = $scope.stub;
        function createItemPromise() {
            stub['status'] = stub.status === undefined ? 'Stub' : stub.status;
            if ($scope.contentName === 'Atom') {
                stub['contentType'] = $scope.stub.contentType.toLowerCase();
                if (addToAtomEditor) {
                    return wfContentService.createInMediaAtomMaker(stub);
                } else if (stub.id) {
                    return wfContentService.updateStub(stub);
                } else {
                    return wfContentService.createStub(stub);
                }
            } else {
                if (addToComposer) {
                    return wfContentService.createInComposer(stub);
                } else if (stub.id) {
                    return wfContentService.updateStub(stub);
                } else {
                    return wfContentService.createStub(stub);
                }
            }
        }

        $scope.actionInProgress = true;

        createItemPromise().then((response) => {
            const eventName = ({
                'create': 'stub.created',
                'edit': 'stub.edited',
                'import': 'content.imported'
            }[$scope.mode]);

            $rootScope.$broadcast(eventName, { 'contentItem': stub });
            $rootScope.$broadcast('getContent');

            if ($scope.contentName === 'Atom') {
                if (stub.editorId && ($scope.mode != 'import')) {
                    $scope.editorUrl = wfContentService.getEditorUrl(stub.editorId)[stub.contentType];
                } else {
                    $modalInstance.close({
                        addToEditor: addToAtomEditor,
                        stub: $scope.stub
                    });
                }
            } else {
                if(stub.composerId && ($scope.mode != 'import')) {
                    $scope.composerUrl = config.composerViewContent + '/' + stub.composerId;
                } else {
                    $modalInstance.close({
                        addToComposer: addToComposer,
                        stub: $scope.stub
                    });
                }
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
                if(err.data.editorId) {
                    $scope.editorUrl = wfContentService.getEditorUrl(stub.editorId)[stub.contentType];
                }
                if(err.data.stubId) {
                    $scope.stubId = err.data.stubId;
                }
            } else {
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

        const defaultAtomType = "media"

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
                    contentType: contentType === "atom" ? defaultAtomType : contentType,
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
            const modalInstance = $modal.open({
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
