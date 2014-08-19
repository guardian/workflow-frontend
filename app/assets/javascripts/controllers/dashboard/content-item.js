define([
    'angular',
    '../dashboard'
], function (
    angular,
    dashboardControllers
    ) {
    'use strict';

    dashboardControllers.controller('ContentItemCtrl', ['$scope', '$http', function($scope, $http){
        var content = $scope.content;

        $scope.$watch('content.status', function(newValue, oldValue) {
            if (newValue !== oldValue) {
                $http({
                    method: 'PUT',
                    url: '/api/content/' + content.composerId + '/status',
                    data: {'data': newValue}
                }).then(function(){
                  $scope.$emit('content.statusChanged', {
                    content: content,
                    status: newValue,
                    oldStatus: oldValue
                  });

                  $scope.$emit('getContent');
                });
            }
        });

    }]);

    return dashboardControllers;

});
