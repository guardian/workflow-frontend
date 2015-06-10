import angular from 'angular';

import 'lib/filters-service';

angular.module('wfPlanToolbar', ['wfFiltersService'])
    .controller('wfPlanToolbarController', ['$scope', '$rootScope', 'wfFiltersService', function ($scope, $rootScope, wfFiltersService) {
        // controller stuff

        $scope.newsLists = _wfConfig.newsLists;

        var filterParams = wfFiltersService.getAll();
        var selectedNewsListId = parseInt(filterParams['news-list']);
        if (selectedNewsListId) {
            var newsList = $scope.newsLists.filter((nl) => nl.id === selectedNewsListId);
            $scope.selectedNewsList = newsList ? newsList[0] : null;
        } else {
            $scope.selectedNewsList = null;
        }


        $scope.$watch('selectedNewsList', function() {
            if ($scope.selectedNewsList === null) { // All lists
                $scope.$emit('plan-view__filters-changed.news-list', 'all');
            } else {
                $scope.$emit('plan-view__filters-changed.news-list', $scope.selectedNewsList.id);
            }
        })


    }]);
