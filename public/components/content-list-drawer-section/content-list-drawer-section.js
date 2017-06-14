import sectionTemplate from './content-list-drawer-section.html';

export function wfContentListDrawerSection ($rootScope) {
    return {
        restrict: 'A',
        transclude: true,
        template: sectionTemplate,
        scope: {
            sectionOpen: '@wfSectionOpen'
        },
        link: ($scope, elem, attrs) => {
            $scope.toggleSection = function() {
                $scope.sectionOpen = !$scope.sectionOpen;
                console.log($scope.sectionOpen);
            }
        }
    }
}
