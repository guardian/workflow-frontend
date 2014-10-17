
'use strict';

import angular from 'angular';
import _groupBy from 'lodash/modern/collections/groupBy';
import _find from 'lodash/modern/collections/find';

import 'lib/content-service';
import 'lib/date-service';
import 'lib/presence';
import 'lib/prodoffice-service';
import { wfContentListItem, wfContentItemParser, wfContentItemUpdateActionDirective } from 'components/content-list-item/content-list-item';
import { wfContentListDrawer } from 'components/content-list-drawer/content-list-drawer';


angular.module('wfContentList', ['wfContentService', 'wfDateService', 'wfProdOfficeService', 'wfPresenceService'])
    .service('wfContentItemParser', ['config', 'statuses', 'wfLocaliseDateTimeFilter', 'wfFormatDateTimeFilter', wfContentItemParser])
    .controller('wfContentListController', ['$scope', '$log', 'statuses', 'wfContentService', 'wfContentPollingService', 'wfContentItemParser', 'wfPresenceService', wfContentListController])
    .directive('wfContentItemUpdateAction', wfContentItemUpdateActionDirective)
    .directive('wfContentListItem', ['$rootScope', wfContentListItem])
    .directive('wfContentListDrawer', ['$rootScope', 'config', '$timeout', '$window', 'wfContentService', 'wfProdOfficeService', wfContentListDrawer]);


function wfContentListController($scope, $log, statuses, wfContentService, wfContentPollingService, wfContentItemParser, wfPresenceService) {

    /*jshint validthis:true */

    this.showHeadline = false;

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


    // Watch composer contentIds for Presence
    $scope.$watch('contentIds', (newIds, oldIds) => {
        if (newIds !== oldIds) {  // guards against initial render when newIds === oldIds === undefined
            wfPresenceService.subscribe(newIds);
        }
    }, true);


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

        $scope.contentIds = data.content.map((content) => content.composerId);

        // update selectedItem as objects are now !==
        if (this.selectedItem) {
            this.selectedItem = _find(content, { id: this.selectedItem.id });
        }

        $scope.refreshContentError = false;

        $scope.$emit('content.render', $scope.content);

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
