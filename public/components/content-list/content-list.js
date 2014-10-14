
'use strict';

import angular from 'angular';
import _groupBy from 'lodash/modern/collections/groupBy';
import _find from 'lodash/modern/collections/find';

import 'lib/content-service';
import 'lib/date-service';
import { wfContentListItem } from 'components/content-list-item/content-list-item';
import { wfContentListDrawer } from 'components/content-list-drawer/content-list-drawer';

// Groupby
// sort by

var OPHAN_PATH = 'http://dashboard.ophan.co.uk/summary?path=/',
    PREVIEW_PATH = 'http://preview.gutools.co.uk/',
    LIVE_PATH = 'http://www.theguardian.com/';

angular.module('wfContentList', ['wfContentService', 'wfDateService'])
    .service('wfContentItemParser', ['config', 'statuses', 'wfLocaliseDateTimeFilter', 'wfFormatDateTimeFilter', wfContentItemParser])
    .controller('wfContentListController', ['$scope', '$log', 'statuses', 'wfContentService', 'wfContentPollingService', 'wfContentItemParser', wfContentListController])
    .directive('wfContentItemUpdateAction', wfContentItemUpdateActionDirective)
    .directive('wfContentListItem', ['$rootScope', wfContentListItem])
    .directive('wfContentListDrawer', ['$rootScope', 'config', 'wfContentService', 'wfProdOfficeService', wfContentListDrawer]);


function wfContentItemParser(config, statuses, wfLocaliseDateTimeFilter, wfFormatDateTimeFilter) {
    /*jshint validthis:true */

    function getPriorityString(priorityValue) {
        if (priorityValue == 1) {
            return "urgent";
        } else if (priorityValue == 2) {
            return "very-urgent";
        }
        return "normal";
    }

    function formatAndLocaliseDate(dateValue, dateFormat) {
        return wfFormatDateTimeFilter(wfLocaliseDateTimeFilter(dateValue), dateFormat);
    }

    function getFullOfficeString(office) {
        var offices = {
            'AU': 'Australia',
            'US': 'United States of America',
            'UK': 'United Kingdom of Great Britain & Ireland'
        };

        return offices[office];
    }

    function toTitleCase(str) {
        return str.replace(/\b\w/g, function (txt) { return txt.toUpperCase(); });
    }

    function toInitials(str) {
        if (str.length <= 2) { return str; }
        return str.replace(/^(\w)\w*?\b.*?\b(?:(\w)\w*?)?$/, '$1$2');
    }

    var newslistStatusValues = [ { label: 'News list', value: 'Stub'}, { label: 'Writers', value: 'writers' } ],
        contentStatusValues = statuses.filter((status) => status !== 'Stub').map( (status) => { return { label: status, value: status }; });

    class ContentItemLinks {
        constructor(item) {
            if (item.composerId) {
                this.composer = config.composerViewContent + '/' + item.composerId;
            }
            if (item.path) {
                this.preview = PREVIEW_PATH + item.path;
            }
            if (item.published && item.path) {
                this.live = LIVE_PATH + item.path;
                this.ophan = OPHAN_PATH + item.path;
            }
        }
    }

    class ContentItemView {
        constructor(item) {
            this.update(item);
        }

        update(item) {

            // TODO: Stubs have a different structure to content items

            this.id = item.id || item.stubId;
            this.composerId = item.composerId;

            this.headline = item.headline;
            this.workingTitle = item.workingTitle || item.title;

            this.priority = getPriorityString(item.priority);
            this.priorityTitle = toTitleCase(this.priority);

            this.hasComments = !!item.commentable;
            this.commentsTitle = this.hasComments ? 'on' : 'off';

            // TODO: pull main image from composer
            this.hasMainImage = false;
            this.mainImageTitle = 'Main image (Coming soon)';

            this.assignee = item.assignee && toInitials(item.assignee) || '';
            this.assigneeFull = item.assignee || 'unassigned';

            this.contentType = item.contentType;
            this.contentTypeTitle = toTitleCase(item.contentType);
            this.office = item.prodOffice;
            this.officeTitle = getFullOfficeString(item.prodOffice);

            this.status = item.status || 'Stub';
            this.statusValues = this.status === 'Stub' ? newslistStatusValues : contentStatusValues;

            this.section = item.section;
            this.needsLegal = item.needsLegal;
            this.note = item.note;

            // TODO: Decide if this is due or deadline
            this.deadline = item.due;
            this.created = item.createdAt;
            this.lastModified = item.lastModified;

            this.isPublished = item.published;
            this.publishedState = item.published ? 'Published' : ''; // TODO: Taken down, Embargoed
            this.publishedTime = item.timePublished;

            this.links = new ContentItemLinks(item);
            this.path = item.path;

            this.item = item;
        }
    }

    this.parse = function(item) {
        return new ContentItemView(item);
    };
}



function wfContentListController($scope, $log, statuses, wfContentService, wfContentPollingService, wfContentItemParser) {

    /*jshint validthis:true */

    this.showHeadline = false;

    this.newItem = function () {
        $scope.$emit('stub:create');
    };

    this.importItem = function () {
        $scope.$emit('content:import');
    };

    this.editItem = (contentItem) => {
        var prefix = (contentItem.status === 'stub') ? 'stub' : 'content';
        $scope.$emit(prefix + ':edit', contentItem.item);
    };

    this.legalValues = [
        { name: '', value: 'NA' },
        { name: 'Check it', value: 'REQUIRED' },
        { name: 'Approved', value: 'COMPLETE'}
    ];


    this.render = (response) => {
        var data = response.data;

        // TODO stubs and content are separate structures in the API response
        //      make this a single list of content with consistent structure in the API
        var content = data.stubs.concat(data.content).map(wfContentItemParser.parse),
            grouped = _groupBy(content, 'status');

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

        // update selectedItem as objects are now !==
        if (this.selectedItem) {
            this.selectedItem = _find(content, { id: this.selectedItem.id });
        }

        $scope.refreshContentError = false;

        $scope.$apply();
    };


    this.renderError = (err) => {
        $log.error('Error rendering content: ' + (err.message || JSON.stringify(err)));
        $scope.refreshContentError = err;

        $scope.$apply();
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
                this.renderError(err);
            });
        }

    });


    // Start polling
    var poller = this.poller = new wfContentPollingService(function () {
        return wfContentService.getServerParams();
    });

    poller.onPoll(this.render);
    poller.onError(this.renderError);

    poller.startPolling();

    $scope.$on('destroy', function () {
        poller.stopPolling();
    });


    // TODO: use more specific event names to trigger a refresh, eg: filterChanged, contentImported
    $scope.$on('getContent', this.poller.refresh.bind(this.poller));
}

/**
 * Attribute directive: wf-content-item-update-action
 *
 * Listens to when an ng-model changes on the same control, then
 * emits the action as an event to be captured in a controller elsewhere.
 */
function wfContentItemUpdateActionDirective() {
    return {
        restrict: 'A',
        require: 'ngModel',
        link: ($scope, $element, $attrs, ngModel) => {

            var oldModelValue;

            var $setter = ngModel.$setViewValue;
            ngModel.$setViewValue = function() {
                oldModelValue = ngModel.$modelValue;
                $setter.apply(this, arguments);
            };

            ngModel.$viewChangeListeners.push(() => {
                var field = $attrs.wfContentItemUpdateAction;

                var msg = {
                    contentItem: $scope.contentItem,
                    data: {},
                    oldValues: {},
                    source: ngModel
                };

                msg.data[field] = ngModel.$modelValue;
                msg.oldValues[field] = oldModelValue;

                $scope.$emit('contentItem.update', msg);
            });

        }
    };
}
