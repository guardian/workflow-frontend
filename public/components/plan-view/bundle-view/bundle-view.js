import _ from 'lodash';

function wfBundleView ($rootScope, wfBundleService) {
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
                wfBundleService.get().then((response) => {
                    $scope.bundleList = response.data.data;
                });
            }
            refreshBundles();

            $scope.draggingStart = (event, ui, item) => {
                $scope.draggedItem = item;
                elem.addClass('bundle-view--dragging')
            };

            $scope.draggingStop = () => {
                elem.removeClass('bundle-view--dragging')
            };

            $scope.droppedOn = (event, ui) => {

                let el = ui.draggable.detach();

                let droppedItem = angular.element(event.target).scope().item;

                console.log($scope.draggedItem, droppedItem);

                wfBundleService.add({
                    title: 'My new bundle',
                    pk: 0
                }).then((response) => {
                    refreshBundles();
                    console.log(response);
                })


            };
        }
    }
}

export { wfBundleView };
