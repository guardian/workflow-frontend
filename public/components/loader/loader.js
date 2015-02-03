function wfLoader ($rootScope) {
    return {
        restrict: 'E',
        templateUrl: '/assets/components/loader/loader.html',
        scope: {
            event: '@event'
        },
        link: ($scope, elem, attrs) => {

            var removeEvent = $rootScope.$on($scope.event, () => {
                console.log('remove');
                elem.remove();
                removeEvent();
            });
        }
    }
}

export { wfLoader };
