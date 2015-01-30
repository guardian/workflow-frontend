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
export function wfContentListDrawer($rootScope, config, $timeout, $window, contentService, prodOfficeService, featureSwitches, wfGoogleApiService) {

    var hiddenClass = 'content-list-drawer--hidden';

    function buildIncopyUrl(fields) {
        return config.incopyExportUrl
            .replace(/\$\{(.*?)\}/g, function(match, fieldName) {
                return fields[fieldName] || "";
            });
    }


    return {
        restrict: 'A',
        replace: true,
        templateUrl: '/assets/components/content-list-drawer/content-list-drawer.html',
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
            this.hide = () => new Promise((resolve, reject) => {
                if (this.isHidden()) {
                    return resolve();
                }

                $element.addClass(hiddenClass);

                $scope.contentList.selectedItem = null;
                $scope.assigneeImage = null
                $parent.append($element);
                resolve();
            });


            /**
             * Shows the drawer.
             * @returns {Promise}
             */
            this.show = () => new Promise((resolve, reject) => {
                if (!this.isHidden()) {
                    resolve();
                }

                $element.removeClass(hiddenClass);

                resolve();
            });


            /**
             * Shows a new contentItem moving the drawer to the row beneath its element.
             */
            this.showContent = (contentItem, $contentListItemElement) => {

                return this.hide().then(() => {
                    $contentListItemElement.after($element);

                    $scope.contentItem = contentItem;
                    $scope.contentList.selectedItem = contentItem;

                    this.updateAssigneeUserImage();

                    $scope.$apply();

                    return this.show();
                });

            };

            this.isHidden = () => $element.hasClass(hiddenClass);


            this.toggle = () => this.isHidden() ? this.show() : this.hide();


            /**
             * Toggles drawer display and can display a different contentItem
             * if one is already being displayed.
             */
            this.toggleContent = (contentItem, $contentListItemElement) => {
                var selectedItem = $scope.contentList.selectedItem;

                if (selectedItem && selectedItem.id !== contentItem.id) {
                    return this.hide().then(() => this.showContent(contentItem, $contentListItemElement));
                }

                return this.isHidden() ? this.showContent(contentItem, $contentListItemElement) : this.hide();
            };

            this.updateAssigneeUserImage = function () {
                // Enhance assignee with Image
                wfGoogleApiService.searchUsers($scope.contentItem.assigneeEmail).then((data) => {
                    if (data && data.length) {
                        $scope.assigneeImage = data[0].thumbnailPhotoUrl;
                    }
                });
            }
        },


        link: function ($scope, elem, attrs, contentListDrawerController) {

            $scope.maxNoteLength = config.maxNoteLength;

            $scope.prodOffices = prodOfficeService.getProdOffices();
            $scope.incopyExportEnabled = false;
            featureSwitches.withSwitch("incopy-export",
                                       val => $scope.incopyExportEnabled = val);

            /**
             * Listen for event triggered by click in external contentItemRow directive to show or hide drawer
             */
            $rootScope.$on('contentItem.select', ($event, contentItem, contentListItemElement) => {
                $scope.awaitingDeleteConfirmation = false;

                if (contentItem.status === 'Stub') {
                    $scope.$emit('stub:edit', contentItem.item);
                    return;
                }

                // TODO: move build incopy URL to decorator
                $scope.incopyExportUrl = buildIncopyUrl({ "composerId": contentItem.composerId });

                contentListDrawerController.toggleContent(contentItem, contentListItemElement);

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

                // selectedItem no longer in table
                if (!data.selectedItem) {
                    // TODO: move to generic "hide drawer" method
                    contentListDrawerController.hide();

                    // Update selectedItem from new polled data - updates changed data
                } else if ($scope.contentItem !== data.selectedItem) {

                    if ($scope.contentItem.id !== data.selectedItem.id) {
                        // TODO toggle show different item (edge case, rarely should fire)
                        //      generally covered by above event on "contentItem.select"

                        $scope.contentItem = data.selectedItem;

                    } else if ($scope.contentItem.status !== data.selectedItem.status) {
                        // Item has moved status, hide drawer and select nothing

                        contentListDrawerController.hide();

                    } else {
                        $scope.contentItem = data.selectedItem;
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

                var content = $scope.contentItem,
                    parsedDate,
                    requestData;

                if (content.item.due) { // TODO: See content-list.js:118
                    parsedDate = moment(content.item.due);
                    if (parsedDate.isValid()) {
                        requestData = parsedDate.toISOString();
                    }
                }

                updateField("dueDate", requestData);
                $scope.$apply();
            };

            /**
             * Delete manually as no event or tracking yet
             */
            $scope.awaitingDeleteConfirmation = false;
            $scope.deleteContentItem = function () {
                if(!$scope.awaitingDeleteConfirmation) { $scope.awaitingDeleteConfirmation = true; return; }

                contentService.remove($scope.contentItem.id)
                    .then(() => {

                        contentListDrawerController.hide();

                        $scope.$emit('content.deleted', { contentItem: $scope.contentItem });
                        $scope.$apply();
                    }, errorMessage);
            };
            function errorMessage(err) {
                $scope.$apply(() => { throw new Error('Error deleting content: ' + (err.message || err)); });

            };

            $scope.toggleAssigneeEditing = function () {
                $scope.editingAssignee = !$scope.editingAssignee;
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
