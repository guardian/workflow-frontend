import _ from 'lodash';

function wfUnscheduledView ($rootScope, wfPlannedItemService, $http, $timeout, wfFiltersService) {
    return {
        restrict: 'E',
        templateUrl: '/assets/components/plan-view/unscheduled-view/unscheduled-view.html',
        scope: {
            unscheduledItems: "=unscheduledItems"
        },
        controller: function ($scope) {
            $scope.dropZonesLocation = 'unscheduled-view';
        },
        link: ($scope, elem, attrs) => {

            $scope.quickAddHook = () => {
                console.log('abc');
            };

            $rootScope.$on('drag-start', ($event, item) => {
                $scope.draggingItem = item;
                $scope.$broadcast('drop-zones-show');
            });

            $rootScope.$on('drag-stop', ($event, item) => {
                $scope.$broadcast('drop-zones-hide');
            });

            $rootScope.$on('drop-zones-drop--' + $scope.dropZonesLocation, ($event, droppedOnScope) => {

                // TODO: add directly in to DOM

                $timeout(() => {
                    $scope.unscheduledItems.push($scope.draggingItem);
                });

                wfPlannedItemService.updateFields($scope.draggingItem.id, {
                    'bucketed': false,
                    'hasSpecificTime': false,
                    'plannedDate': ''
                }).then(() => {
                    $scope.$emit('plan-view__item-dropped-on-bucket', $scope.draggingItem);
                });

            });
        }
    }
}

export { wfUnscheduledView };
