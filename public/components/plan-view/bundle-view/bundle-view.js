import _ from 'lodash';

function wfBundleView ($rootScope, $timeout, wfBundleService, wfPlannedItemService) {
    return {
        restrict: 'E',
        templateUrl: '/assets/components/plan-view/bundle-view/bundle-view.html',
        scope: {
            'plannedItemsByBundle': '=bundleItems'
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
                snap: '.bundle__drop-zone',
                snapMode: 'inner',
                revert: 'invalid',

                // For droppable on same item

                tolerance: 'pointer',
                hoverClass: 'dnd__status--hovered'
            };
        },
        link: ($scope, elem, attrs) => {

            function refreshBundles() {
                wfBundleService.getList().then((response) => {
                    $scope.bundleList = response.data.data;
                });
            }
            refreshBundles();

            $scope.getBundleName    = wfBundleService.getTitle;
            $scope.genColor         = wfBundleService.genBundleColor;

            $scope.draggingStart = (event, ui, item) => {
                $scope.draggedItem = item;
                elem.addClass('bundle-view--dragging')
            };

            $scope.draggingStop = () => {
                elem.removeClass('bundle-view--dragging')
            };

            $scope.droppedOn = (event, ui) => {

                let droppedItem = angular.element(event.target).scope().item;

                wfBundleService.add({
                    title: 'New Bundle',
                    pk: 0
                }).then((response) => {
                    refreshBundles();

                    $scope.draggedItem.bundleId = response.data.data;
                    droppedItem.bundleId = response.data.data;

                    Promise.all([
                        wfPlannedItemService.updateField($scope.draggedItem.id, 'bundleId', response.data.data),
                        wfPlannedItemService.updateField(droppedItem.id, 'bundleId', response.data.data)
                    ]).then(() => {
                        $scope.$emit('plan-view__bundles-edited');
                    });
                })


            };

            /**
             * Find the dragged item in the model and move it to the new bundle,
             * update the server with the new bundle id of the item.
             * @param event
             * @param ui
             */
            $scope.droppedOnExistingBundle = (event, ui) => {

                let droppedBundle = angular.element(event.target).scope().bundle;

                let draggedItemIndex = _.findIndex($scope.plannedItemsByBundle[$scope.draggedItem.bundleId].itemsToday, (item) => {
                    return item.id === $scope.draggedItem.id
                });

                let draggedItem = $scope.plannedItemsByBundle[$scope.draggedItem.bundleId]
                    .itemsToday
                    .splice(draggedItemIndex, 1)[0];

                $timeout(()=>{
                    droppedBundle.itemsToday
                        .push(draggedItem);
                });

                draggedItem.bundleId = droppedBundle.pk;

                wfPlannedItemService.updateField($scope.draggedItem.id, 'bundleId', droppedBundle.pk).then(() => {
                    $scope.$emit('plan-view__bundles-edited');
                });
            };

            $scope.updateTitle = (bundle, value) => {
                bundle.title = value;
                wfBundleService.update(bundle);
            }
        }
    }
}

export { wfBundleView };
