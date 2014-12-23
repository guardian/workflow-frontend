
var OPHAN_PATH = 'http://dashboard.ophan.co.uk/summary?path=/',
    PREVIEW_PATH = 'http://preview.gutools.co.uk/',
    LIVE_PATH = 'http://www.theguardian.com/';

function wfContentItemParser(config, statuses, wfLocaliseDateTimeFilter, wfFormatDateTimeFilter, sections) {
    /*jshint validthis:true */

    function formatAndLocaliseDate(dateValue, dateFormat) {
        return wfFormatDateTimeFilter(wfLocaliseDateTimeFilter(dateValue), dateFormat);
    }

    function getFullOfficeString(office) {
        var offices = {
            'AU': 'Australia',
            'US': 'United States of America',
            'UK': 'United Kingdom'
        };

        return offices[office];
    }

    function toTitleCase(str) {
        return str.replace(/\b\w/g, function (txt) { return txt.toUpperCase(); });
    }

    function toInitials(str) {
        if (str.length <= 3) { return str; }
        var initials = str.match(/\b(\w)/g).join('');

        // If we have more than 3 initials choose the first 2 and the last
        if (initials.length > 3) { initials = initials.slice(0,2) + initials.slice(-1); }

        return initials;
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

            this.priority = item.priority;

            this.hasComments = !!item.commentable;
            this.commentsTitle = this.hasComments ? 'on' : 'off';

            // TODO: pull main image from composer
            this.hasMainImage = Boolean(item.mainMedia);
            this.mainImageTitle = 'Main media (' + (item.mainMedia || 'none')  + ')';

            this.assignee = item.assignee && toInitials(item.assignee) || '';
            this.assigneeFull = item.assignee || 'unassigned';

            this.contentType = item.contentType;
            this.contentTypeTitle = toTitleCase(item.contentType);
            this.office = item.prodOffice;
            this.officeTitle = getFullOfficeString(item.prodOffice);

            this.status = item.status || 'Stub';
            this.statusValues = this.status === 'Stub' ? newslistStatusValues : contentStatusValues;

            item.section = sections.filter((section) => section.name === item.section)[0]; // Get section object
            this.section = item.section;
            this.needsLegal = item.needsLegal;
            this.note = item.note;

            // TODO: Decide if this is due or deadline
            this.deadline = item.due;
            this.created = item.createdAt;
            this.lastModified = item.lastModified;
            this.lastModifiedBy = item.lastModifiedBy;

            this.isTakenDown = item.takenDown;
            this.isPublished = item.published;

            var lifecycleState = this.lifecycleState(item);
            this.lifecycleState = lifecycleState.display;
            this.lifecycleStateTime = lifecycleState.time;

            this.links = new ContentItemLinks(item);
            this.path = item.path;

            this.isOwnedByInCopy = item.activeInInCopy;
            this.storyBundleId = item.storyBundleId;
            /* it may be linked with InCopy but owned by composer */
            this.linkedWithIncopy = (typeof item.storyBundleId === "string" &&
                                     item.storyBundleId.length > 0);
            this.incopyTitle = this.linkedWithIncopy ?
                'Linked with InCopy Story Bundle ' + this.storyBundleId :
                'Not linked with InCopy';

            this.item = item;
        }

        lifecycleState(item) {
            // Highest priority at the top!
            var states = [
                { "display": "Taken down", "active": item.takenDown, "time": item.timeTakenDown},
                { "display": "Embargoed", "active": false, "time": undefined },
                { "display": "Published", "active": item.published, "time": item.timePublished},
                { "display": "", "active": true, "time": undefined} // Base state
            ]

            return (states.filter(function(o) { return o.active === true; })[0]);
        }
    }

    this.parse = function(item) {
        return new ContentItemView(item);
    };
}


/**
 * Directive allowing the contentListItems to interact with the details drawer
 * @param $rootScope
 */
var wfContentListItem = function ($rootScope, $q, $compile, $http, $templateCache, wfColumnService) {
    return {
        restrict: 'A',
        templateUrl: '/assets/components/content-list-item/content-list-item-container.html',
        scope: {
            contentItem: '=',
            contentList: '=',
            legalValues: '=',
            statusValues: '='
        },
        link: function ($scope, elem, attrs) {

            wfColumnService.getColumns().then((data) => {
                $scope.columns = data;
                renderColumns();
            });

            function renderColumns () {


                var columns = [{
                    templateUrl: '/assets/components/content-list-item/content-list-item-start.html',
                    active: true
                }].concat(
                    $scope.columns,
                    [{
                        templateUrl: '/assets/components/content-list-item/content-list-item-end.html',
                        active: true
                    }]
                );

                var promises = columns.map((col) => {

                    return $http.get(col.templateUrl, {cache: $templateCache}).success((html) => {

                        if (col.active) {
                            columns[columns.indexOf(col)] = html; // ensure that ajax request results returning at any time and inserted in the correct order
                        } else { // nasty...
                            columns[columns.indexOf(col)] = '';
                        }
                    });
                });

                $q.all(promises).then(() => {
                    var compiled = $compile(columns.join(''))($scope);
                    elem.empty().append(compiled);
                });
            }

            $rootScope.$on('contentItem.columnsChanged', renderColumns);

            /**
             * Emit an event telling the details drawer to move itself to this element, update and display.
             * @param {Object} contentItem - this contentItem
             */
            $scope.selectItem = (contentItem) => {

                $rootScope.$emit('contentItem.select', contentItem, elem);
            };

        }
    };
};


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

function wfGetPriorityStringFilter () {
    return function (priorityValue) {
        if (priorityValue == 1) {
            return "urgent";
        } else if (priorityValue == 2) {
            return "very-urgent";
        }
        return "normal";
    };
}

export { wfContentListItem, wfContentItemParser, wfContentItemUpdateActionDirective, wfGetPriorityStringFilter };
