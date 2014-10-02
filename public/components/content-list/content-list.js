
'use strict';

import angular from 'angular';
import _ from 'lodash';

import 'lib/content-service';
import 'lib/date-service';

// Groupby
// sort by

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

    class ContentItemLinks {
        constructor(item) {
            if (item.composerId) {
                this.viewInComposer = config.composerViewContent + '/' + item.composerId;
            }
        }
    }

    class ContentItemView {
        constructor(item) {
            this.update(item);
        }

        update(item) {
            this.id = item.id || item.stubId;

            this.headline = item.headline;
            this.workingTitle = item.workingTitle;

            this.priority = getPriorityString(item.priority);
            this.comments = item.commentable ? 'active' : 'inactive';

            // TODO: pull main image from composer
            this.mainImage = false ? 'active' : 'inactive';

            this.asignee = item.asignee;
            this.contentType = item.contentType;
            this.status = item.status;
            this.section = item.section;
            this.needsLegal = item.needsLegal;

            // TODO date formatting / localisation
            this.deadline = formatAndLocaliseDate(item.due, 'ddd DD MMM HH:mm');
            this.deadlineFull = formatAndLocaliseDate(item.due, 'long');
            this.created = formatAndLocaliseDate(item.createdAt, 'ddd DD MMM HH:mm');
            this.createdFull = formatAndLocaliseDate(item.createdAt, 'long');

            this.publishedState = item.published ? 'Published' : 'Draft';
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
    console.log('wfContentListController!');

    $scope.statusValues = statuses;

    $scope.showHeadline = false;

    var params = wfContentService.getServerParams();
    wfContentService.get(params).then(function (data) {
        console.log('wfContentItemParser.parse', wfContentItemParser, wfContentItemParser.parse);
        var content = data.content.map(wfContentItemParser.parse);
        console.log('content', content);
        var grouped = _.groupBy(content, 'status');
        $scope.content = statuses.map(function(status) { return { name: status, items: grouped[status]}; });
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
