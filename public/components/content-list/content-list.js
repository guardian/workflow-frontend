
'use strict';

import angular from 'angular';
import _ from 'lodash';

import 'lib/content-service';
import 'lib/composer-service';
import 'lib/date-service';
import 'lib/presence';
import 'lib/prodoffice-service';
import 'lib/column-service';
import 'lib/capi-content-service';
import 'lib/capi-atom-service';
import 'lib/atom-service';
import 'lib/settings-service';

import 'components/editable-field/editable-field';

import './content-list.html';

import { wfContentListItem, wfContentItemParser, wfContentItemUpdateActionDirective, wfGetPriorityStringFilter, wfCommissionedLengthCtrl } from 'components/content-list-item/content-list-item';
import { wfContentListDrawer } from 'components/content-list-drawer/content-list-drawer';
import { wfLoader } from 'components/loader/loader';


angular.module('wfContentList', ['wfContentService', 'wfDateService', 'wfProdOfficeService', 'wfPresenceService', 'wfEditableField', 'wfCapiContentService', 'wfCapiAtomService', 'wfAtomService', 'wfSettingsService', 'wfComposerService'])
    .service('wfContentItemParser', ['config', 'statusLabels', 'sections', wfContentItemParser])
    .filter('getPriorityString', wfGetPriorityStringFilter)
    .controller('wfContentListController', ['$rootScope', '$scope', '$anchorScroll', 'statuses', 'legalValues', 'priorities', 'sections', 'wfContentService', 'wfContentPollingService', 'wfContentItemParser', 'wfPresenceService', 'wfColumnService', 'wfPreferencesService', 'wfFiltersService', wfContentListController])
    .directive('wfContentListLoader', ['$rootScope', wfLoader])
    .directive('wfContentItemUpdateAction', wfContentItemUpdateActionDirective)
    .directive('wfContentListItem', ['$rootScope', 'statuses', 'legalValues', 'sections', 'config', wfContentListItem])
    .controller('wfCommissionedLengthCtrl', ['$scope', wfCommissionedLengthCtrl])
    .directive('wfContentListDrawer', ['$rootScope', 'config', '$timeout', '$window', 'wfContentService', 'wfProdOfficeService', 'wfGoogleApiService', 'wfCapiContentService', 'wfCapiAtomService', 'wfAtomService', 'wfSettingsService', 'wfComposerService', wfContentListDrawer])
    .directive("bindCompiledHtml", function($compile) {
        return {
            scope: {
                rawHtml: '=bindCompiledHtml'
            },
            link: function(scope, elem) {
                scope.$watch('rawHtml', function(value) {
                    if (!value) {
                        return;
                    }
                    var newElem;
                    try { // Crappy javascript :-(
                        newElem = $compile(value)(scope.$parent);
                    } catch (e) {
                        newElem = value;
                    }
                    elem.contents().remove();
                    elem.append(newElem);
                });
            }
        };
    })
    .directive("contentListItemContainer", function ($compile, $rootScope) {
        return {
            restrict: 'A',
            transclude: true,
            link: ($scope, elem) => {

                $rootScope.$watch('contentItemTemplate', () => {

                    var contentListHeading = '<tr class="content-list__group-heading-row content-list--sticky-row" ng-show="currentlySelectedStatusFilters.indexOf(group.title) != -1"><th class="content-list__group-heading" scope="rowgroup" colspan="{{ 9 + columns.length }}"><span class="content-list__group-heading-link">{{ group.title }} <span class="content-list__group-heading-count">{{ group.count || "0" }}</span></span></th></tr>';

                    var contentListItemDirective = '<tr wf-content-list-item class="content-list-item content-list-item--{{contentItem.lifecycleStateKey}}" ng-repeat="contentItem in group.items track by contentItem.id" ';

                    var contentListItemClasses = 'ng-class="{\'content-list-item--selected\' : contentList.selectedItem === contentItem, \'content-list-item--trashed\': contentItem.item.trashed}"';

                    var contentListItemAttributes = 'content-item="contentItem" content-list="contentList" id="stub-{{contentItem.id}}" template="contentItemTemplate"></tr>';

                    var contentListItemContent = contentListItemDirective + contentListItemClasses + contentListItemAttributes;

                    var contentListTemplate = contentListHeading + contentListItemContent;

                    $rootScope.compiledTemplate = $rootScope.compiledTemplate || $compile(contentListTemplate);

                    $rootScope.compiledTemplate($scope, function(clonedElement){
                        elem.append(clonedElement);
                    });
                });
            }
        };
    });



function wfContentListController($rootScope, $scope, $anchorScroll, statuses, legalValues, priorities, sections, wfContentService, wfContentPollingService, wfContentItemParser, wfPresenceService, wfColumnService, wfPreferencesService, wfFiltersService) {
    $scope.googleAuthBannerVisible = false;
    $rootScope.$on('wfGoogleApiService.userIsNotAuthorized', () => {
        $scope.googleAuthBannerVisible = true;
    });
    $rootScope.$on('wfGoogleApiService.userIsAuthorized', () => {
        $scope.googleAuthBannerVisible = false;
    });

    $scope.presenceIsActive = false;
    $rootScope.$on("presence.connection.error", () => $scope.presenceIsActive = false);
    $rootScope.$on("presence.connection.retry", () => $scope.presenceIsActive = false);
    $rootScope.$on("presence.connection.open",  () => $scope.presenceIsActive = true);

    /*jshint validthis:true */

    $scope.resetFilters = function () {
        wfFiltersService.clearAll(false);
    };

    $scope.animationsEnabled = true;

    $rootScope.$on('getContent', () => {
        $scope.animationsEnabled = false;
    });

    $rootScope.$on('content.rendered', () => {
        $scope.animationsEnabled = true;
    });

    wfColumnService.getColumns().then((data) => {
        $scope.columns = data;
    });

    $scope.getColumnTitle = function(col) {
        if (col.name !== 'presence') {
            return (col.title.length > 0) ? col.title : undefined;
        } else {
            return $scope.presenceIsActive ? col.title : col.unavailableTitle;
        }
    };

    wfColumnService.getContentItemTemplate().then((template) => {

        $rootScope.contentItemTemplate = template;
    });

    $scope.showColumnMenu = false;

    /**
     * If the user has not clicked in to the column configurator then show
     * the new labels against the configurator button and the new field.
     */
    (function displayNewIndicatorsIfNotSeenBefore () {

        $scope.showColumnMenuNewIndicator = false;
        wfPreferencesService.getPreference('ofwFieldNotYetSeen').then((data) => {

            $scope.showColumnMenuNewIndicator = data;
        }, () => {

            $scope.showColumnMenuNewIndicator = true;

            $scope.$watch('showColumnMenu', (newValue, oldValue) => {

                if (newValue !== oldValue) {
                    wfPreferencesService.setPreference('ofwFieldNotYetSeen', false);
                }
            }, false);
        });
    })();

    $scope.colChange = function () {
        wfColumnService.setColumns($scope.columns).then(() => {
            if (confirm('Configuring columns requires a refresh, reload the page?')) {
                window.location.reload();
            }
        });
    };
    $scope.colChangeSelect = function () {
        $scope.columnsEdited = true;
    };

    (function handleCompactView () {

        $scope.compactView = {
            visible: false // compact view off by default
        };

        wfPreferencesService.getPreference('compactView').then((data) => { // query prefs for compact view
            $scope.compactView = data;
            setUpWatch();
        }, setUpWatch);

        function setUpWatch () {
            $scope.$watch('compactView', (newValue) => { // store any change to compact view as a pref
                wfPreferencesService.setPreference('compactView', newValue);
            }, true);
        }
    })();

    (function handleHeadlineVisibility (controller) {

        controller.showHeadline = false;

        wfPreferencesService.getPreference('showHeadline').then((data) => {
            controller.showHeadline = data;
            setUpWatch();
        }, setUpWatch);

        function setUpWatch () {
            $scope.$watch('contentList.showHeadline', (newValue) => {
                wfPreferencesService.setPreference('showHeadline', newValue);
            }, true);
        }
    })(this);

    this.newItem = function () {
        $scope.$emit('stub:create');
    };

    this.importItem = function () {
        $scope.$emit('content:import');
    };

    this.editItem = (contentItem) => {
        var prefix = 'content';
        $scope.$emit(prefix + ':edit', contentItem.item);
    };

    this.legalValues = legalValues;

    this.sections = sections;

    this.priorities = priorities;

    // Watch composer contentIds for Presence
    $scope.$watch('contentIds', (newIds, oldIds) => {
        if (newIds !== oldIds) {  // guards against initial render when newIds === oldIds === undefined
            wfPresenceService.subscribe(newIds);
        }
    }, true);


    // Infinite Scrolling functionality
    // See infinite-scroll http://sroze.github.io/ngInfiniteScroll/documentation.html
    // =============================================================================== //

    var INFINITE_SCROLL_STARTING_ITEMS = 50, // TODO Dynamically calculate optimal value based on container height
        INFINITE_SCROLL_ITEM_LOAD_INCREMENT = 20,
        INFINITE_SCROLL_LOAD_MORE_TRIGGER = 1.5; // Multiples of container height

    $scope.contentItemsLoadingThreshold = INFINITE_SCROLL_LOAD_MORE_TRIGGER;
    $scope.contentItemsDisplayed = INFINITE_SCROLL_STARTING_ITEMS;
    $scope.contentItemLoadingIncrement = INFINITE_SCROLL_ITEM_LOAD_INCREMENT;

    $scope.$on('getContent', () => {
        $scope.contentItemsDisplayed = INFINITE_SCROLL_STARTING_ITEMS; // reset when filters are applied
        $scope.infiniteScrollDisabled = false;
    });

    /**
     * Trim the content to length over the status groups.
     * ie: If 100 items are requested you might get 20 from Stubs, 30 from Writers and 50 from Desk making 100 in total
     * @param content The content grouped by status
     * @param trimTo Amount of items to return
     * @returns {*}
     */
    $scope.trimContentToLength = function (content, trimTo) {

        var groups = _.cloneDeep(content); // Ensure originalContent is left unchanged

        groups.forEach((group) => {
            if (group.items && group.items.length) {
                if (group.items.length < trimTo) {
                    trimTo = trimTo - group.items.length;
                } else {
                    group.items.length = trimTo;
                    trimTo = 0;
                }
            }
        });

        return groups;
    };

    /**
     * Method called when the bottom of the list gets within
     * INFINITE_SCROLL_LOAD_MORE_TRIGGER * container.height pixels of the bottom of the container
     *
     * Increments the amount of items to display and the re-trims the originalContent object to length
     */
    $scope.moreContent = function () {
        $scope.infiniteScrollDisabled = true;
        $scope.contentItemsDisplayed += $scope.contentItemLoadingIncrement;
        $scope.animationsEnabled = false;
        doContentTrimAndSetContent();
        $scope.infiniteScrollDisabled = false;
    };

    function doContentTrimAndSetContent () {
        if ($scope.contentItemsDisplayed >= $scope.totalContentItems) {
            $scope.content = $scope.originalContent;
            $scope.displayingEverything = true;
            $scope.infiniteScrollDisabled = true;
        } else {
            $scope.content = $scope.trimContentToLength($scope.originalContent,  $scope.contentItemsDisplayed);
            $scope.displayingEverything = false;
        }

        $scope.content.map((status) => {
            status.items = status.items ? status.items.map(wfContentItemParser.parse) : status.items;
            return status;
        });
    }

    function parseContentForIds(content) {
        const contentItems = _.flatten(content.map((c) => c.items));
        const filteredItems = contentItems.filter((item) => item !== undefined);

        const contentItemIds = filteredItems.map(item => {
            if (item.composerId) {
                return item.composerId;
            }

            if (item.contentType && item.editorId) {
                return `${item.contentType}-${item.editorId}`;
            }
        });

        return contentItemIds.filter(Boolean);
    }

    // =============================================================================== //

    this.render = (response) => {
        var data = response.data;

        var grouped = data.content;

        // fixes https://docs.angularjs.org/error/$rootScope/inprog http://www.pro-tekconsulting.com/blog/solution-to-error-digest-already-in-progress-in-angularjs-2/
        if(!$scope.$$phase) {
            $scope.$apply(() => {
                $scope.totalContentItems = data.count.total;

                $scope.originalContent = statuses.map((status) => {
                    // TODO: status is currently stored as presentation text, eg: "Writers"
                    //       should be stored as an enum and transformed to presentation text
                    //       here in the front-end

                    return {
                        name: status.toLowerCase(),
                        title: status,
                        count: data.count[status],
                        items: grouped[status]
                    };
                });

                doContentTrimAndSetContent();

                (function setUpPresenceContentIds () {
                    $scope.contentIds = parseContentForIds($scope.content);
                })();

                $scope.$emit('content.render', {
                    content: $scope.content
                });

            });
        }

        $scope.$emit('content.rendered');

    };

    this.renderError = (err) => {

        $scope.$apply(() => {
            var newError = new Error('Error rendering content: ' + (err.message || err));
            newError.name = err.name || 'Error';
            newError.cause = err;
            throw newError;
        });

    };

    $scope.$on('contentItem.update', ($event, msg) => {

        // generally there'll only be one field to update, but iterate just incase
        // TODO: if multiple fields need updating, do it in a single API call
        for (var field in msg.data) {

            wfContentService.updateField(msg.contentItem.item, field, msg.data[field], msg.contentItem.contentType).then(() => {
                if (msg.data) {

                    if (msg.data.status) {
                        $scope.$emit('track:event', 'Content', 'Status changed', null, null, {
                            'Status transition': msg.oldValues.status + ' to ' + msg.data.status,
                            'Section': msg.contentItem.section,
                            'Content type': msg.contentItem.contentType
                        });
                    } else {
                        for (var fieldId in msg.data) {
                            $scope.$emit('track:event', 'Content', 'Edited', null, null, {
                                'Field': fieldId,
                                'Section': msg.contentItem.section,
                                'Content type': msg.contentItem.contentType
                            })
                        }
                    }

                }




                this.poller.refresh();

            }, (err) => {
                $scope.refreshContentError = err;

                $scope.$apply(() => {
                    var newError = new Error('Error updating content: ' + (err.message || err));
                    newError.name = err.name || 'Error';
                    newError.cause = err;
                    throw newError;
                });
            });
        }

    });

    $scope.$on('content.deleted', () => {
        this.poller.refresh();
    });


    // Start polling
    var poller = this.poller = new wfContentPollingService(function () {
        return wfContentService.getServerParams();
    });

    poller.onPoll((response) => {
        // catch race condition between determining the contentItemTemplate, and rendering content
        if ($rootScope.contentItemTemplate) {
            this.render(response);
        } else {
            wfColumnService.getContentItemTemplate().then(this.render.bind(this, response));
        }
    });
    poller.onError(this.renderError);

    poller.startPolling().then(function(){
        var myListener = $rootScope.$on('content.rendered',
            function(){
                $anchorScroll();
                myListener();
            });
    });

    $scope.$on('destroy', function () {
        poller.stopPolling();
    });

    // TODO: use more specific event names to trigger a refresh, eg: filterChanged, contentImported
    $scope.$on('getContent', this.poller.refresh.bind(this.poller));
}
