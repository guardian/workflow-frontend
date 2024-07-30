import angular from 'angular';

import 'angular-bootstrap-temporary';

import _ from 'lodash';
import moment from 'moment';

import 'components/date-time-picker/date-time-picker';

import 'lib/composer-service';
import 'lib/content-service';
import 'lib/article-format-service';
import 'lib/legal-states-service';
import 'lib/picture-desk-states-service';
import 'lib/filters-service';
import 'lib/prodoffice-service';
import { punters } from 'components/punters/punters';

const wfStubModal = angular.module('wfStubModal', [
    'ui.bootstrap', 'articleFormatService', 'legalStatesService', 'pictureDeskStatesService', 'wfComposerService', 'wfContentService', 'wfDateTimePicker', 'wfProdOfficeService', 'wfFiltersService', 'wfCapiAtomService'])
    .directive('punters', ['$rootScope', punters]);

function StubModalInstanceCtrl($rootScope, $scope, $modalInstance, $window, config, stub, mode,
     sections, statusLabels, articleFormatService, legalStatesService, pictureDeskStatesService, wfComposerService, wfProdOfficeService, wfContentService,
     wfPreferencesService, wfFiltersService, sectionsInDesks, wfCapiAtomService) {

    wfContentService.getTypes().then( (types) => {
        $scope.contentName =
            (wfContentService.getAtomTypes())[stub.contentType] ?
            "Atom" : (types[stub.contentType] || "News item");
            
        $scope.stubFormat = ''
        if (stub.contentType === 'article') {
            $scope.stubFormat = "Standard Article"
        } else if (stub.contentType === 'keyTakeaways') {
            $scope.stubFormat = "Key Takeaways"
        } else if (stub.contentType === 'qAndA') {
            $scope.stubFormat = "Q&A Explainer"
        } else if (stub.contentType === 'timeline') {
            $scope.stubFormat = "Timeline"
        } else if (stub.contentType === 'miniProfiles') {
            $scope.stubFormat = "Mini profiles"
        } 
        $scope.$watch('stub.articleFormat', (newValue) => {
            $scope.stubFormat = newValue;
        })

        wfPreferencesService.getPreference('featureSwitches').then((data) => { $scope.showFormatDropdown = data;})
        
        $scope.modalTitle = ({
            'create': `Create ${$scope.contentName}`,
            'edit': `Edit ${$scope.contentName}`,
            'import': 'Import Existing Content'
        })[mode];
    });

    $scope.loadingTemplates = true;

    wfComposerService.loadTemplates().then(templates => {
        const sortedTemplates = _.sortBy(templates, 'title');

        $scope.templates = sortedTemplates.map(({ title, dateCreated }) => {
            // TODO MRB: Ideally Composer would give us back an opaque ID.
            // It's like this for now so we can roll Composer and Workflow
            // forward and back independently.
            return {
                id: `${title}_${dateCreated}`,
                display: `${title} - ${moment(dateCreated).format("Do MMMM YYYY")}`
            }

        });
    }).finally(() => {
        $scope.loadingTemplates = false;
    });

    function getAtomDisplayName(type) {
      switch (type) {
        case 'media':
          return 'Media';
        case 'chart':
          return 'Chart'
        default:
          return type;
      }
    }

    function getAtomDropdownData() {
      return _wfConfig.atomTypes.map(type => {
        return { value: type, displayName: getAtomDisplayName(type) };
      });
    }

    $scope.mode = mode;

    $scope.formData = {};
    $scope.disabled = !!stub.composerId;
    $scope.sections = getSectionsList(sections);
    $scope.templates = [];
    $scope.statuses = statusLabels;
    $scope.cdesks = _wfConfig.commissioningDesks;
    $scope.atomTypes = getAtomDropdownData();

    if(mode==='import') {
       $scope.statuses = statusLabels;
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
        const filtered = sections.filter(({ selected }) => selected);
        if (filtered.length === 0) {
            return sections
        }
        return filtered
    }

    $scope.articleFormats = articleFormatService.getArticleFormats();
    $scope.legalStates = legalStatesService.getLegalStates();
    $scope.pictureDeskStates = pictureDeskStatesService.getpictureDeskStates();
    $scope.prodOffices = wfProdOfficeService.getProdOffices();

    $scope.$watch('stub.section', (newValue) => {

        if (newValue) {
            wfPreferencesService.getPreference('preferredStub').then((data) => {
                data.section = newValue.name;
                wfPreferencesService.setPreference('preferredStub', data);
            }, () => {
                wfPreferencesService.setPreference('preferredStub', {
                    section: newValue.name
                });
            })
        }

    }, true);

    $scope.validImport = false;
    $scope.wfComposerState;

    /* when a request is made to import an item from another tool,
     * e.g. composer or an atom editor, then we will check to see if
     * it is already being tracked by Workflow. If, this function will
     * be called with the workflow entry as it's argument.
     */
    function importHandleExisting(content) {
        if(content.visibleOnUi) {
            $scope.wfComposerState = 'visible';
            $scope.stubId = res.data.data.id;
        }
        else {
            $scope.wfComposerState = 'invisible'
        }
    }

    function importComposerContent() {
        wfComposerService.getComposerContent($scope.formData.importUrl)
            .then((response) => wfComposerService.parseComposerData(response, $scope.stub))
            .then((contentItem) => {
                const composerId = contentItem.composerId;

                if(composerId) {
                    $scope.composerUrl = config.composerViewContent + '/' + composerId;
                    $scope.stub.title = contentItem.headline;
                    // slice needed because the australian prodOffice is 'AUS' in composer and 'AU' in workflow
                    $scope.stub.prodOffice  = contentItem.composerProdOffice ? contentItem.composerProdOffice.slice(0,2) : 'UK';

                    wfContentService.getById(composerId).then(
                        (res) => importHandleExisting(res.data.data),
                        (err) => {
                            if(err.status === 404) {
                                $scope.validImport = true;
                            }
                        });
                }
            }, () => {
            $scope.actionSuccess = false;
        });
    }

    function importContentAtom(id, atomType) {
        wfCapiAtomService.getCapiAtom(id, atomType).then((response) => {
            if(response) {
                $scope.editorUrl = config.mediaAtomMakerViewAtom + id;
                const atom = wfCapiAtomService.parseCapiAtomData(response, atomType);
                $scope.stub.title = atom.title;
                $scope.stub.contentType = atomType.toLowerCase();
                $scope.stub.editorId = id;
                wfContentService.getByEditorId(id).then(
                    (res) => importHandleExisting(res.data.data),
                    (err) => {
                        if(err.status === 404) {
                            $scope.validImport = true;
                        }
                    }
                );
            }
        });
    }

    /* we can import from various different tools. Which one will be
     * determined by the URL. This list matches URL regexes to
     * functions which can handle the import. The first one that
     * matches will be applied. The default fallback is Composer,
     * which will match against everything and attempt to import. If
     * that import fails the whole thing has failed. */
    const importUrlHandlers = [
        { name: "Media Atom Maker",
          regex: "videos/([0-9a-f-]+)$",
          fn: (url, matches) => importContentAtom(matches[1], "media")
        },
        {
            name: "Atom Workshop",
            regex: /atoms\/([a-z]+)\/([0-9a-f-]+)/gi,
            fn: (url, matches) => importContentAtom(matches[1], matches[2])
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
        }
    };

    $scope.commissionedLengthSuggestions = [
        350,
        600,
        900,
        1200,
    ]

    $scope.resetCommissionedLength = () => {
        $scope.stub.commissionedLength = "";
    }

    $scope.resetIsBreakingNews = () => {
        $scope.stub.isBreakingNews = false;
    }

    $scope.submit = function (form) {
        if (form.$invalid)
            return;  // Form is not ready to submit
        if ($scope.actionSuccess) { // Form has already been submitted successfully
            if ($scope.composerUrl)
                window.open($scope.composerUrl, "_blank");
            if ($scope.editorUrl)
                window.open($scope.editorUrl, "_blank");
            $scope.cancel()
        }
        else {
            const addToComposer = $scope.stub.status !== 'Stub' && $scope.contentName !== 'Atom';
            const addToAtomEditor = !addToComposer && $scope.contentName === 'Atom' && $scope.stub.status !== 'Stub';
            $scope.ok(addToComposer, addToAtomEditor);
        }
    };

    $scope.ok = function (addToComposer, addToAtomEditor) {
        const stub = $scope.stub;
        console.log("stub", stub)
        function createItemPromise() {
            if ($scope.contentName === 'Atom') {
                stub.contentType = $scope.stub.contentType.toLowerCase();
                if (addToAtomEditor) {
                    return wfContentService.createInAtomEditor(stub);
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

        createItemPromise().then(() => {
            const eventName = ({
                'create': {
                    category: 'Stub',
                    action: 'Created',
                    value: {
                      'Created in Composer': stub.composerId
                    }
                },
                'edit': {
                  category: 'Stub',
                  action: 'Edited'
                },
                'import': {
                  category: 'Content',
                  action: 'Imported'
                },
            }[$scope.mode]);

            $rootScope.$broadcast('track:event', eventName.category, eventName.action, null, null, Object.assign(
                {}, {
                    'Section': stub.section,
                    'Content type': stub.contentType
                }, eventName.value ? eventName.value : {})
            );

            $rootScope.$broadcast('getContent');

            if ($scope.contentName === 'Atom') {
                if (stub.editorId && ($scope.mode !== 'import')) {
                    $scope.editorUrl = wfContentService.getEditorUrl(stub.editorId, stub.contentType);
                } else {
                    $modalInstance.close({
                        addToEditor: addToAtomEditor,
                        stub: $scope.stub
                    });
                }
            } else {
                if(stub.composerId && ($scope.mode !== 'import')) {
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
                if(err.data.composerId) {
                    $scope.composerUrl = config.composerViewContent + '/' + err.data.composerId;
                }
                if(err.data.editorId) {
                    $scope.editorUrl = wfContentService.getEditorUrl(stub.editorId, stub.contentType);
                }
                if(err.data.stubId) {
                    $scope.stubId = err.data.stubId;
                }
            } else {
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
                $scope.$emit('content.deleted');
                $scope.$emit('track:event', 'Content', 'Deleted', null, null, {
                    'Section': $scope.stub.contentItem.section,
                    'Content type': $scope.stub.contentItem.contentType
                });
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
    function ($window, $rootScope, $modal, $log, wfContentService, wfFiltersService, wfProdOfficeService, wfPreferencesService, wfLocationService, sections) {

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
        function setUpPreferredStub (contentType) {

            function createStubData (contentType, sectionName) {
                let chosenArticleFormat = ""
                switch (contentType) {
                    case "article":
                        chosenArticleFormat = "Standard Article"
                        break;
                    case "keyTakeaways":
                        chosenArticleFormat = "Key Takeaways"
                        break;
                    case "qAndA":
                        chosenArticleFormat = "Q&A Explainer"
                        break;
                    case "timeline":
                        chosenArticleFormat = "Timeline"
                        break;
                    case "miniProfiles":
                        chosenArticleFormat = "Mini profiles"
                        break;
                    default:
                        break;
                }

                return {
                    articleFormat: chosenArticleFormat,
                    contentType: contentType === "atom" ? defaultAtomType : contentType,
                    // Only send through a section if one is found in the prefs
                    section: sectionName === null ? sectionName : sections.filter((section) => section.name === sectionName)[0],
                    priority: 0,
                    needsLegal: 'NA',
                    needsPictureDesk: 'NA',
                    prodOffice: currentFilteredOffice() ||  guessCurrentOfficeFromTimezone()
                };
            }

            return wfPreferencesService.getPreference('preferredStub').then((data) => {

                return createStubData(contentType, data.section);
            }, () => {

                return createStubData(contentType, null);
            });
        }


        $rootScope.$on('stub:edit', function (event, stub) {
            open(stub, 'edit');
        });

        $rootScope.$on('stub:create', function (event, contentType) {
            setUpPreferredStub(contentType).then((stub) => {
                open(stub, 'create')
            });
        });

        $rootScope.$on('content:import', function () {
            setUpPreferredStub(null).then((stub) => {
                open(stub, 'import')
            });
        });

        function open(stub, mode) {
            $modal.open({
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
          link: function (scope, element, attrs) {
              if(attrs.focusMe === "true" || attrs.focusMe === undefined) {
                $timeout(function() { element[0].focus(); }, 500);
              }
          }
      };
    }]);
