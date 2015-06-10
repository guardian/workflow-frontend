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

            $scope.draggableOptions = {
                helper: 'clone',
                containment: '.day-view',
                refreshPositions: true,
                axis: 'y',
                handle: '.plan-item__item-drag-handle',
                scroll: true,
                revert: 'invalid'
            };

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
                    return 'midnight';
                }else if (time > 12) {
                    return (time - 12) + 'pm';
                } else if (time == 12) {
                    return time + 'pm';
                } else {
                    return time + 'am';
                }
            };

            $scope.droppedOn = (event, ui) => {

                var el = ui.draggable.detach();

                $timeout(() => {
                    $scope.draggedItem.bucketed = true;
                    $scope.draggedItem.hasSpecificTime = false;
                    $scope.draggedItem.plannedDate.hours(event.target.getAttribute('data-bucket-start'));
                    $scope.sourceBucketStart = null;
                }).then( () => {

                    wfPlannedItemService.updateFields($scope.draggedItem.id, {
                        'bucketed': true,
                        'hasSpecificTime': false,
                        'plannedDate': $scope.draggedItem.plannedDate.toISOString()
                    }).then(() => {
                        $scope.$emit('plan-view__item-dropped-on-bucket', $scope.draggedItem);
                    });
                });
            };

            $scope.sourceBucketStart = null;

            $scope.draggingStart = (event, ui, item, bucket) => {
                $timeout(() => {$scope.sourceBucketStart = bucket ? bucket.start : null});
                $scope.draggedItem = item;
                elem.addClass('day-view--dragging');
                $scope.dragScrollBoxEl = ui.helper.parents('.day-view');
                $scope.dragStartOffset = $scope.dragScrollBoxEl.scrollTop();
            };

            $scope.onDrag = (event, ui) => {
                ui.position.top = ui.position.top + ($scope.dragScrollBoxEl.scrollTop() - $scope.dragStartOffset);
            };

            $scope.draggingStop = () => {
                elem.removeClass('day-view--dragging')
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
