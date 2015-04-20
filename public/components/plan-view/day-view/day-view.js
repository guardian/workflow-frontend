function wfDayView ($rootScope) {
    return {
        restrict: 'E',
        templateUrl: '/assets/components/plan-view/day-view/day-view.html',
        scope: {
            newsListName: '=',
            planItems: '='
        },
        link: ($scope, elem, attrs) => {

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

            $scope.toMeridiem = function (time) {
                if (time > 12) {
                    return (time - 12) + 'PM';
                } else if (time == 12) {
                    return time + 'PM';
                } else {
                    return time + 'AM';
                }
            };
            $scope.$watch('planItems', function (newValue, oldValue) {

                if (newValue && oldValue) {
                    if (!comparePlannedItems(newValue, oldValue)) {

                        console.log("updating", newValue, oldValue)

                        let sortedItems = sortPlannedItemsByDate(newValue);

                        $scope.buckets.forEach((bucket) => {
                            bucket.items = [];
                        });

                        sortedItems.forEach((item) => {

                            let hour = item.plannedDate.hours();

                            for (let i = 0; i < $scope.buckets.length; i++) {

                                let bucket = $scope.buckets[i];

                                if (hour >= bucket.start && hour < bucket.end) {

                                    bucket.items.push(item);
                                    break;
                                }
                            }
                        });
                    }
                }
            }, true);


        }
    }
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

function comparePlannedItems(newPlannedItems, oldPlannedItems) {

    if (newPlannedItems.length !== oldPlannedItems.length) { return false; }

    let equal = true;

    for (let i = 0; i < newPlannedItems.length; i++) {
        equal = newPlannedItems[i].plannedDate.isSame(oldPlannedItems[i].plannedDate);
    }

    return equal;
}

export { wfDayView };
