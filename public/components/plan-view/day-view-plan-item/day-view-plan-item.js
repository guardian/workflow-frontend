function wfDayViewPlanItem ($rootScope, $http, $timeout) {
    return {
        restrict: 'A',
        templateUrl: '/assets/components/plan-view/day-view-plan-item/day-view-plan-item.html',
        scope: {
            item: '='
        },
        link: ($scope, elem, attrs) => {

            $scope.drawerOpen = false;

            $scope.newsLists = _wfConfig.newsLists;

            $scope.priorities = [{
                value: 0,
                title: 'Normal'
            },{
                value: 1,
                title: 'High'
            },{
                value: 2,
                title: 'Very High'
            }];

            $scope.openDrawer = function () {
                $scope.drawerOpen = !$scope.drawerOpen;
            };

            $scope.shiftToTomorrow = function () {
               $scope.onUpdateField('plannedDate', $scope.item.plannedDate.add(1, 'day'));
            };

            $scope.onUpdateField = function (key, value) {

                $timeout(() => {
                    $scope.item[key] = value;
                    $http.post("/api/v1/plan/item", JSON.stringify($scope.item));
                    if (key === 'plannedDate' || key === 'newsList') { $scope.$on('update-plan-items'); }
                });

            };
        }
    }
}

export { wfDayViewPlanItem };
