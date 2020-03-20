import contentListDrawerTemplate from './content-list-drawer.html';
import _ from 'lodash';


var SETTING_OPEN_SECTION = 'openSection';

/**
 * Directive for handling logic around the contentItemRow details drawer.
 *
 * Allows the drawer to be shown and hidden in the appropriate places aswell as allowing the editing of some fields.
 *
 * TODO: Try and move away from $timeouts to trigger scope update
 *
 * @param $rootScope
 * @param config
 * @param $timeout
 * @param contentService
 * @param prodOfficeService
 */
export function wfContentListDrawer($rootScope, config, $timeout, $window, contentService, prodOfficeService, featureSwitches, wfGoogleApiService, wfCapiContentService, wfCapiAtomService, wfAtomService, wfSettingsService, wfComposerService) {

    var hiddenClass = 'content-list-drawer--hidden';

    function buildUrl(fields, url) {
        console.log(url, fields)
        return url
            .replace(/\$\{(.*?)\}/g, function(match, fieldName) {
                return fields[fieldName] || "";
            });
    }

    function buildComposerRestorerUrl (composerId) {
        return config.composerRestorerUrl + '/' + composerId + '/versions';
    }

    function isAtom(contentType) {

        return config.atomTypes.indexOf(contentType) !== -1;
    }

    return {
        restrict: 'A',
        replace: true,
        template: contentListDrawerTemplate,
        priority: 1001,
        scope: {
            contentList: '=',
            legalValues: '=',
            statusValues: '='
        },
        controllerAs: 'contentListDrawerController',
        controller: function ($scope, $element) {

            var $parent = $element.parent();
            /**
             * Hide the drawer from view.
             * @returns {Promise}
             */
            this.hide = () => new Promise((resolve) => {
                if (this.isHidden()) {
                    return resolve();
                }

                $element.addClass(hiddenClass);

                $scope.contentList.selectedItem = null;
                $scope.assigneeImage = ' ';
                $parent.append($element);
                resolve();
            });


            /**
             * Shows the drawer.
             * @returns {Promise}
             */
            this.show = () => new Promise((resolve) => {
                if (!this.isHidden()) {
                    resolve();
                }

                $element.removeClass(hiddenClass);

                resolve();
            });


            /**
             * Shows a new contentItem moving the drawer to the row beneath its element.
             */
            this.showContent = (contentItem, $contentListItemElement, capiData) => {

                var self = this;

                return self.hide().then(() => {

                    $scope.$apply(() => {

                        $contentListItemElement.after($element);

                        $scope.contentItem = contentItem;
                        $scope.contentList.selectedItem = contentItem;
                        $scope.capiData = capiData;

                        $scope.currentDatePickerValue = $scope.contentItem.item.due ? $scope.contentItem.item.due : undefined;

                        self.updateAssigneeUserImage();
                    });

                    return self.show();
                });
            };

            this.isHidden = () => $element.hasClass(hiddenClass);


            this.toggle = () => this.isHidden() ? this.show() : this.hide();


            /**
             * Toggles drawer display and can display a different contentItem
             * if one is already being displayed.
             */
            this.toggleContent = (contentItem, $contentListItemElement, capiData) => {

                var selectedItem = $scope.contentList.selectedItem;

                if (selectedItem && selectedItem.id !== contentItem.id) {
                    return this.hide().then(() => this.showContent(contentItem, $contentListItemElement, capiData));
                }

                return this.isHidden() ? this.showContent(contentItem, $contentListItemElement, capiData) : this.hide();
            };

            this.updateAssigneeUserImage = function () {

                // Enhance assignee with Image
                if ($scope.contentItem.assigneeEmail) {
                    wfGoogleApiService.searchUsers($scope.contentItem.assigneeEmail).then((data) => {
                        if (data && data.length) {
                            $scope.assigneeImage = data[0].thumbnailPhotoUrl;
                        }
                    });
                } else {
                    $scope.assigneeImage = ' ';
                }
            }
        },


        link: function ($scope, elem, attrs, contentListDrawerController) {

            $scope.maxNoteLength = config.maxNoteLength;
            $scope.prodOffices = prodOfficeService.getProdOffices();
            $scope.incopyExportEnabled = false;
            featureSwitches.withSwitch("incopy-export",
                                       val => $scope.incopyExportEnabled = val);
            $scope.supportedAtomTypes = config.atomTypes;

            /**
             * Listen for event triggered by click in external contentItemRow directive to show or hide drawer
             */
            $rootScope.$on('contentItem.select', ($event, contentItem, contentListItemElement) => {
                $scope.awaitingDeleteConfirmation = false;
                $scope.selectedItem = contentItem;
                $scope.defaultSection = getDefaultOpenSection() || 'furniture';
                $scope.openSection = $scope.defaultSection || 'furniture';

                if (contentItem.status === 'Stub') {
                    $scope.$emit('stub:edit', contentItem.item);
                    return;
                } else {
                    // reset the date picker to month view (rather than view of previous date selected)
                    $rootScope.$broadcast('resetPicker');
                }

                // TODO: move build incopy URL to decorator
                $scope.incopyOpenUrl = buildUrl({ "storyBundleId": contentItem.storyBundleId }, config.incopyOpenUrl);

                $scope.incopyExportUrl = buildUrl({ "composerId": contentItem.composerId }, config.incopyExportUrl);
                $scope.indesignExportUrl = buildUrl({ "composerId": contentItem.composerId }, config.indesignExportUrl );

                $scope.storyPackagesUrl = config.storyPackagesUrl;

                $scope.composerRestorerUrl = buildComposerRestorerUrl(contentItem.composerId);
                if(isAtom(contentItem.contentType)) {
                    wfCapiAtomService.getCapiAtom(contentItem.item.editorId, contentItem.contentType)
                        .then((resp) => {
                            wfCapiAtomService.getAtomUsages(contentItem.item.editorId, contentItem.contentType)
                                .then((usagesResp) => {
                                    const parsed = wfCapiAtomService.parseCapiAtomData(resp, contentItem.contentType);
                                    parsed.usages = usagesResp;
                                    contentListDrawerController.toggleContent(contentItem, contentListItemElement, parsed);
                                });
                        }, () => {
                            contentListDrawerController.toggleContent(contentItem, contentListItemElement, wfCapiAtomService.emptyCapiAtomObject());
                    });
                } else {
                    wfCapiContentService.getCapiContent(contentItem.path)
                        .then((resp) => {
                        wfCapiContentService.parseCapiContentData(resp)
                            .then((parsed) => {
                                wfCapiContentService.getContentUsages(parsed.atomUsages).then((usages) => {
                                    parsed.usages = usages;
                                    contentListDrawerController.toggleContent(contentItem, contentListItemElement, parsed);
                                });
                            });
                    }, () => {
                        contentListDrawerController.toggleContent(contentItem, contentListItemElement, wfCapiContentService.emptyCapiContentObject());
                    });
                }


            });

            /**
             * Ensure the drawer state is representative if a contentItem changes status
             */
            $rootScope.$on('contentItem.update', ($event, eventData) => {
                if (eventData.contentItem === $scope.contentItem && eventData.data.hasOwnProperty('status')) {
                    contentListDrawerController.hide();
                }
            });


            $rootScope.$on('content.render', ($event, data) => {

                if ($scope.selectedItem) { // Update selected item reference to new item returned from content polling
                    $scope.selectedItem = _.find(
                        data.content.map((c) => c.items) // Status > items
                            .filter((i) => typeof i !== "undefined") // Not undefined
                            .reduce((a, b) => a.concat(b)) // Flatten
                        ,{
                            id: $scope.selectedItem.id
                        });
                }

                // selectedItem no longer in table
                if (!$scope.selectedItem) {
                    // TODO: move to generic "hide drawer" method
                    contentListDrawerController.hide();

                    // Update selectedItem from new polled data - updates changed data
                } else if (
                    $scope.contentItem &&
                    $scope.contentItem !== $scope.selectedItem &&
                    $scope.selectedItem.status !== 'Stub'
                ) {

                    if ($scope.contentItem.id !== $scope.selectedItem.id) {
                        // TODO toggle show different item (edge case, rarely should fire)
                        //      generally covered by above event on "contentItem.select"

                        $scope.contentItem = $scope.selectedItem;

                    } else if ($scope.contentItem.status !== $scope.selectedItem.status) {
                        // Item has moved status, hide drawer and select nothing

                        contentListDrawerController.hide();

                    } else {
                        $scope.contentItem = $scope.selectedItem;
                    }

                }
            });


            /**
             * Send event to the contentList controller and analytics to persist and record
             * scope changed value from non-standard scope updates (ng xeditable and datepicker...)
             *
             * TODO: Don't do this...
             * @param {String} field field to be updated
             * @param {String} value new value to be persisted
             * @param {String} oldValue old value to be recorded
             */
            function updateField (field, value, oldValue) { // Send to analytics

                var msg = {
                    contentItem: $scope.contentItem,
                    data: {},
                    oldValues: {}
                };

                msg.data[field] = value;
                msg.oldValues[field] = oldValue;

                $scope.$emit('contentItem.update', msg);
            }

            function getDefaultOpenSection() {
                return wfSettingsService.get(SETTING_OPEN_SECTION);
            }

            /* Drawer section toggles */
            $scope.toggleSection = function (section) {
                $scope.openSection = section;
            };

            $scope.setDefaultOpenSection = function(section) {
                wfSettingsService.set(SETTING_OPEN_SECTION, section);
                $scope.defaultSection = section;
            };

            $scope.onBeforeSaveNote = function (note) {

                if (note.length > config.maxNoteLength) {
                    return "Note too long";
                } else {
                    updateField("note", note, $scope.contentItem.note);
                }
            };

            $scope.onBeforeSaveAssignee = function (assignee) {

                updateField("assignee", assignee, $scope.contentItem.item.assignee);
            };

            $scope.onBeforeSaveWorkingTitle = function (workingTitle) {
                updateField("workingTitle", workingTitle, $scope.contentItem.workingTitle);
            };


            /**
             * Update the deadline manually using value from datepicker
             */
            $scope.updateDeadline = function () {
                updateField("dueDate", $scope.currentDatePickerValue);
            };

            $scope.updateCommissionedLength = function (newValue) {
                updateField("commissionedLength", newValue);
                if (newValue === "") return wfComposerService.deleteField($scope.contentItem.composerId, "commissionedLength");
                else return wfComposerService.updateField($scope.contentItem.composerId, "commissionedLength", newValue)
            };

            /**
             * Revert deadline to previous state
             */
            $scope.revertDeadline = function () {
                $scope.currentDatePickerValue = $scope.contentItem.item.due;
            };


            /**
             * Delete manually as no event or tracking yet
             */
            $scope.deleteContentItem = function (trashedState) {
                 updateField("trashed", trashedState)
            };

            $scope.toggleAssigneeEditing = function () {
                $scope.editingAssignee = !$scope.editingAssignee;
            };

            $scope.tagsUnavailable = function() {
              if (!$scope.contentItem) {
                return false
              }
              return $scope.contentItem.commissioningDesks && $scope.contentItem.commissioningDesks.length !== 0 &&
                $scope.contentItem.commissioningDesks.some(function(desk) {
                  return !desk;
                });
            };

            $rootScope.$on('punters.punterSelected', () => {

                if ($scope && $scope.contentItem) {

                    $scope.toggleAssigneeEditing(); // Close Field

                    var msg = {
                        contentItem: $scope.contentItem,
                        data: {
                            assignee: $scope.contentItem.assignee,
                            assigneeEmail: $scope.contentItem.assigneeEmail
                        }
                    };

                    $scope.$emit('contentItem.update', msg);

                    contentListDrawerController.updateAssigneeUserImage();
                }
            });
        }
    };
}