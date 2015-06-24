import _ from 'lodash';

function wfDayView ($rootScope, wfPlannedItemService, $http, $timeout, wfFiltersService) {
    return {
        restrict: 'E',
        templateUrl: '/assets/components/plan-view/day-view/day-view.html',
        scope: {
            newsListName: '=',
            planItems: '=',
            selectedDate: '='
        },
        controller: function ($scope) {

            $scope.buckets = _wfConfig.newsListBuckets[$scope.newsListName] ? _wfConfig.newsListBuckets[$scope.newsListName] : _wfConfig.newsListBuckets['default'];

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
                        item.bucketStart = -1;
                        $scope.unscheduledItems.push(item);
                    } else {
                        for (let i = 0; i < $scope.buckets.length; i++) {

                            let bucket = $scope.buckets[i];

                            if (hour >= bucket.start && hour < bucket.end) {
                                item.bucketStart = i;
                                bucket.items.push(item);
                                break;
                            }
                        }
                    }
                });
            }

            $scope.$on('drag-start', ($event, item) => {
                $scope.draggingItem = item;
                $scope.$broadcast('drop-zones-show');
            });

            $scope.$on('drag-stop', ($event, item) => {
                $scope.$broadcast('drop-zones-hide');
            });

            $scope.$on('drop-zones-drop', ($event, droppedOnScope) => {

                $timeout(() => {

                    if ($scope.draggingItem.bucketStart) { // only do the DOM swap if the item already has a bucketStart
                        let currentBucket;

                        if ($scope.draggingItem.bucketStart > -1) { // bucketed
                            currentBucket = $scope.buckets[$scope.draggingItem.bucketStart];
                        } else { // unscheduled
                            currentBucket = $scope.unscheduledItems;
                        }

                        let indexInCurrentBucket = currentBucket.items.indexOf($scope.draggingItem);

                        currentBucket.items.splice(indexInCurrentBucket, 1);

                        droppedOnScope.bucket.items.push($scope.draggingItem);
                    }

                    // Update the item with its new bucket details
                    $scope.draggingItem.bucketed = true;
                    $scope.draggingItem.hasSpecificTime = false;
                    $scope.draggingItem.plannedDate.hours(droppedOnScope.bucket.start);
                    $scope.sourceBucketStart = null;
                    $scope.draggingItem.bucketStart = $scope.buckets.indexOf(droppedOnScope.bucket); // -1 if not found > unscheduled

                }).then(() => {

                    wfPlannedItemService.updateFields($scope.draggingItem.id, {
                        'bucketed': true,
                        'hasSpecificTime': false,
                        'plannedDate': $scope.draggingItem.plannedDate.toISOString()
                    }).then(() => {
                        $scope.$emit('plan-view__item-dropped-on-bucket', $scope.draggingItem);
                    });
                });
            });
        },
        link: ($scope, elem, attrs) => {

            $scope.toMeridiem = function (time) {
                if (time === 0 || time === 24) {
                    return 'midnight';
                }else if (time > 12) {
                    return (time - 12) + 'pm';
                } else if (time == 12) {
                    return time + 'pm';
                } else {
                    return time + 'am';
                }
            };

            $scope.addNewItemToBucket = (bucket, newItemName) => {

                let newItem = {
                    title: newItemName ? newItemName : "New Item",
                    id: 0,
                    newsList: wfFiltersService.get('news-list') || 0,
                    plannedDate: $scope.selectedDate.clone().hours(bucket.start).toISOString(),
                    bundleId: 0,
                    bucketed: true,
                    hasSpecificTime: false
                };

                $timeout(() => { // add directly to model
                    bucket.items.push(newItem);
                });

                wfPlannedItemService.add(newItem).then(() => { // persist to DB
                    delete $scope.newItemName;
                    $scope.$emit('plan-view__item-added-to-bucket-via-inline-add', newItem);1
                });
            };

            $timeout(() => {$rootScope.$emit('plan-view__ui-loaded')}, 700);
        }
    }
}

function comparePlannedItems(newPlannedItems, oldPlannedItems) {

    if (newPlannedItems.length !== oldPlannedItems.length) { return false; }

    for (let i = 0; i < newPlannedItems.length; i++) {
        if (!newPlannedItems[i].plannedDate.isSame(oldPlannedItems[i].plannedDate)) {
            return false;
        } else if (newPlannedItems[i].bundleId !== oldPlannedItems[i].bundleId) {
            return false;
        }
    }

    return true;
}

export { wfDayView };
