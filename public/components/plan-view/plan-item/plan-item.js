function wfPlanItem ($rootScope, $http, $timeout, wfContentService, wfBundleService, wfPlannedItemService) {
    return {
        restrict: 'A',
        templateUrl: '/assets/components/plan-view/plan-item/plan-item.html',
        scope: {
            item: '=',
            variant: '=',
            bundle: '='
        },
        controller: ($scope) => {
            $scope.bundleList = wfBundleService.list();
            $scope.getBundleName = wfBundleService.getTitle;
            $scope.genColor = wfBundleService.genBundleColor;
            $scope.drawerOpen = false;
            $scope.awaitingDeleteConfirmation = false;
            $scope.newsLists = _wfConfig.newsLists;
            $scope.sections = _wfConfig.sections;
            $scope.currentDatePickerValue = $scope.item.plannedDate ? $scope.item.plannedDate : undefined;
            $scope.composerViewUrl = _wfConfig.composer.view;
            $scope.priorities = [{
                value: 0,
                title: 'Normal'
            }, {
                value: 1,
                title: 'High'
            }, {
                value: 2,
                title: 'Very High'
            }];
        },
        link: ($scope, elem, attrs) => {

            $scope.shiftToTomorrow = function () {
                $scope.MoveToTomorrowLoading = true;
                $scope.updateField('plannedDate', $scope.item.plannedDate.add(1, 'day')).then(() => {
                    elem.remove();
                });
            };

            $scope.startWork = function () {

                $scope.startWorkLoading = true;

                $scope.fakeStub = {
                    contentType: "article",
                    needsLegal: "NA",
                    priority: $scope.item.priority,
                    prodOffice: "UK",
                    section: $scope.getSection(),
                    status: "Writers",
                    title: $scope.item.title,
                    note: $scope.item.notes
                };

                wfContentService.createInComposer($scope.fakeStub).then((response) => {

                    $timeout(() => {
                        $scope.item.composerId = $scope.fakeStub.composerId;
                    });

                    return wfPlannedItemService.updateField($scope.item.id, 'composerId', $scope.fakeStub.composerId);
                });
            };

            $scope.getSection = () => {
                let itemNewsList = $scope.newsLists.filter((ns) => ns.id === $scope.item.newsList)[0];
                return $scope.sections.filter((s) => s.id === itemNewsList.default_section)[0];
            };

            $scope.updateField = function (key, value) {

                return new Promise((resolve, reject) => {

                    let postUpdateHook = () => {
                        if (key === 'plannedDate' || key === 'newsList') {
                            $scope.$emit('plan-view__update-plan-item', $scope.item);
                        }
                        resolve(true);
                    };

                    $timeout(() => {

                        if (key === 'plannedDate') {
                            $scope.item[key] = moment(value);
                            $scope.item.bucketed = false;
                            $scope.item.hasSpecificTime = true;

                            wfPlannedItemService.updateFields($scope.item.id, {
                                'bucketed': false,
                                'hasSpecificTime': true,
                                'plannedDate': value
                            }).then(postUpdateHook);
                        } else {

                            $scope.item[key] = value;
                            wfPlannedItemService.updateField($scope.item.id, key, value)
                                .then(postUpdateHook);
                        }
                    });
                });

            };

            $scope.removeFromBundleProxy = (item) => {
                $scope.$emit('plan-view__remove-item-from-bundle', item);
            };

            $scope.deletePlanItem = () => {
                if ($scope.awaitingDeleteConfirmation) {
                    wfPlannedItemService.remove($scope.item).then(()=> {
                            $rootScope.$broadcast('plan-view__plan-item-deleted', $scope.item);
                            $scope.drawerOpen = false;
                    });
                } else {
                    $scope.awaitingDeleteConfirmation = true;
                }

            }
        }
    }
}

export { wfPlanItem };
