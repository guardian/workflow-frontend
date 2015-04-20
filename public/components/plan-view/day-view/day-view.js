function wfDayView ($rootScope, $http) {
    return {
        restrict: 'E',
        templateUrl: '/assets/components/plan-view/day-view/day-view.html',
        scope: {
            newsListName: '=',
            planItems: '='
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

            $scope.draggingStart = (event, ui, item) => {
                $scope.draggedItem = item;
                elem.addClass('day-view--dragging')
            };

            $scope.draggingStop = () => {
                elem.removeClass('day-view--dragging')
            };

            $scope.droppedOn = (event, ui) => {

                var el = ui.draggable.detach();

                el.appendTo(event.target.parentNode);

                console.log('drop!', $scope.draggedItem);

                $http.post("/api/v1/plan/item", JSON.stringify($scope.draggedItem));

                //$scope.locked = true;
                //
                //// Ripped from content-list-item.js:190
                //var newStatus = event.target.getAttribute('data-status')
                //
                //var msg = {
                //    contentItem: $scope.droppedModel,
                //    data: {},
                //    oldValues: {},
                //    source: $scope.statusValues
                //};
                //
                //msg.data['status'] = newStatus;
                //msg.oldValues['status'] = $scope.droppedModel.status;
                //
                //$scope.$emit('contentItem.update', msg);
                //
                //var unbind = $rootScope.$on('contentItem.updated', () => {
                //
                //    var temp = event.target.innerHTML;
                //    event.target.classList.add(classes.success);
                //    event.target.innerHTML = '<img class="dnd__success" src="/assets/components/icons/png/tick.png" alt=""/>';
                //
                //
                //    notify('Workflow', {
                //        icon: '/assets/favicon128.ico',
                //        body: '"' + $scope.droppedModel.workingTitle + '" was moved to ' + newStatus
                //    });
                //
                //
                //    $timeout(() => {
                //
                //        elem.removeClass(classes.show);
                //        event.target.classList.remove(classes.success);
                //        event.target.innerHTML = temp;
                //        $scope.locked = false;
                //    }, 750);
                //
                //    unbind(); // Unbind contentItem.updated
                //});
            };
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
