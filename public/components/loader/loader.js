import loaderTemplate from './loader.html';

function wfLoader ($rootScope) {
    return {
        restrict: 'E',
        templateUrl: loaderTemplate.templateUrl,
        scope: {
            event: '@event'
        },
        link: ($scope, elem, attrs) => {

            var removeEvent = $rootScope.$on($scope.event, () => {
                elem.remove();
                removeEvent();
            });
        }
    }
}

export { wfLoader };
