
var OPHAN_PATH = 'https://dashboard.ophan.co.uk/summary?path=/',
    LIVE_PATH = 'http://www.theguardian.com/';

function wfContentItemParser(config, statusLabels, sections) {
    /*jshint validthis:true */

    function getFullOfficeString(office) {
        var offices = {
            'AU': 'Australia',
            'US': 'United States of America',
            'UK': 'United Kingdom'
        };

        return offices[office];
    }

    function getViewerURL(path, isLive) {
        return config.viewerUrl + '/' + (isLive ? 'live' : 'preview') + '/' + path;
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

    function getCommissioningDeskNames(commissioningDeskIdString) {
        if (typeof commissioningDeskIdString === 'string' && !(/[a-z]/i.test(commissioningDeskIdString))) {
            var commissioningDeskIds = commissioningDeskIdString.split(",");
            return commissioningDeskIds.map((id) => {
                return _wfConfig.commissioningDesks.filter(desk => desk.id === id.toNumber())[0];
            });
        } else {
            return [];
        }
    }

    var contentStatusValues = statusLabels.filter((status) => status.value !== 'Stub');

    class ContentItemLinks {
        constructor(item) {
            if (item.composerId) {
                this.composer = `${config.composerViewContent}/${item.composerId}`;
            }
            if (item.contentType == "media" && item.editorId) {
                this.mediaAtomMaker = `${config.mediaAtomMakerViewAtom}${item.editorId}`;
                this.editor = this.mediaAtomMaker;
            }
            if (item.path) {
                this.preview = getViewerURL(item.path);
            }
            if (item.published && item.path) {
                this.live = LIVE_PATH + item.path;
                this.ophan = OPHAN_PATH + item.path;
            }
            if (item.contentType === 'media') {
                this.editor = `${config.mediaAtomMakerViewAtom}${item.editorId}`
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
            this.editorId = item.editorId;
            this.wordCount = item.wordCount;

            this.headline = item.headline;
            this.standfirst = stripHtml(item.standfirst);
            this.workingTitle = item.workingTitle || item.title;

            this.priority = item.priority;

            this.hasComments = !!(item.commentable);
            this.commentsTitle = this.hasComments ? 'on' : 'off';

            this.hasMainMedia = !!(item.hasMainMedia)

            // Currently we don't pull in any preview information about non-image main media
            this.mainMediaNoPreview = this.mainMediaType && this.mainMediaType != 'image';

            this.trailtext = stripHtml(item.trailtext);
            this.trailImageUrl = item.trailImageUrl;

            this.assignee = item.assignee;
            this.assigneeEmail = item.assigneeEmail;
            this.assigneeInitials = item.assignee && toInitials(item.assignee);

            this.contentType = item.contentType;
            this.contentTypeTitle = toTitleCase(item.contentType);
            this.office = item.prodOffice;
            this.officeTitle = getFullOfficeString(item.prodOffice);

            this.status = item.status || 'Stub';
            this.statusValues = this.status === 'Stub' ? statusLabels : contentStatusValues;

            item.section = sections.filter((section) => section.name === item.section)[0]; // Get section object
            this.section = item.section;
            this.needsLegal = item.needsLegal;
            this.note = item.note;

            this.commissioningDesks = getCommissioningDeskNames(item.commissioningDesks);

            // TODO: Decide if this is due or deadline
            this.deadline = item.due;
            this.created = item.createdAt;
            this.lastModified = item.lastModified;
            this.lastModifiedBy = item.lastModifiedBy;
            this.firstPublished = item.timePublished;

            this.hasEmbargoedDate =
                    item.embargoedUntil &&
                    new Date(item.embargoedUntil).getTime() > (new Date()).getTime();

            this.isTakenDown = item.takenDown;
            this.isPublished = item.published;
            this.isEmbargoed = this.hasEmbargoedDate || item.embargoedIndefinitely;
            this.isScheduled = Boolean(item.scheduledLaunchDate);

            var lifecycleState      = this.lifecycleState(item);
            this.lifecycleState     = lifecycleState.display;
            this.lifecycleStateKey  = lifecycleState.key;
            this.lifecycleStateSupl = lifecycleState.supl;
            this.lifecycleStateSuplDate = lifecycleState.suplDate;

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

            this.optimisedForWeb = !!(item.optimisedForWeb);
            this.optimisedForWebChanged = !!(item.optimisedForWebChanged);
            this.sensitive = !!(item.sensitive);
            this.legallySensitive = !!(item.legallySensitive);

            if (this.optimisedForWebChanged) {
                this.optimisedForWebTitle = 'Content has been modified since being optimised'
            } else {
                this.optimisedForWebTitle = this.optimisedForWeb ? 'Optimised for web' : 'Not optimised for web';
            }
            this.sensitiveTitle = 'This content features children, vulnerable people, or is on a topic that is likely to attract online abuse.';
            this.legallySensitiveTitle = 'This content involves active criminal proceedings.';

            this.item = item;
        }

        lifecycleState(item) {
            // Highest priority at the top!

            var states = [
                { "display": "Published", "key": "published", "active": item.published && !item.takenDown, "suplDate": item.timePublished },
                {
                    "display": "Embargoed",
                    "key": "embargoed",
                    "active": this.isEmbargoed,
                    "supl": item.embargoedIndefinitely ? "Indefinitely" : undefined,
                    "suplDate": this.hasEmbargoedDate ? item.embargoedUntil : undefined
                },
                { "display": "Scheduled", "key": "scheduled", "active": this.isScheduled, "suplDate": item.scheduledLaunchDate },
                { "display": "Taken down", "key": "takendown", "active": item.takenDown, "suplDate": item.timeTakenDown },
                { "display": "", "key": "draft", "active": true } // Base state
            ];

            return states.filter((o) => { return o.active === true; })[0];
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
var wfContentListItem = function ($rootScope, statuses, legalValues, sections) {
    return {
        restrict: 'A',
        template: (tElement, tAttrs) => {

            return $rootScope.contentItemTemplate;
        },
        scope: {
            contentItem: '=',
            contentList: '=',
            template: '='
        },
        controller: ($scope) => {
            $scope.statusValues = statuses;
            $scope.legalValues = legalValues;
            $scope.sections = sections;
        },
        link: function ($scope, elem, $attrs) {

            /**
             * Emit an event telling the details drawer to move itself to this element, update and display.
             * @param {Object} contentItem - this contentItem
             */
            elem.bind('click', () => {

                $rootScope.$emit('contentItem.select', $scope.contentItem, elem);
            });

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

function wfGetPriorityStringFilter (priorities) {
    return function (priorityValue) {
        return (priorities.filter((priority) => priority.value === priorityValue)[0].name).toLowerCase();
    };
}

export { wfContentListItem, wfContentItemParser, wfContentItemUpdateActionDirective, wfGetPriorityStringFilter };
