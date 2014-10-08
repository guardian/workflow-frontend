import angular from 'angular';

import 'lib/date-service';
import 'lib/filters-service';
import 'components/sidebar-filter/sidebar-filter';

angular.module('wfDashboardSidebar', ['wfFiltersService', 'wfSidebarFilter'])
    .controller('wfDashboardSidebarController', ['$scope', 'wfFiltersService', 'wfDateParser', 'prodOfficeService', 'sections', function ($scope, wfFiltersService, prodOfficeService, sections) {

        $scope.filters = [
            {
                title: 'Status',
                namespace: 'status',
                filterOptions: (function (s) {
                    return s.map(function (v, i) {
                        return {
                            caption: v,
                            value: v // TODO: normalise this to lower case...
                        };
                    });
                })($scope.statuses)
            },
            {
                title: 'Content',
                namespace: 'content-type',
                filterOptions: [
                    { caption: 'Article', value: 'article', icon: 'file' },
                    { caption: 'Liveblog', value: 'liveblog', icon: 'th-list' },
                    { caption: 'Gallery', value: 'gallery', icon: 'camera' },
                    { caption: 'Interactive', value: 'interactive', icon: 'hand-up' }
                ]
            },
            {
                title: 'Creation date',
                namespace: 'created',
                filterOptions: [
                    { caption: 'Yesterday', value: 'yesterday' },
                    { caption: 'Today', value: 'today' },
                    { caption: 'Last 24 Hours', value: 'last24' },
                    { caption: 'Last 48 Hours', value: 'last48' }
                ]
            },
            {
                title: 'State',
                namespace: 'state',
                filterOptions: [
                    { caption: 'Draft', value: 'draft' },
                    { caption: 'Published', value: 'published' }
                ]
            },
            {
                title: 'Flags',
                namespace: 'flags',
                filterOptions: [
                    { caption: 'Needs legal', value: 'needsLegal' }
                ]
            }
        ];
    }]);
