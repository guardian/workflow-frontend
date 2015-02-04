
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

    function stripHtml(text) {
        return typeof(text) === 'string' ? text.replace(/<[^>]+>/gm, '') : '';
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
            this.wordCount = item.wordCount;

            this.headline = item.headline;
            this.standfirst = stripHtml(item.standfirst);
            this.workingTitle = item.workingTitle || item.title;

            this.priority = item.priority;

            this.hasComments = !!item.commentable;
            this.commentsTitle = this.hasComments ? 'on' : 'off';

            this.hasMainMedia = Boolean(item.mainMedia) && Boolean(item.mainMedia.mediaType);
            if(this.hasMainMedia) {
                this.mainMediaType    = item.mainMedia.mediaType;
                this.mainMediaTitle   = 'Main media (' + (item.mainMediaType || 'none')  + ')';
                this.mainMediaUrl     = item.mainMedia.url;
                this.mainMediaCaption = stripHtml(item.mainMedia.caption);
                this.mainMediaAltText = stripHtml(item.mainMedia.altText);
            }

            // Currently we don't pull in any preview information about non-image main media
            this.mainMediaNoPreview = this.mainMediaType && this.mainMediaType != 'image';

            this.trailtext = stripHtml(item.trailtext);
            this.trailImageUrl = item.trailImageUrl;

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

            this.launchScheduleDetails = item.launchScheduleDetails || {};

            this.hasEmbargoedDate =
                    this.launchScheduleDetails.embargoedUntil &&
                    this.launchScheduleDetails.embargoedUntil > (new Date()).getTime();

            this.embargoedText = (() => { if(this.launchScheduleDetails.embargoedIndefinitely) {
                    return "Indefinitely";
                } else if(this.hasEmbargoedDate) {
                    return wfFormatDateTimeFilter(
                        wfLocaliseDateTimeFilter(this.launchScheduleDetails.embargoedUntil)
                    );
                } else {
                    return "-";
                }
            })();

            this.isTakenDown = item.takenDown;
            this.isPublished = item.published;
            this.isEmbargoed = this.hasEmbargoedDate || this.launchScheduleDetails.embargoedIndefinitely;
            this.isScheduled = Boolean(this.launchScheduleDetails.scheduledLaunchDate);

            var lifecycleState      = this.lifecycleState(item);
            this.lifecycleState     = lifecycleState.display;
            this.lifecycleStateKey  = lifecycleState.key;
            this.lifecycleStateSupl = lifecycleState.supl();

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

            var dateFormatter = (date) => { return wfFormatDateTimeFilter(wfLocaliseDateTimeFilter(date), 'ddd DD MMM HH:mm'); }

            var states = [
               { "display": "Published", "key": "published", "active": item.published && !item.takenDown, "supl": () => {
                    return dateFormatter(item.timePublished); }
               },
               { "display": "Embargoed until", "key": "embargoed", "active": this.isEmbargoed, "supl": () => {
                    return this.embargoedText; }
                },
                { "display": "Scheduled", "key": "scheduled", "active": this.isScheduled, "supl": () => {
                    return dateFormatter(this.launchScheduleDetails.scheduledLaunchDate); }
                },
                { "display": "Taken down", "key": "takendown", "active": item.takenDown, "supl": () => {
                    return dateFormatter(item.timeTakenDown); }
                },
                { "display": "", "key": "draft", "active": true, "supl": () => { return false; } } // Base state
            ];

            return states.filter((o) => { return o.active === true; })[0];
        }
    }

    this.parse = function(item) {
        return new ContentItemView(item);
    };
}


var loadedColumns;

/**
 * Directive allowing the contentListItems to interact with the details drawer
 * @param $rootScope
 */
var wfContentListItem = function ($rootScope) {
    return {
        restrict: 'A',
        replace: true,
        template: (tElement, tAttrs) => {

            return $rootScope.contentItemTemplate;
        },
        scope: {
            contentItem: '=',
            contentList: '=',
            legalValues: '=',
            statusValues: '=',
            template: '='
        },
        link: function ($scope, elem, attrs) {

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
