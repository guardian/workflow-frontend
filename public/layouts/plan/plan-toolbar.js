import angular from 'angular';

import 'lib/filters-service';

angular.module('wfPlanToolbar', ['wfFiltersService'])
    .controller('wfPlanToolbarController', ['$scope', '$rootScope', 'wfFiltersService', function ($scope, $rootScope, wfFiltersService) {
        // controller stuff

        $scope.newsLists = _wfConfig.newsLists;

        var filterParams = wfFiltersService.getAll();
        var selectedNewsListId = filterParams['news-list'];
        $scope.selectedNewsList = selectedNewsListId ? $scope.newsLists[selectedNewsListId - 1] : null;


        $scope.$watch('selectedNewsList', function() {
            console.log("selected news list changed");
            if ($scope.selectedNewsList === null) { // All lists
                $scope.$emit('pvFiltersChanged.news-list', 'all');
            } else {
                $scope.$emit('pvFiltersChanged.news-list', $scope.selectedNewsList.id);
            }
        })


    }]);
