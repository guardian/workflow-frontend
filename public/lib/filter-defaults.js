/**
 * This returned array represents the default configuration of the sidebar filters list.
 * This is used by the components/sidebar-filter/sidebar-filter.js directive.
 * The function wrapping allows the injection of local dependencies for custom link functions.
 *
 * @type {
 *      title: String, // the displayed title in the html
 *      namespace: String, // internal reference to filter that matches with the API naming
 *      listIsOpen: Boolean, // Should the list iteam be displayed as open or closed
 *      multi: Boolean, // Should the list be an AND filter rather than an OR filter
 *      filterOptions: [
 *          {
 *              caption: String, // The display title for this option
 *              value: String, // The internal value for this option
 *              icon: String, // Optional classname of the required icon for this option
 *              url: String // Optional custom template url for this filter option
 *          }
 *      ],
 *      customLinkFunction: Function // A function to be run during the linking phase of the angular directive execution. Dependencies for this function will be resolved angular style during execution.
 * }
 */

var filterDefaults = function (statuses, wfFiltersService) {

    return [
        {
            title: 'Status',
            namespace: 'status',
            listIsOpen: true,
            multi: true,
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
            listIsOpen: false,
            multi: true,
            filterOptions: [
                { caption: 'Article', value: 'article', icon: 'article' },
                { caption: 'Liveblog', value: 'liveblog', icon: 'liveblog' },
                { caption: 'Gallery', value: 'gallery', icon: 'gallery' },
                { caption: 'Picture', value: 'picture', icon: 'picture' },
                { caption: 'Interactive', value: 'interactive', icon: 'interactive' }
            ]
        },
        {
            title: 'Created',
            namespace: 'created',
            listIsOpen: false,
            filterOptions: [
                { caption: 'Yesterday', value: 'yesterday' },
                { caption: 'Today', value: 'today' },
                { caption: 'Last 24 hours', value: 'last24' },
                { caption: 'Last 48 hours', value: 'last48' }
            ]
        },
        {
            title: 'State',
            namespace: 'state',
            listIsOpen: false,
            multi: true,
            filterOptions: [
                { caption: 'Draft', value: 'draft' },
                { caption: 'Published', value: 'published' },
                { caption: 'Taken down', value: 'takendown' },
                { caption: 'Scheduled', value: 'scheduled' },
                { caption: 'Embargoed', value: 'embargoed' }
            ]
        },
        {
            title: 'Assignment',
            namespace: 'assigneeEmail',
            listIsOpen: false,
            multi: false,
            filterOptions: [
                { caption: 'Assigned to me', value: _wfConfig.user.email }
            ]
        },
        {
            title: 'Flags',
            namespace: 'flags',
            listIsOpen: false,
            multi: true,
            filterOptions: [
                { caption: 'Needs legal', value: 'needsLegal' },
                { caption: 'Legal approved', value: 'approved' }
            ]
        },
        {
            title: 'Deadline',
            namespace: 'selectedDate',
            listIsOpen: false,
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

            /**
             * Custom linking function that enables the use of a date dropdown for a filter option
             */
            customLinkFunction: ['wfDateParser', '$scope', (wfDateParser, $scope) => {

                $scope.dateOptions = wfDateParser.getDaysThisWeek();
                var selectedDate = wfFiltersService.get('selectedDate');

                // ensure that the date from the URL is the same object as the
                // one used in the Select drop-down, as its compared with ===
                $scope.dateOptions.forEach(function (date) {
                    if (date.isSame(selectedDate)) {
                        selectedDate = date;
                        $scope.selectFilter('customDate');
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
                            $scope.selectFilter('customDate');
                        } else {
                            $scope.selectedFilters = [];
                        }
                    }
                });
            }]
        },
        {
            title: 'InCopy',
            namespace: 'incopy',
            listIsOpen: false,
            multi: false,
            filterOptions: [
                { caption: 'In InCopy', value: 'true' },
                { caption: 'Not in InCopy', value: 'false' }
            ]
        }
    ];
};

export { filterDefaults }
