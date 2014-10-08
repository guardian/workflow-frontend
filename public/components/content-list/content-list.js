
'use strict';

import angular from 'angular';
import groupBy from 'lodash/modern/collections/groupBy';

import 'lib/content-service';
import 'lib/date-service';

// Groupby
// sort by

var OPHAN_PATH = 'http://dashboard.ophan.co.uk/summary?path=',
    PREVIEW_PATH = 'http://preview.gutools.co.uk/global/',
    LIVE_PATH = 'http://www.theguardian.com/';


angular.module('wfContentList', ['wfContentService', 'wfDateService'])
    .service('wfContentItemParser', ['config', 'wfLocaliseDateTimeFilter', 'wfFormatDateTimeFilter', wfContentItemParser])
    .controller('wfContentListController', ['$scope', 'statuses', 'wfContentService', 'wfContentPollingService', 'wfContentItemParser', wfContentListController])
    .directive('wfContentItemUpdateAction', wfContentItemUpdateActionDirective);


function wfContentItemParser(config, wfLocaliseDateTimeFilter, wfFormatDateTimeFilter) {
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

    class ContentItemLinks {
        constructor(item) {
            if (item.composerId) {
                this.composer = config.composerViewContent + '/' + item.composerId;
                this.preview = PREVIEW_PATH + item.composerId;
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

            this.hasComments = item.commentable;
            this.commentsTitle = item.commentable ? 'on' : 'off';

            // TODO: pull main image from composer
            this.hasMainImage = false;
            this.mainImageTitle = 'Main image (Coming soon)';

            this.assignee = item.assignee;
            this.contentType = item.contentType;
            this.contentTypeTitle = toTitleCase(item.contentType);
            this.office = item.prodOffice;
            this.officeTitle = getFullOfficeString(item.prodOffice);
            this.status = item.status || 'stub';
            this.section = item.section;
            this.needsLegal = item.needsLegal;
            this.note = item.note;

            // TODO date formatting / localisation
            this.deadline = formatAndLocaliseDate(item.due, 'ddd DD MMM HH:mm');
            this.deadlineFull = formatAndLocaliseDate(item.due, 'long');
            this.created = formatAndLocaliseDate(item.createdAt, 'ddd DD MMM HH:mm');
            this.createdFull = formatAndLocaliseDate(item.createdAt, 'long');

            this.isPublished = item.published;
            this.publishedState = item.published ? 'Published' : '';
            this.publishedTime = item.timePublished && formatAndLocaliseDate(item.timePublished, 'ddd DD MMM HH:mm');

            this.links = new ContentItemLinks(item);
            this.item = item;
        }
    }

    this.parse = function(item) {
        return new ContentItemView(item);
    };
}



function wfContentListController($scope, statuses, wfContentService, wfContentPollingService, wfContentItemParser) {

    $scope.statusValues = statuses;

    this.showHeadline = false;

    this.legalValues = [
        { name: '', value: 'NA' },
        { name: 'Check it', value: 'REQUIRED' },
        { name: 'Approved', value: 'COMPLETE'}
    ];

    this.selectItem = (contentItem) => {
        this.selectedItem = contentItem;
    };


    this.render = (response) => {
        var data = response.data;

        // TODO stubs and content are separate structures in the API response
        //      make this a single list of content with consistent structure in the API
        var content = data.stubs.concat(data.content).map(wfContentItemParser.parse),
            grouped = groupBy(content, 'status');

        $scope.content = ['stub'].concat(statuses).map((status) => {
            // TODO: status is currently stored as presentation text, eg: "Writers"
            //       should be stored as an enum and transformed to presentation text
            //       here in the front-end
            return {
                name: status.toLowerCase(),
                title: status == 'stub' ? 'Newslist' : status,
                items: grouped[status]
            };
        });

        $scope.refreshContentError = false;

        $scope.$apply();
    };


    this.renderError = (err) => {
        $scope.refreshContentError = err;

        $scope.$apply();
    };


    $scope.$on('contentItem.update', ($event, msg) => {

        // generally there'll only be one field to update, but iterate just incase
        // TODO: if multiple fields need updating, do it in a single API call
        for (var field in msg.data) {
            wfContentService.updateField(msg.contentItem, field, msg.data[field]).then(() => {
                $scope.$emit('contentItem.updated', {
                    'contentItem': msg.contentItem,
                    'field': field
                });

                this.poller.refresh();
            });
        }

    });


    // Start polling
    var poller = this.poller = new wfContentPollingService(function () {
        return wfContentService.getServerParams()
    });

    poller.onPoll(this.render);
    poller.onError(this.renderError);

    poller.startPolling();

    $scope.$on('destroy', function () {
        poller.stopPolling();
    });

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

            ngModel.$viewChangeListeners.push(() => {

                var field = $attrs.wfContentItemUpdateAction;

                var msg = {
                    contentItem: $scope.contentItem,
                    data: {
                        [ field ]: ngModel.$modelValue
                    },
                    source: ngModel
                };

                $scope.$emit('contentItem.update', msg);
            });

        }
    };
}
