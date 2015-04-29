import _ from 'lodash';

function wfDayView ($rootScope, wfPlannedItemService, $http, $timeout) {
    return {
        restrict: 'E',
        templateUrl: '/assets/components/plan-view/day-view/day-view.html',
        scope: {
            newsListName: '=',
            planItems: '=',
            selectedDate: '='
        },
        controller: function ($scope) {
            $scope.draggableOptions = {
                helper: 'clone',
                cursorAt: {
                    top: 12,
                    left: 12
                },
                containment: '.content-list',
                refreshPositions: true,
                axis: 'y',
                snap: '.bucket__drop-zone',
                snapMode: 'inner',
                revert: 'invalid'
            };

            _wfConfig.planBuckets = {
                'default': [
                    {start: 0, end: 6},
                    {start: 6, end: 9},
                    {start: 9, end: 12},
                    {start: 12, end: 15},
                    {start: 15, end: 18},
                    {start: 18, end: 24}
                ]
            };

            $scope.buckets = _wfConfig.planBuckets[$scope.newsListName] ? _wfConfig.planBuckets[$scope.newsListName] : _wfConfig.planBuckets['default'];

            $scope.buckets.map((bucket) => {
                bucket.items = [];
            });

            $scope.unscheduledItems = [];

            $scope.$watchCollection(() => $scope.planItems, (newValue, oldValue) => {

                if (newValue && oldValue) {
                    if (!comparePlannedItems(newValue, oldValue)) {

                        processPlanItems(newValue);
                    }
                }
            }, true);

            $scope.$on('plan-view__update-plan-item', ($event, newItem) => {

                // Stupid Angular Shit

                $scope.planItems = $scope.planItems.map((item) => {
                    if (item.id === newItem.id) {
                        return newItem;
                    } else {
                        return item;
                    }
                });

                processPlanItems($scope.planItems);
            });

            function processPlanItems (sortedItems) {

                $scope.unscheduledItems.length = 0;

                $scope.buckets.forEach((bucket) => {
                    bucket.items.length = 0;
                });

                sortedItems.forEach((item) => {

                    if (!moment.isMoment(item.plannedDate)) { item.plannedDate = moment(item.plannedDate); }

                    let hour = item.plannedDate.hours();

                    if (!item.bucketed && !item.hasSpecificTime) {
                        $scope.unscheduledItems.push(item);
                    } else {
                        for (let i = 0; i < $scope.buckets.length; i++) {

                            let bucket = $scope.buckets[i];

                            if (hour >= bucket.start && hour < bucket.end) {

                                bucket.items.push(item);
                                break;
                            }
                        }
                    }
                });
            }
        },
        link: ($scope, elem, attrs) => {

            $scope.toMeridiem = function (time) {
                if (time === 0 || time === 24) {
                    return 'Midnight';
                }else if (time > 12) {
                    return (time - 12) + 'pm';
                } else if (time == 12) {
                    return time + 'pm';
                } else {
                    return time + 'am';
                }
            };

            $scope.draggingStart = (event, ui, item) => {
                $scope.draggedItem = item;
                elem.addClass('day-view--dragging')
            };

            $scope.draggingStop = () => {
                elem.removeClass('day-view--dragging')
            };

            $scope.droppedOn = (event, ui) => {

                var el = ui.draggable.detach();

                $scope.draggedItem.bucketed = true;
                $scope.draggedItem.hasSpecificTime = false;

                $scope.draggedItem.plannedDate.hours(event.target.getAttribute('data-bucket-start'));

                wfPlannedItemService.updateFields($scope.draggedItem.id, {
                    'bucketed': true,
                    'hasSpecificTime': false,
                    'plannedDate': $scope.draggedItem.plannedDate.toISOString()
                });
            };
        }
    }
}

//function sortPlannedItemsByDate(items) {
//    return items.sort((a, b) => {
//        if (a.plannedDate.isAfter(b.plannedDate)) {
//            return 1;
//        } else if (a.plannedDate.isBefore(b.plannedDate)) {
//            return -1;
//        } else { return 0; }
//    });
//}

function comparePlannedItems(newPlannedItems, oldPlannedItems) {

    if (newPlannedItems.length !== oldPlannedItems.length) { return false; }

    let equal = true;

    for (let i = 0; i < newPlannedItems.length; i++) {
        equal = newPlannedItems[i].plannedDate.isSame(oldPlannedItems[i].plannedDate);
    }

    return equal;
}

export { wfDayView };
