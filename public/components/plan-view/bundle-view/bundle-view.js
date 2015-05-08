import _ from 'lodash';

function wfBundleView ($rootScope, $timeout, wfBundleService, wfPlannedItemService, wfFiltersService) {
    return {
        restrict: 'E',
        templateUrl: '/assets/components/plan-view/bundle-view/bundle-view.html',
        scope: {
            'dayItemsByBundle': '=bundleItems',
            'selectedDate': '='
        },
        controller: function ($scope) {
            $scope.bundleDraggableOptions = {
                helper: 'clone',
                //cursorAt: {
                //    top: 12,
                //    left: 12
                //},
                containment: '.bundle-view',
                refreshPositions: true,
                axis: 'y',
                //snap: '.bundle__drop-zone',
                //snapMode: 'inner',
                revert: 'invalid',
                handle: '.plan__drag-handle',

                // For droppable on same item

                tolerance: 'pointer',
                hoverClass: 'dnd__status--hovered',
                scroll: true
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
                debugger;
                $scope.draggedItem = item;
                elem.addClass('bundle-view--dragging')
            };

            $scope.draggingStop = () => {
                elem.removeClass('bundle-view--dragging')
            };

            /**
             * Create a new bundle from the result of dropping one item on to another. New bundle contains both items.
             * @param event
             * @param ui
             */
            $scope.droppedOn = (event, ui) => {

                let droppedOnItem = ui.draggable.scope().item; // Weird because there is a drag and a drop on the same item - but works.

                wfBundleService.add({
                    title: 'Unnamed bundle',
                    id: 0
                }).then((response) => {
                    refreshBundles();

                    $timeout(() => { // Create the bundle in the UI instantly

                        $scope.draggedItem.bundleId = response.data.data;
                        droppedOnItem.bundleId = response.data.data;

                        $scope.dayItemsByBundle[0].itemsToday = $scope.dayItemsByBundle[0]
                            .itemsToday
                            .filter((item) => {
                                return item.id !== $scope.draggedItem.id &&
                                    item.id  !== droppedOnItem.id;
                            });

                        $scope.dayItemsByBundle.push({
                            itemsToday: [$scope.draggedItem, droppedOnItem],
                            id: response.data.data,
                            title: 'Unnamed bundle'
                        });
                    });

                    Promise.all([
                        wfPlannedItemService.updateField($scope.draggedItem.id, 'bundleId', response.data.data),
                        wfPlannedItemService.updateField(droppedOnItem.id, 'bundleId', response.data.data)
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
                let draggedItem = util.removeItemFromCurrentBundle($scope.draggedItem);

                wfPlannedItemService.updateField($scope.draggedItem.id, 'bundleId', droppedBundle.id).then(() => {

                    $timeout(() => { // Create the bundle in the UI instantly

                        draggedItem.bundleId = droppedBundle.id;

                        $scope.$emit('plan-view__bundles-edited');
                    });
                });
            };

            /**
             * Remove an item from its bundle and add it back as an unbundled item, update the server
             * @param removingItem
             */
            $scope.$on('plan-view__remove-item-from-bundle', (event, removingItem) => {

                let removedItem = util.removeItemFromCurrentBundle(removingItem);

                wfPlannedItemService.updateField(removedItem.id, 'bundleId', 0).then(() => {

                    $timeout(() => {

                        removingItem.bundleId = 0;
                        removedItem.bundleId = 0;
                        $scope.dayItemsByBundle[0]
                            .itemsToday
                            .push(removedItem);

                        $scope.$emit('plan-view__bundles-edited');
                    });
                });
            });

            /**
             * Update the title of a bundle
             * @param bundle
             * @param value
             */
            $scope.updateTitle = (bundle, value) => {

                $timeout(() => {

                    bundle.title = value;
                    wfBundleService.updateTitle(bundle.id, value);
                });
            };

            $scope.addNewItemToBundle = (bundle) => {

                wfPlannedItemService.add({
                    title: "My title",
                    id: 0,
                    newsList: wfFiltersService.get('news-list') || 0,
                    plannedDate: $scope.selectedDate.toISOString(),
                    bundleId: bundle.id
                }).then(() => {

                });
            };

            var util = {

                /**
                 * Maintaining references, using an items bundle id, find the correct bundle and remove the item from the model.
                 * TODO: Possibly replace by passing bundle through from UI
                 * @param removedItem
                 * @returns {*}
                 */
                removeItemFromCurrentBundle: (removedItem) => {

                    let itemBundleIndex = _.findIndex($scope.dayItemsByBundle, (bundle) => bundle.id === removedItem.bundleId);
                    let itemIndex = _.findIndex($scope.dayItemsByBundle[itemBundleIndex].itemsToday, (item) => item.id === removedItem.id);

                    return $scope.dayItemsByBundle[itemBundleIndex]
                        .itemsToday
                        .splice(itemIndex, 1)[0];
                }
            }
        }
    }
}

export { wfBundleView };
