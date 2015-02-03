
'use strict';

import angular from 'angular';
import _ from 'lodash';

import 'lib/content-service';
import 'lib/date-service';
import 'lib/presence';
import 'lib/prodoffice-service';
import 'lib/column-service';

import 'components/editable-field/editable-field';

import { wfContentListItem, wfContentItemParser, wfContentItemUpdateActionDirective, wfGetPriorityStringFilter } from 'components/content-list-item/content-list-item';
import { wfContentListDrawer } from 'components/content-list-drawer/content-list-drawer';


angular.module('wfContentList', ['wfContentService', 'wfDateService', 'wfProdOfficeService', 'wfPresenceService', 'wfEditableField'])
    .service('wfContentItemParser', ['config', 'statuses', 'wfLocaliseDateTimeFilter', 'wfFormatDateTimeFilter', 'sections', wfContentItemParser])
    .filter('getPriorityString', wfGetPriorityStringFilter)
    .controller('wfContentListController', ['$rootScope', '$scope', '$anchorScroll', 'statuses', 'sections', 'wfContentService', 'wfContentPollingService', 'wfContentItemParser', 'wfPresenceService', 'wfColumnService', 'wfPreferencesService', wfContentListController])
    .directive('wfContentItemUpdateAction', wfContentItemUpdateActionDirective)
    .directive('wfContentListItem', ['$rootScope', wfContentListItem])
    .directive('wfContentListDrawer', ['$rootScope', 'config', '$timeout', '$window', 'wfContentService', 'wfProdOfficeService', 'wfFeatureSwitches', wfContentListDrawer])
    .directive("bindCompiledHtml", function($compile, $timeout) {
        return {
            scope: {
                rawHtml: '=bindCompiledHtml'
            },
            link: function(scope, elem, attrs) {
                scope.$watch('rawHtml', function(value) {
                    if (!value) return;
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
            link: ($scope, elem, attrs) => {

                $rootScope.$watch('contentItemTemplate', () => {

                    var contentListHeading = '<tr class="content-list__group-heading-row"><th class="content-list__group-heading" scope="rowgroup" colspan="{{ 9 + columns.length }}"><span class="content-list__group-heading-link">{{ group.title }} <span class="content-list__group-heading-count" ng-show="group.items.length">{{ group.items.length }}</span></span></th></tr>';

                    var contentListContent = '<tr wf-content-list-item class="content-list-item" ng-class="{\'content-list-item--selected\': contentList.selectedItem === contentItem, \'content-list-item--published\': contentItem.isPublished && !contentItem.isTakenDown, \'content-list-item--takendown\': contentItem.isTakenDown}" ng-repeat="contentItem in group.items track by contentItem.id" content-item="contentItem" content-list="contentList" legal-values="contentList.legalValues" status-values="statusValues" sections="sections" id="stub-{{contentItem.id}}" href="stub-{{contentItem.id}}" template="contentItemTemplate"></tr>';

                    var contentListTemplate = contentListHeading + contentListContent;

                    $rootScope.compiledTemplate = $rootScope.compiledTemplate || $compile(contentListTemplate);

                    $rootScope.compiledTemplate($scope, function(clonedElement, $scope){
                        elem.append(clonedElement);
                    });
                });
            }
        };
    });



function wfContentListController($rootScope, $scope, $anchorScroll, statuses, sections, wfContentService, wfContentPollingService, wfContentItemParser, wfPresenceService, wfColumnService, wfPreferencesService) {

    /*jshint validthis:true */

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

    wfColumnService.getContentItemTemplate().then((template) => {

        $rootScope.contentItemTemplate = template;
    });

    $scope.showColumnMenu = false;
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
            $scope.$watch('compactView', (newValue, oldValue) => { // store any change to compact view as a pref
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
            $scope.$watch('contentList.showHeadline', (newValue, oldValue) => {
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
        var prefix = (contentItem.status === 'Stub') ? 'stub' : 'content';
        $scope.$emit(prefix + ':edit', contentItem.item);
    };

    this.legalValues = [
        { name: '', value: 'NA' },
        { name: 'Check it', value: 'REQUIRED' },
        { name: 'Approved', value: 'COMPLETE'}
    ];

    this.sections = sections;

    this.priorities = [
        { name: 'Normal', value: 0 },
        { name: 'Urgent', value: 1 },
        { name: 'Very-Urgent', value: 2 }
    ];

    // Watch composer contentIds for Presence
    $scope.$watch('contentIds', (newIds, oldIds) => {
        if (newIds !== oldIds) {  // guards against initial render when newIds === oldIds === undefined
            wfPresenceService.subscribe(newIds);
        }
    }, true);

    $scope.$on('presence.connection.success', function(){
        wfPresenceService.subscribe($scope.contentIds);
    });

    this.render = (response) => {
        var data = response.data;

        // TODO stubs and content are separate structures in the API response
        //      make this a single list of content with consistent structure in the API
        var content = data.stubs.concat(data.content).map(wfContentItemParser.parse),
            grouped = _.groupBy(content, 'status');

        $scope.content = statuses.map((status) => {
            // TODO: status is currently stored as presentation text, eg: "Writers"
            //       should be stored as an enum and transformed to presentation text
            //       here in the front-end
            return {
                name: status.toLowerCase(),
                title: status == 'Stub' ? 'News list' : status,
                items: grouped[status]
            };
        });

        $scope.contentIds = data.content.map((content) => content.composerId);

        // update selectedItem as objects are now !==
        if (this.selectedItem) {
            this.selectedItem = _.find(content, { id: this.selectedItem.id });
        }

        $scope.refreshContentError = false;

        $scope.$emit('content.render', {
            content: $scope.content,
            selectedItem: this.selectedItem
        });

        $scope.$apply();
        $scope.$emit('content.rendered');
    };


    this.renderError = (err) => {
        $scope.refreshContentError = err;

        $scope.$apply(() => {
            throw new Error('Error rendering content: ' + (err.message || err));
        });

    };


    $scope.$on('contentItem.update', ($event, msg) => {

        // generally there'll only be one field to update, but iterate just incase
        // TODO: if multiple fields need updating, do it in a single API call
        for (var field in msg.data) {
            wfContentService.updateField(msg.contentItem.item, field, msg.data[field]).then(() => {
                $scope.$emit('contentItem.updated', {
                    'contentItem': msg.contentItem,
                    'field': field,
                    'data': msg.data,
                    'oldValues': msg.oldValues
                });

                this.poller.refresh();

            }, (err) => {
                $scope.refreshContentError = err;

                $scope.$apply(() => {
                    throw new Error('Error updating content: ' + (err.message || err));
                });
            });
        }

    });

    $scope.$on('content.deleted', ($event, msg) => {
        this.poller.refresh();
    });


    // Start polling
    var poller = this.poller = new wfContentPollingService(function () {
        return wfContentService.getServerParams();
    });

    poller.onPoll(this.render);
    poller.onError(this.renderError);

    poller.startPolling().then(function(){
        var myListener = $rootScope.$on('content.rendered',
            function(event, data){
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
