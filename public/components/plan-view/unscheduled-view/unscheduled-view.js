import _ from 'lodash';

function wfUnscheduledView ($rootScope, wfPlannedItemService, $http, $timeout, wfFiltersService) {
    return {
        restrict: 'E',
        templateUrl: '/assets/components/plan-view/unscheduled-view/unscheduled-view.html',
        scope: {
            unscheduledItems: "=unscheduledItems"
        },
        controller: function ($scope) {
            //wfPlannedItemService.getUnscheduledItems().then((response) => {
            //    $timeout(() => {
            //        $scope.unscheduledItems = response.data.data[0].items; // ???
            //    });
            //})
        },
        link: ($scope, elem, attrs) => {

        }
    }
}

export { wfUnscheduledView };
