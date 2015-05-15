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

function wfDateView ($rootScope, $timeout, wfDayNoteService, $sce) {
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

            $scope.dateList = makeDateList();

            $scope.$watch('dateRange', (newValue, oldValue) => {
                if (newValue && newValue.startDate && newValue.endDate) {
                    $timeout(() => {
                        $scope.dateList = makeDateList();
                        if ($scope.newsList) {
                            buildDateListAndDayNotes()
                        };
                    });
                }
            }, true);

            function buildDateListAndDayNotes() {

                var tempDateList = $scope.dateList;
                if ($scope.newsList) {

                    wfDayNoteService.get({
                        'newsList': $scope.newsList,
                        'startDate': tempDateList[0].date.toISOString(),
                        'endDate': tempDateList[tempDateList.length - 1].date.toISOString()
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
                        'day': date.date.format('YYYY-MM-DD'),
                        'newsList': $scope.newsList
                    };
                    $timeout(() => {
                        date.dayNotes.push(newNote);

                    });
                    wfDayNoteService.add(newNote).then(() => {
                        buildDateListAndDayNotes();
                    });
                }
            };

            $scope.$watch('newsList', () => {
                buildDateListAndDayNotes();
            });

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
