import sectionTemplate from './content-list-drawer-section.html';

export function wfContentListDrawerSection ($rootScope) {
    return {
        restrict: 'A',
        transclude: true,
        template: sectionTemplate,
        link: ($scope, elem, attrs) => {
          console.log($scope);
        }
    }
}
