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
            //wfPlannedItemService.getUnscheduledItems().then((response) => {
            //    $timeout(() => {
            //        $scope.unscheduledItems = response.data.data[0].items; // ???
            //    });
            //})
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

            $rootScope.$on('drop-zones-drop' + $scope.dropZonesLocation, ($event, droppedOnScope) => {

            });
        }
    }
}

export { wfUnscheduledView };
