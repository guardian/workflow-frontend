function wfDayViewPlanItem ($rootScope, $http, $timeout, wfContentService, wfBundleService, wfPlannedItemService) {
    return {
        restrict: 'A',
        templateUrl: '/assets/components/plan-view/day-view-plan-item/day-view-plan-item.html',
        scope: {
            item: '='
        },
        link: ($scope, elem, attrs) => {

            $scope.bundleList       = wfBundleService.list();
            $scope.getBundleName    = wfBundleService.getTitle;
            $scope.genColor         = wfBundleService.genBundleColor;

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

            $scope.shiftToTomorrow = function () {
                $scope.MoveToTomorrowLoading = true;
                $scope.updateField('plannedDate', $scope.item.plannedDate.add(1, 'day'));
            };

            $scope.startWork = function () {

                $scope.startWorkLoading = true;

                $scope.fakeStub = {
                    contentType: "article",
                    needsLegal: "NA",
                    priority: $scope.item.priority,
                    prodOffice: "UK",
                    section: {
                        id: 2,
                        name: "Technology",
                        selected: false
                    },
                    status: "Writers",
                    title: $scope.item.title,
                    note: $scope.item.notes
                };

                wfContentService.createInComposer($scope.fakeStub).then((response) => {

                    $scope.item.composerId = $scope.fakeStub.composerId;

                    return wfPlannedItemService.update($scope.item).then(() => {

                        window.location = "/dashboard?composerId=" + $scope.item.composerId;
                    });
                });
            };

            $scope.updateField = function (key, value) {

                $scope.$apply(() => {
                    $scope.item[key] = value;

                    console.log(key, value);

                    if (key === 'plannedDate') {
                        $scope.item.bucketed = false;
                        $scope.item.hasSpecificTime = true;
                    }

                    wfPlannedItemService.update($scope.item).then(() => {
                        if (key === 'plannedDate' || key === 'newsList') {
                            $scope.$emit('update-plan-item', $scope.item);
                        }
                    });
                });

            };

            $scope.updatePlannedDate = function () {

            }
        }
    }
}

export { wfDayViewPlanItem };
