import angular from 'angular';

import 'lib/date-service';
import 'lib/filters-service';
import 'lib/prodoffice-service';
import 'components/location-picker/location-picker';
import 'components/sidebar-filter/sidebar-filter';

angular.module('wfDashboardSidebar', ['wfFiltersService', 'wfSidebarFilter', 'wfProdOfficeService', 'wfLocationPicker'])
    .controller('wfDashboardSidebarController', ['$scope', 'statuses', 'wfFiltersService', 'wfDateParser', 'wfProdOfficeService', 'sections', function ($scope, statuses, wfFiltersService, prodOfficeService, sections) {

        $scope.statuses = statuses;

        $scope.filters = [
            {
                title: 'Status',
                namespace: 'status',
                filterOptions: statuses.map((status) => {
                    return {
                        caption: status === 'Stub' ? 'News list' : status,
                        value: status
                    };
                })
            },
            {
                title: 'Content',
                namespace: 'content-type',
                filterOptions: [
                    { caption: 'Article', value: 'article', icon: 'article' },
                    { caption: 'Liveblog', value: 'liveblog', icon: 'liveblog' },
                    { caption: 'Gallery', value: 'gallery', icon: 'gallery' },
                    { caption: 'Interactive', value: 'interactive', icon: 'interactive' }
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
