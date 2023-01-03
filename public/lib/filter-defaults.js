import moment from 'moment';

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
                    caption: status,
                    value: status
                };
            })
        },
        {
            title: 'Your Content',
            listIsOpen: false,
            individualNamespaces: true,
            multi: true,
            filterOptions: [
                { caption: 'Assigned to you', value: _wfConfig.user.email, namespace: 'assigneeEmail' },
                { caption: 'Edited by you', value: _wfConfig.user.email, namespace: 'touched' }
            ]
        },
        {
            title: 'Content type',
            namespace: 'content-type',
            listIsOpen: false,
            multi: true,
            filterOptions: [
                { caption: 'Article', value: 'article', icon: 'article' },
                { caption: 'Gallery', value: 'gallery', icon: 'gallery' },
                { caption: 'Interactive', value: 'interactive', icon: 'interactive' },
                { caption: 'Liveblog', value: 'liveblog', icon: 'liveblog' },
                { caption: 'Picture', value: 'picture', icon: 'picture' },
                { caption: 'Video', value: 'video,media', icon: 'video' },
                { caption: 'Audio', value: 'audio', icon: 'audio' }
            ]
        },
        {
            title: 'Atom type',
            namespace: 'atom-type',
            listIsOpen: false,
            multi: true,
            filterOptions: [
                { caption: 'Media', value: 'media', icon: 'media' },
                { caption: 'Charts', value: 'chart', icon: 'chart' }
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
            multi: false,
            filterOptions: [
                { caption: 'Draft', value: 'draft' },
                { caption: 'Published', value: 'published' },
                { caption: 'Taken down', value: 'takendown' },
                { caption: 'Scheduled', value: 'scheduled' },
                { caption: 'Embargoed', value: 'embargoed' }
            ]
        },
        {
            title: 'Flags',
            namespace: 'flags',
            listIsOpen: false,
            multi: true,
            filterOptions: [
                { caption: 'Needs Legal', value: 'needsLegal' },
                { caption: 'Legal approved', value: 'legalApproved' },
                { caption: 'Needs Picture Desk', value: 'needsPictureDesk' },
                { caption: 'Picture Desk checked', value: 'pictureDeskChecked' }
            ]
        },
        {
            title: 'Deadline',
            namespace: 'deadline',
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
                const storedSelectedDate = wfFiltersService.get('deadline');
                const deadline = storedSelectedDate ? storedSelectedDate : '';

                // Can our deadline be parsed into a date?
                // If so, it's a custom date filter (rather than 'today', 'tomorrow' etc)
                const parsedDate = moment(deadline)
                if (parsedDate.isValid()) {
                    $scope.selectedFilters = ['customDate']
                }

                $scope.select = { // Angular weirdness
                    deadline: new Date(deadline)
                };

                $scope.deadlineSelectActive = function () {
                    return moment($scope.select.deadline).isValid();
                };

                $scope.$watch('select.deadline', function (newValue, oldValue) {
                    if (newValue !== oldValue && newValue) {  // Prevents fire change event on init
                        $scope.$emit('filtersChanged.deadline', $scope.select.deadline);
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
        },
        {
            title: 'Print Info',
            namespace: 'hasPrintInfo',
            listIsOpen: false,
            multi: false,
            filterOptions: [
                { caption: 'Has page number', value: 'true' },
                { caption: 'No page number', value: 'false' }
            ]
        },
        {
            title: 'Main Media',
            namespace: 'hasMainMedia',
            listIsOpen: false,
            multi: false,
            filterOptions: [
                { caption: 'Has Main Media', value: 'true' },
                { caption: 'No Main Media', value: 'false' }
            ]
        },
        {
            title: 'Syndication',
            namespace: 'hasAnyRights',
            listIsOpen: false,
            multi: false,
            filterOptions: [
                { caption: 'Has rights set', value: 'true' },
                { caption: 'No rights set', value: 'false' }
            ]
        },
        {
            title: 'Trashed',
            namespace: 'trashed',
            listIsOpen: false,
            multi: false,
            filterOptions: [
                { caption: 'Trashed', value: 'true' }
            ]
        } // When adding filters, please keep Trashed at the bottom per Mariana / Mateusz request
    ].filter(notEmpty);
};

function notEmpty(value) {
    return Object.keys(value).length !== 0;
}

export { filterDefaults }
