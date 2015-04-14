function wfDayView ($rootScope) {
    return {
        restrict: 'E',
        templateUrl: '/assets/components/plan-view/day-view/day-view.html',
        scope: {
            planItems: '='
        },
        link: ($scope, elem, attrs) => {

            var PLANNED_ITEM_HEIGHT = 36,
                MINUTES_IN_A_DAY = 1440 + 60;

            $scope.height = elem[0].offsetHeight;
            $scope.width = elem[0].querySelector('.day-view__list').offsetWidth;

            $scope.timeValues = (function layOutTimeValues () {

                var elHeight = ($scope.height/25);

                var values = [
                    {label: 'Midnight', value: '0'},
                    {label: '1am', value: '1'},
                    {label: '2am', value: '2'},
                    {label: '3am', value: '3'},
                    {label: '4am', value: '4'},
                    {label: '5am', value: '5'},
                    {label: '6am', value: '6'},
                    {label: '7am', value: '7'},
                    {label: '8am', value: '8'},
                    {label: '9am', value: '9'},
                    {label: '10am', value: '10'},
                    {label: '11am', value: '11'},
                    {label: '12 ', value: '12'},
                    {label: '1pm', value: '13'},
                    {label: '2pm', value: '14'},
                    {label: '3pm', value: '15'},
                    {label: '4pm', value: '16'},
                    {label: '5pm', value: '17'},
                    {label: '6pm', value: '18'},
                    {label: '7pm', value: '19'},
                    {label: '8pm', value: '20'},
                    {label: '9pm', value: '21'},
                    {label: '10pm', value: '22'},
                    {label: '11pm', value: '23'},
                    {label: 'Midnight', value: '24'}];

                values.map((timeValue) => {

                    timeValue.style = {
                        'top': (elHeight * timeValue.value) + 'px',
                        'height': elHeight + 'px',
                        'line-height': elHeight + 'px'
                    };

                    return timeValue;
                });

                return values;
            })();

            $scope.calculatePlannedItemStyle = function (item) {


                return {
                    'height': inPx(PLANNED_ITEM_HEIGHT),
                    'width': inPx(($scope.width / item.conflictGroup.columnEndTimes.length)),
                    'top': inPx(item.start),
                    'left': inPx(($scope.width / item.conflictGroup.columnEndTimes.length) * item.col)
                }
            };

            $scope.onResize = function () {
                console.log('resize!!');
            };

            $scope.$watch('planItems', (newValue, oldValue) => {

                if (newValue && oldValue) {
                    if (!comparePlannedItems(newValue, oldValue)) {
                        newValue = processPlannedItems(newValue);
                    }
                }

                $scope.processedPlanItems = newValue;
            }, false);

            function processPlannedItems(items) {

                items = sortPlannedItemsByDate(items);

                console.log("PROCESS>>>", items)

                var conflictGroups = [],
                    currentConflictGroup = {
                        end: 0
                    },
                    currentColumnCount = 0;

                function assignConflictGroup(item) {

                    // Start a new conflict group if needed
                    if (item.start >= currentConflictGroup.end || conflictGroups.length === 0) {

                        conflictGroups.push({
                            end: 0,
                            columnEndTimes: [0] // 1 column with ending time of 0,
                        });
                        currentConflictGroup = conflictGroups[conflictGroups.length - 1]; // Most recent conflict group
                        currentColumnCount = 0;
                    }

                    item.conflictGroup = currentConflictGroup;

                    if (currentConflictGroup.end < item.end) { // Extend the end time of the conflict group
                        currentConflictGroup.end = item.end;
                    }
                }

                function assignColumn(item) {

                    item.col = currentColumnCount;

                    // Try to fit the item in to an existing column
                    var newColumnNeeded = true,
                        foundAColumn = false;

                    if (currentColumnCount !== 0) {

                        currentConflictGroup.columnEndTimes.forEach(function (columnEndTime, i) {

                            if (item.start > columnEndTime) {

                                if (!foundAColumn) {

                                    item.col = i;
                                    foundAColumn = true;
                                }
                                newColumnNeeded = false;
                            }
                        });
                    }

                    if (newColumnNeeded) {

                        currentColumnCount++;
                    }

                    // Update column end time
                    currentConflictGroup.columnEndTimes[item.col] = item.end;
                }

                items.forEach(function (item) {

                    item.start = ((minutesThroughDay(item.plannedDate) / MINUTES_IN_A_DAY) * $scope.height);
                    item.end = item.start + PLANNED_ITEM_HEIGHT;

                    assignConflictGroup(item);
                    assignColumn(item);
                });

                return items;
            }

        }
    }
}

function comparePlannedItems(newPlannedItems, oldPlannedItems) {

    if (newPlannedItems.length !== oldPlannedItems.length) { return false; }

    let equal = true;

    for (let i = 0; i < newPlannedItems.length; i++) {
        equal = newPlannedItems[i].plannedDate.isSame(oldPlannedItems[i].plannedDate);
    }

    return equal;
}

function sortPlannedItemsByDate(items) {
    return items.sort((a, b) => {
        if (a.plannedDate.isAfter(b.plannedDate)) {
            return 1;
        } else if (a.plannedDate.isBefore(b.plannedDate)) {
            return -1;
        } else { return 0; }
    });
}

function minutesThroughDay(date) {
    return (date.hours() * 60) + date.minutes();
}

function inPx(i) {
    return i + 'px';
}

export { wfDayView };
