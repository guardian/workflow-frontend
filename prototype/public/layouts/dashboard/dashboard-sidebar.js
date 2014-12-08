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
                title: 'Created',
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
            },
            {
                title: 'Deadline',
                namespace: 'deadline',
                filterOptions: [
                    { caption: 'Today', value: 'today' },
                    { caption: 'Tomorrow', value: 'tomorrow' },
                    { caption: 'This weekend', value: 'weekend' },
                    {
                        caption: 'Choose date',
                        value: 'customDate',
                        url: '/assets/components/sidebar-filter/custom-filter-templates/deadline-date-select.html'
                    }
                ],
                customLinkFunction: ['wfDateParser', '$scope', (wfDateParser, $scope) => {

                    $scope.dateOptions = wfDateParser.getDaysThisWeek();
                    var selectedDate = wfFiltersService.get('selectedDate');

                    // ensure that the date from the URL is the same object as the
                    // one used in the Select drop-down, as its compared with ===
                    $scope.dateOptions.forEach(function (date) {
                        if (date.isSame(selectedDate)) {
                            selectedDate = date;
                            $scope.selectedFilter = 'customDate';
                        }
                    });

                    $scope.select = { // Angular weirdness
                        selectedDate: selectedDate
                    };

                    $scope.deadlineSelectActive = function () {
                        return $scope.select.selectedDate && typeof($scope.select.selectedDate) != 'string' && $scope.selectedFilter === 'customDate';
                    };

                    $scope.$watch('select.selectedDate', function (newValue, oldValue) {
                        if (newValue !== oldValue) {  // Prevents fire change event on init
                            $scope.$emit('filtersChanged.deadline', $scope.select.selectedDate);
                            if (newValue !== null) {
                                $scope.selectedFilter = 'customDate';
                            } else {
                                $scope.selectedFilter = newValue;
                            }

                        }
                    });
                }]
            }
        ];
    }]);
