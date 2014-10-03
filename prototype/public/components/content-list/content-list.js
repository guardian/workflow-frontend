
'use strict';

import angular from 'angular';
import _ from 'lodash';

import 'lib/content-service';
import 'lib/date-service';

// Groupby
// sort by

var OPHAN_PATH = 'http://dashboard.ophan.co.uk/summary?path=',
    PREVIEW_PATH = 'http://preview.gutools.co.uk/global/',
    LIVE_PATH = 'http://www.theguardian.com/';


angular.module('wfContentList', ['wfContentService', 'wfDateService'])
    .service('wfContentItemParser', ['config', 'wfLocaliseDateTimeFilter', 'wfFormatDateTimeFilter', wfContentItemParser])
    .controller('wfContentListController', ['$scope', 'statuses', 'wfContentService', 'wfContentItemParser', wfContentListController])



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

            this.headline = item.headline;
            this.workingTitle = item.workingTitle || item.title;

            this.priority = getPriorityString(item.priority);
            this.priorityTitle = toTitleCase(this.priority);

            this.comments = item.commentable ? 'active' : 'inactive';

            // TODO: pull main image from composer
            this.mainImage = false ? 'active' : 'inactive';

            this.asignee = item.asignee;
            this.contentType = item.contentType;
            this.contentTypeTitle = toTitleCase(item.contentType);
            this.status = item.status || 'stub';
            this.section = item.section;
            this.needsLegal = item.needsLegal;
            this.note = item.note;

            // TODO date formatting / localisation
            this.deadline = formatAndLocaliseDate(item.due, 'ddd DD MMM HH:mm');
            this.deadlineFull = formatAndLocaliseDate(item.due, 'long');
            this.created = formatAndLocaliseDate(item.createdAt, 'ddd DD MMM HH:mm');
            this.createdFull = formatAndLocaliseDate(item.createdAt, 'long');

            this.publishedState = item.published ? 'Published' : '';
            this.publishedTime = item.timePublished && item.timePublished

            this.links = new ContentItemLinks(item);
            this.item = item;
        }
    }

    this.parse = function(item) {
        return new ContentItemView(item);
    };
}



function wfContentListController($scope, statuses, wfContentService, wfContentItemParser) {

    $scope.statusValues = statuses;

    this.showHeadline = false;

    this.legalValues = [
        { name: '', value: 'NA' },
        { name: 'Check it', value: 'REQUIRED' },
        { name: 'Approved', value: 'COMPLETE'}
    ];

    var params = wfContentService.getServerParams();
    wfContentService.get(params).then(function (data) {

        // TODO stubs and content are separate structures in the API response
        //      make this a single list of content with consistent structure in the API
        var content = data.stubs.concat(data.content).map(wfContentItemParser.parse);



        var grouped = _.groupBy(content, 'status');
        $scope.content = ['stub'].concat(statuses).map(function(status) {
            // TODO: status is currently stored as presentation text, eg: "Writers"
            //       should be stored as an enum and transformed to presentation text
            //       here in the front-end
            return {
                name: status,
                title: status == 'stub' ? 'Newslist' : status,
                items: grouped[status]
            };
        });
    });
}

/*
    var getContent = function (evt, params) {
        var params = wfContentService.getServerParams();
        wfContentService.get(params).then(function (response) {
            updateScopeModels(response);
        });
    };

    function updateScopeModels(data) {
        $scope.contentItems = data.content;
        $scope.stubs = data.stubs;
        $scope.contentByStatus = groupByStatus(data.content);

        if ($scope.selectedContent) {
            var found = _.findWhere(data.content, { composerId: $scope.selectedContent.composerId });

            // found will be undefined when not found -> when something is deleted.
            $scope.selectedContent = found;
        }

        $scope.$apply();
    }
*/
/*
    // Poll for updates
    var poller = new wfContentPollingService(function () {
        return wfContentService.getServerParams()
    });

    poller.onPoll(updateScopeModels);

    poller.startPolling();

    $scope.$on('destroy', function () {
        poller.stopPolling();
    });

    // end polling logic
*/
