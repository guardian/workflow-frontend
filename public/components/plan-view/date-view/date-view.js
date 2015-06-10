import _ from 'lodash';
import moment  from 'moment';

function withLocale(locale, f) {
    // can't find a way to create a new locale without
    // changing the global locale also
    var oldLocale = moment.locale();
    moment.locale(locale);
    var ret = f();
    moment.locale(oldLocale);
    return ret;
}

function wfDateView ($rootScope, $timeout, wfDayNoteService, wfPlannedItemService, wfFiltersService, $sce) {
    return {
        restrict: 'E',
        templateUrl: '/assets/components/plan-view/date-view/date-view.html',
        scope: {
            'newsList'      : '=newsList',
            'plannedItems'  : '=wfPlannedItems',
            'dateRange'     : '=wfDateViewDateRange',
            'onSelectDate'  : '&wfOnSelectDate',
            'selectedDate'  : '=wfSelectedDate'
        },
        controller: function ($scope) {

            withLocale("", function () {

                var calLocale = {
                    calendar : {
                        lastDay : '[Yesterday]',
                        sameDay : '[Today]',
                        nextDay : '[Tomorrow]',
                        lastWeek : '[Last] dddd',
                        nextWeek : 'dddd',
                        sameElse : 'DD/MM/YYYY'
                    }
                };
                moment.locale('wfPlan', calLocale);
            });

            function makeDateList() {

                return withLocale('wfPlan', () => {

                    let start = $scope.dateRange.startDate;

                    let dateList = [{
                        'date': start
                    }];

                    for (let i = 1; i <= $scope.dateRange.durationInDays; i++) {
                        dateList.push({
                            'date': start.clone().add(i, 'days')
                        });
                    }

                    return dateList;
                });
            }

            $scope.$watch('dateRange', (newValue, oldValue) => {
                if (newValue && newValue.startDate && newValue.endDate) {
                    $timeout(() => {
                        $scope.dateList = makeDateList();
                        if ($scope.newsList) {
                            buildDateListAndDayNotes()
                        }
                    });
                }
            }, true);

            $scope.$watch('newsList', () => {
                buildDateListFromDateRange()
            });

            $scope.showCopyToAgenda = true;

            function buildDateListFromDateRange() {
                if ($scope.dateRange && $scope.dateRange.startDate && $scope.dateRange.endDate) {
                    $timeout(() => {
                        $scope.dateList = makeDateList();
                        if ($scope.newsList) {
                            buildDateListAndDayNotes();
                        }
                    });
                }
            }

            function buildDateListAndDayNotes() {

                var tempDateList = $scope.dateList;
                if (tempDateList && $scope.newsList) {

                    wfDayNoteService.get({
                        'newsList': $scope.newsList,
                        'startDate': tempDateList[0].date.toISOString(),
                        'endDate': tempDateList[tempDateList.length - 1].date.clone().endOf('day').toISOString()
                    }).then((response) => {
                        let dayNotes = response.data.data;
                        tempDateList.map((date) => {

                            let dateDayNotes = dayNotes.filter((note) => {
                                return moment(note.day).isSame(date.date, 'day');
                            });
                            date.dayNotes = dateDayNotes ? dateDayNotes : [];
                            return date;
                        });
                        $scope.dateList = tempDateList;
                    });
                }
            }

            $scope.updateDayNote = function (id, newValue, date) {

                if (id) {

                    wfDayNoteService.updateField(id, 'note', newValue);
                } else {

                    $scope.newNote = '';

                    let newNote = {
                        'id': 0,
                        'note': newValue,
                        'day': date.date,
                        'newsList': $scope.newsList
                    };

                    $timeout(() => {
                        date.dayNotes.push(newNote);
                    });

                    wfDayNoteService.add(newNote).then(() => {
                        buildDateListAndDayNotes();
                        $scope.$emit('plan-view__day-note-added', newNote)
                    });
                }
            };

            function getItems (dateFrom, dateTo) {
                // search all of the planned items, and find the ones that
                // are within our date range
                return _.filter($scope.plannedItems, (item) => {
                    var ret = (item.plannedDate.isSame(dateFrom) || item.plannedDate.isAfter(dateFrom)) &&
                        item.plannedDate.isBefore(dateTo);
                    return ret;
                });
            }

            $scope.getNumDateItems = function(date) {
                return getItems(date, date.clone().add(1, 'days')).length;
            };

            $scope.ordinalToSuperScript = (date) => {
                let d = date.format('dddd Do'),
                    ordinal = d.slice(-2);
                return $sce.trustAsHtml(d.substring(0,d.length-2) + '<sup>' + ordinal + '</sup>');
            };

            $scope.isToday = (() => {
                let now = moment();
                return (date) => {
                    return date.isSame(now, 'day');
                }
            })();

            $scope.isInPast =  (() => {
                let now = moment();
                return (date) => {
                    return date.isBefore(now, 'day');
                }
            })();

            $scope.createItemFromDayNote = (dayNote, $event) => {

                $event.target.innerHTML = "Copying...";

                let newPlanItem = {
                    title: dayNote.note,
                    id: 0,
                    newsList: wfFiltersService.get('news-list') || 0,
                    plannedDate: dayNote.day,
                    bundleId: 0,
                    bucketed: false,
                    hasSpecificTime: false
                };

                wfPlannedItemService.add(newPlanItem).then(() => {
                    $scope.$emit('plan-view__planned-items-changed');
                    $scope.$emit('plan-view__item-created-from-day-note', newPlanItem);
                    $timeout(buildDateListAndDayNotes);
                    dayNote.loading = false;
                });
            }
        },
        link: ($scope) => {
            $scope.onSelect = function(date) {
                $scope.onSelectDate(date);
            };
        }
    }
}

export { wfDateView };
